import { Types } from 'mongoose'
import dbConnect from '@/config/connectDB'
import TrialCourse from '@/models/coursetry'
import jsonRes from '@/utils/response'

const TRIAL_ID = '6871bc14ada3650715efc786'

export async function GET() {
    try {
        await dbConnect()
        const [summary] = await TrialCourse.aggregate([
            { $match: { _id: new Types.ObjectId(TRIAL_ID) } },

            {
                $facet: {
                    main: [
                        { $addFields: { totalSessions: { $size: '$sessions' } } },
                        {
                            $project: {
                                _id: 0,
                                name: 1,      
                                code: 1,
                                sessions: 1,
                                totalSessions: 1
                            }
                        }
                    ],
                    students: [
                        { $unwind: '$sessions' },
                        { $unwind: '$sessions.students' },
                        { $group: { _id: '$sessions.students.studentId' } }
                    ]
                }
            },
            {
                $project: {
                    name: { $first: '$main.name' },
                    code: { $first: '$main.code' },
                    sessions: { $first: '$main.sessions' },
                    totalSessions: { $first: '$main.totalSessions' },
                    totalStudents: { $size: '$students' }
                }
            }
        ]).allowDiskUse(true)

        if (!summary) {
            return jsonRes(404, { status: false, mes: 'TrialCourse not found', data: null })
        }

        return jsonRes(200, { status: true, mes: 'Success', data: summary })
    } catch (err) {
        console.error('[Trial summary error]', err)
        return jsonRes(500, { status: false, mes: 'Server error', data: null })
    }
}
