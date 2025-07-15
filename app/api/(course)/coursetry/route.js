// app/api/coursetry/route.js   – Next 15 (App Router, JS)
import { google } from 'googleapis'
import { Types } from 'mongoose'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import dbConnect from '@/config/connectDB'
import TrialCourse from '@/models/coursetry'
import User from '@/models/users'
import Area from '@/models/area'
import Book from '@/models/book'
import PostStudent from '@/models/student'
import jsonRes from '@/utils/response'

const TRIAL_ID = new Types.ObjectId('6871bc14ada3650715efc786')
const PARENT_ID = '1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf'
const TAG = 'data_coursetry'
const driveScopes = ['https://www.googleapis.com/auth/drive']

/* ------------ Google Drive helper ------------ */
async function getDrive() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes: driveScopes
    })
    return google.drive({ version: 'v3', auth })
}

async function createUniqueFolder(name) {
    const drive = await getDrive()
    const { data } = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and trashed=false and '${PARENT_ID}' in parents and name contains '${name}'`,
        fields: 'files(id,name)'
    })
    const dupCount = data.files?.length ?? 0
    const finalName = dupCount ? `${name}-${dupCount}` : name
    const res = await drive.files.create({
        requestBody: {
            name: finalName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [PARENT_ID]
        },
        fields: 'id'
    })
    return res.data.id
}

export async function GET() {
    try {
        await dbConnect()

        const course = await TrialCourse.findById(TRIAL_ID)
            .populate('sessions.teacher', 'name phone')
            .populate('sessions.teachingAs', 'name phone')
            .populate('sessions.book', 'Name Topics')
            .lean()

        if (!course) return jsonRes(404, { status: false, mes: 'Trial course không tồn tại', data: null })

        /* gom id phòng + id học sinh */
        const roomIds = new Set()
        const stuIds = new Set()
        course.sessions.forEach(s => {
            if (s.room) roomIds.add(String(s.room))
            s.students.forEach(st => stuIds.add(st.studentId))
        })

        /* map phòng */
        const roomMap = new Map()
        await Area.find(
            { 'rooms._id': { $in: [...roomIds].map(id => new Types.ObjectId(id)) } },
            { 'rooms.$': 1 }
        ).lean().then(res =>
            res.forEach(a => a.rooms.forEach(r => roomMap.set(String(r._id), { _id: r._id, name: r.name })))
        )
        const stuMap = new Map()
        await PostStudent.find(
            { _id: { $in: [...stuIds] } },
            { Name: 1, Trial: 1, Phone: 1, ID: 1 }
        ).lean().then(res =>
            res.forEach(st => {
                stuMap.set(String(st._id), {
                    _id: st._id,
                    name: st.Name,
                    statuses: st.Trial,
                    phone: st.Phone || '',
                    id: st.ID
                })
            })
        )

        const uniqStu = new Set()

        course.sessions = course.sessions.map(s => {
            const roomObj = roomMap.get(String(s.room)) || null
            const topic = s.book?.Topics?.find(t => String(t._id) === String(s.topicId)) || null

            const students = s.students.map(st => {
                const info = stuMap.get(String(st.studentId)) || {}
                uniqStu.add(String(st.studentId))
                return { ...st, ...info }
            })

            return {
                ...s,
                room: roomObj,
                book: s.book ? { _id: s.book._id, name: s.book.Name } : null,
                topic,
                students,
                teacher: s.teacher || null,
                teachingAs: s.teachingAs || null
            }
        })

        const payload = {
            _id: course._id,
            name: course.name,
            code: course.code ?? null,
            sessions: course.sessions,
            totalSessions: course.sessions.length,
            totalStudents: uniqStu.size
        }

        return new NextResponse(JSON.stringify({ status: true, mes: 'Success', data: payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-nextjs-cache-tag': TAG }
        })
    } catch (err) {
        console.error('[GET /coursetry]', err)
        return jsonRes(500, { status: false, mes: 'Lỗi máy chủ', data: null })
    }
}

export async function POST(request) {
    try {
        await dbConnect()

        const {
            day, time, room, book, topicId,
            teacher, teachingAs,
            studentIds = [],
            note = ''
        } = await request.json()

        if (!day || !time || !room || !book || !topicId)
            return jsonRes(400, { status: false, mes: 'Thiếu trường bắt buộc.', data: null })
        const course = await TrialCourse.findById(TRIAL_ID).lean()
        if (!course)
            return jsonRes(404, { status: false, mes: 'TrialCourse không tồn tại.', data: null })
        const sessionId = new Types.ObjectId()

        const session = {
            _id: sessionId,
            day: new Date(day),
            time,
            room: new Types.ObjectId(room),
            folderId: await createUniqueFolder(day),
            book: new Types.ObjectId(book),
            topicId: new Types.ObjectId(topicId),
            students: studentIds.map(id => ({ studentId: id })),
            teacher: teacher ? new Types.ObjectId(teacher) : undefined,
            teachingAs: teachingAs ? new Types.ObjectId(teachingAs) : undefined,
            note
        }
        await TrialCourse.updateOne(
            { _id: TRIAL_ID },
            { $push: { sessions: session } }
        )
        if (studentIds.length) {
            await PostStudent.bulkWrite(
                studentIds.map(id => ({
                    updateOne: {
                        filter: { _id: new Types.ObjectId(id) },
                        update: {
                            $addToSet: {
                                Trial: { topic: sessionId, note: '', status: 1 }
                            }
                        }
                    }
                }))
            )
        }
        revalidateTag(TAG)
        return jsonRes(201, { status: true, mes: 'Thêm buổi học thử thành công!', data: session })
    } catch (e) {
        console.error('[POST /coursetry]', e)
        const code = e.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: 'Lỗi máy chủ', data: null })
    }
}