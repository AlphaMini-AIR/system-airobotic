import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';

const APPSCRIPT_URL =
    'https://script.google.com/macros/s/AKfycby4HNPYOKq-XIMpKMqn6qflHHJGQMSSHw6z00-5wuZe5Xtn2OrfGXEztuPj1ynKxj-stw/exec';

export async function GET() {
    try {
        await connectDB();
        const data = await PostCourse.find({},
            'ID Name TimeEnd Status TimeStart Area TeacherHR Address Detail Type'
        ).lean();

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công.', data },
            { status: 200 }
        );
    } catch (error) {
        console.error('[COURSES_GET_ERROR]', error);
        return NextResponse.json(
            { status: 1, mes: 'Lỗi máy chủ.', data: [] },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const authResult = await authenticate(request);
        if (!authResult?.user) {
            return NextResponse.json(
                { status: 0, mes: 'Xác thực không thành công.', data: [] },
                { status: 401 }
            );
        }

        const { user, body } = authResult;
        const isAdminOrAcademic = user.role.includes('Admin') || user.role.includes('Academic');
        if (!isAdminOrAcademic) {
            return NextResponse.json(
                { status: 0, mes: 'Bạn không có quyền thực hiện chức năng này.', data: [] },
                { status: 403 }
            );
        }
        const {
            code, Name, Area, TeacherHR, Status, TimeStart, TimeEnd, Detail,
            Address = '', Price = 0, Type = '', Student = [],
        } = body;

        if (!code || !Name || !Area || !TeacherHR || !TimeStart || !TimeEnd || !Array.isArray(Detail)) {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu thông tin bắt buộc.', data: [] },
                { status: 400 }
            );
        }

        await connectDB();

        const yearPrefix = new Date().getFullYear().toString().slice(-2);
        const coursePrefix = `${yearPrefix}${code.trim().toUpperCase()}`;

        const lastCourse = await PostCourse.findOne({ ID: { $regex: `^${coursePrefix}` } })
            .sort({ ID: -1 })
            .select('ID')
            .lean();

        let newSequence = 1;
        if (lastCourse) {
            const lastSeq = parseInt(lastCourse.ID.slice(coursePrefix.length), 10);
            newSequence = lastSeq + 1;
        }
        const newCourseID = `${coursePrefix}${newSequence.toString().padStart(3, '0')}`;

        const topicString = Detail.map((d) => d.Day).join('|');
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

        const normalizedDetail = Detail.map((d, i) => ({
            Day: d.Day || '',
            Topic: d.Topic || '',
            Room: d.Room || '',
            Time: d.Time || '',
            Lesson: typeof d.Lesson === 'number' ? d.Lesson : 0,
            ID: d.ID || '',
            Image: imageUrls[i] || '',
            Teacher: d.Teacher || '',
            TeachingAs: d.TeachingAs || '',
        }));

        const isActive = typeof Status === 'boolean' ? Status : ['true', 'active'].includes(String(Status).toLowerCase().trim());

        const newCourse = {
            ID: newCourseID,
            Name: Name.trim(),
            Area: Area.trim(),
            TeacherHR: TeacherHR.trim(),
            Status: isActive,
            Type: Type.trim(),
            Address: Address.trim(),
            Price: typeof Price === 'number' ? Price : 0,
            TimeStart,
            TimeEnd,
            Detail: normalizedDetail,
            Student: Array.isArray(Student) ? Student : [],
        };

        await PostCourse.create(newCourse);

        return NextResponse.json(
            { status: 2, mes: `Tạo khóa học ${newCourseID} thành công!`, data: [newCourse] }, // Trả về data của khóa học vừa tạo
            { status: 201 }
        );

    } catch (error) {
        console.error('[COURSE_CREATE_ERROR]', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { status: 1, mes: 'ID khóa học bị trùng lặp, vui lòng thử lại.', data: [] },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { status: 1, mes: 'Lỗi từ máy chủ.', data: [] },
            { status: 500 }
        );
    }
}