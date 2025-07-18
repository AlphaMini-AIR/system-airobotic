import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import PostUser from '@/models/users';
import PostArea from '@/models/area';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';

const APPSCRIPT_URL =
    'https://script.google.com/macros/s/AKfycby4HNPYOKq-XIMpKMqn6qflHHJGQMSSHw6z00-5wuZe5Xtn2OrfGXEztuPj1ynKxj-stw/exec';

// =================================================================
// HÀM GET (KHÔNG THAY ĐỔI)
// =================================================================
export async function GET() {
    try {
        await connectDB();

        /* 1. Lấy danh sách khoá học – KHÔNG populate TeachingAs */
        const courses = await PostCourse.find({ Type: 'AI Robotic' })
            .populate({ path: 'Book', select: 'Name' })
            .populate({ path: 'TeacherHR', select: 'name' })
            .populate({ path: 'Area', select: 'name color' })
            .populate({
                path: 'Detail',
                populate: [{ path: 'Teacher', select: 'name phone' }],
            })
            .lean();

        /* 2. Thu thập toàn bộ TeachingAs hợp lệ */
        const idSet = new Set();
        courses.forEach(course => {
            (course.Detail || []).forEach(detail => {
                const raw = detail.TeachingAs;
                const id = typeof raw === 'string' ? raw : raw?._id;
                if (mongoose.Types.ObjectId.isValid(id)) idSet.add(id);
            });
        });


        /* 3. Tra cứu user theo các id hợp lệ */
        const idList = Array.from(idSet);
        const userMap = {};
        if (idList.length) {
            const users = await PostUser.find(
                { _id: { $in: idList } },
                'name phone',
            ).lean();


            users.forEach(u => { userMap[String(u._id)] = u; });

        }

        const cleaned = courses.map(course => {
            (course.Detail || []).forEach(detail => {
                const raw = detail.TeachingAs;
                const id = typeof raw === 'string' ? raw : raw?._id;
                if (userMap[id]) {
                    detail.TeachingAs = userMap[id];
                } else {
                    delete detail.TeachingAs;
                }
            });
            return course;
        });

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công.', data: cleaned },
            { status: 200 },
        );
    } catch (err) {
        console.error('[COURSES_GET_ERROR]', err);
        return NextResponse.json(
            { status: 1, mes: 'Lỗi máy chủ.', data: [] },
            { status: 500 },
        );
    }
}

export async function POST(request) {
    try {
        // --- Phần xác thực và kiểm tra quyền (không đổi) ---
        const authResult = await authenticate(request);
        if (!authResult?.user) {
            return NextResponse.json({ status: 0, mes: 'Xác thực không thành công.' }, { status: 401 });
        }

        const { user, body } = authResult;
        const isAdminOrAcademic = user.role.includes('Admin') || user.role.includes('Acadamic');
        if (!isAdminOrAcademic) {
            return NextResponse.json({ status: 0, mes: 'Bạn không có quyền thực hiện chức năng này.' }, { status: 403 });
        }

        const { code, Book, Area, TeacherHR, Status = false, Type, Detail } = body;
        if (!code || !Detail || !Array.isArray(Detail)) {
            return NextResponse.json({ status: 1, mes: 'Thiếu `code` hoặc `Detail` để tạo khóa học.' }, { status: 400 });
        }

        await connectDB();

        // --- BẮT ĐẦU LOGIC MỚI SỬ DỤNG AGGREGATION ---

        /* 1. Lấy danh sách tên phòng học duy nhất từ request body */
        const roomNames = [...new Set(
            Detail
                .map(d => d.Room)
                .filter(name => typeof name === 'string' && name.trim() !== '')
        )];

        /* 2. Dùng Aggregation Pipeline để tìm _id của các phòng */
        const roomNameToIdMap = new Map();
        if (roomNames.length > 0) {
            const pipeline = [
                // Tách mỗi phần tử trong mảng 'rooms' thành một document riêng
                { $unwind: '$rooms' },
                // Lọc các document có tên phòng nằm trong danh sách cần tìm
                { $match: { 'rooms.name': { $in: roomNames } } },
                // Định dạng lại output chỉ lấy tên và _id của phòng
                {
                    $project: {
                        _id: 0,
                        name: '$rooms.name',
                        roomId: '$rooms._id'
                    }
                }
            ];

            // Thực thi pipeline
            const foundRooms = await PostArea.aggregate(pipeline);

            // Tạo map để tra cứu: 'Tên phòng' -> ObjectId('...')
            foundRooms.forEach(room => {
                roomNameToIdMap.set(room.name, room.roomId);
            });
        }
        // --- KẾT THÚC LOGIC MỚI ---


        // --- Phần tạo ID khóa học (không đổi) ---
        const yearPrefix = new Date().getFullYear().toString().slice(-2);
        const coursePrefix = `${yearPrefix}${code.trim().toUpperCase()}`;
        const lastCourse = await PostCourse.findOne({ ID: { $regex: `^${coursePrefix}` } })
            .sort({ ID: -1 }).select('ID').lean();

        let newSequence = 1;
        if (lastCourse) {
            const lastSeq = parseInt(lastCourse.ID.slice(coursePrefix.length), 10);
            newSequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
        }
        const newCourseID = `${coursePrefix}${newSequence.toString().padStart(3, '0')}`;


        // --- Phần gọi Google Apps Script (không đổi) ---
        const topicString = Detail.map(d => d.Day).join('|');
        let imageUrls = [];
        try {
            const scriptResponse = await fetch(`${APPSCRIPT_URL}?ID=${encodeURIComponent(newCourseID)}&Topic=${encodeURIComponent(topicString)}`);
            if (scriptResponse.ok) {
                const jsonResponse = await scriptResponse.json();
                if (jsonResponse.status === 'success' && jsonResponse.urls) {
                    imageUrls = jsonResponse.urls.split('|');
                }
            }
        } catch (scriptError) {
            console.error('[APPSCRIPT_ERROR]', scriptError.message);
        }

        // --- Chuẩn hóa dữ liệu chi tiết buổi học (không đổi) ---
        const normalizedDetail = Detail.map((d, i) => {
            if (!d.Topic || !mongoose.Types.ObjectId.isValid(d.Topic) || !d.Day) {
                throw new Error(`Buổi học thứ ${i + 1} thiếu Topic hoặc Day, hoặc ID không hợp lệ.`);
            }

            const roomId = d.Room ? roomNameToIdMap.get(d.Room.trim()) : null;

            return {
                Topic: d.Topic,
                Day: new Date(d.Day),
                Room: roomId || null,
                Time: d.Time || '',
                Teacher: mongoose.Types.ObjectId.isValid(d.Teacher) ? d.Teacher : null,
                TeachingAs: mongoose.Types.ObjectId.isValid(d.TeachingAs) ? d.TeachingAs : null,
                Image: imageUrls[i] || '',
            };
        });

        // --- Phần tạo và lưu dữ liệu khóa học (không đổi) ---
        const newCourseData = {
            ID: newCourseID,
            Detail: normalizedDetail,
            Student: [],
        };

        if (Book && mongoose.Types.ObjectId.isValid(Book)) newCourseData.Book = Book;
        if (Area && mongoose.Types.ObjectId.isValid(Area)) newCourseData.Area = Area;
        if (TeacherHR && mongoose.Types.ObjectId.isValid(TeacherHR)) newCourseData.TeacherHR = TeacherHR;
        if (Type) newCourseData.Type = Type;
        newCourseData.Version = 1
        if (typeof Status === 'boolean') newCourseData.Status = Status;

        const createdCourse = await PostCourse.create(newCourseData);

        return NextResponse.json(
            { status: 2, mes: `Tạo khóa học ${newCourseID} thành công!`, data: createdCourse },
            { status: 201 }
        );

    } catch (error) {
        console.error('[COURSE_CREATE_ERROR]', error);
        if (error.code === 11000) {
            return NextResponse.json({ status: 1, mes: 'ID khóa học bị trùng lặp, vui lòng thử lại.' }, { status: 409 });
        }
        return NextResponse.json({ status: 1, mes: error.message || 'Lỗi từ máy chủ.' }, { status: 500 });
    }
}