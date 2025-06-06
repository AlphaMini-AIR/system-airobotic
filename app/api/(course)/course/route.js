import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await connectDB();
        const data = await PostCourse
            .find({}, {
                ID: 1,
                Name: 1,
                TimeEnd: 1,
                Status: 1,
                TimeStart: 1,
                Area: 1,
                TeacherHR: 1,
                Address: 1,
                Detail: 1,
                Type: 1,
            })
            .lean()
            .exec();

        return NextResponse.json(
            { x: 2, mes: 'Lấy dữ liệu thành công', data },
            { status: 200 }
        );
    } catch (error) {
        // Trả về x = 0 nếu lỗi xác thực (nếu có), ngược lại x = 1
        const code = error.message === 'Authentication failed' ? 0 : 1;
        return NextResponse.json(
            { x: code, mes: error.message, data: [] },
            { status: code === 0 ? 401 : 500 }
        );
    }
}

const APPSCRIPT =
    'https://script.google.com/macros/s/AKfycbzntIe1JjogbToY-teezPACCgffLJDyBhJbTSK_WMqutBkaqctocqSZoORASIQS-w4hjw/exec';

export async function POST(req) {
    try {
        await connectDB();

        /* ----------- Đọc & kiểm tra request ----------- */
        const {
            code,
            Name,
            Area,
            TeacherHR,
            Status,
            TimeStart,
            TimeEnd,
            Detail,
            Address = '',
            Price = 0,
            Type = '',
            Student = [],
        } = await req.json();

        if (
            !code ||
            !Name ||
            !Area ||
            !TeacherHR ||
            !TimeStart ||
            !TimeEnd ||
            !Array.isArray(Detail)
        ) {
            return NextResponse.json(
                { x: 1, mes: 'Thiếu một hoặc nhiều trường bắt buộc', data: [] },
                { status: 200 }
            );
        }

        /* ----------- Sinh ID mới ----------- */
        const yy = new Date().getFullYear().toString().slice(-2);
        const prefix = `${yy}${code.trim().toUpperCase()}`;
        const seq =
            (await PostCourse.countDocuments({ ID: { $regex: `^${prefix}` } })) + 1;
        const newCourseID = `${prefix}${seq.toString().padStart(3, '0')}`;

        /* ----------- Gọi Apps Script để lấy ảnh ----------- */
        const TopicStr = Detail.map((d) => d.Day).join('|'); // dd/MM/yyyy|dd/MM/yyyy
        let urls = '';

        try {
            const scriptRes = await fetch(
                `${APPSCRIPT}?ID=${encodeURIComponent(
                    newCourseID
                )}&Topic=${encodeURIComponent(TopicStr)}`
            );
            if (scriptRes.ok) {
                const json = await scriptRes.json();
                if (json.status === 'success') urls = json.urls;
            }
        } catch (err) {
            console.error('[APPSCRIPT_ERROR]', err);
            // tiếp tục, Image sẽ rỗng nếu có lỗi
        }

        const urlArr = urls.split('|');

        /* ----------- Chuẩn hoá Detail ----------- */
        const detailArray = Detail.map((d, i) => ({
            Day: d.Day || '',
            Topic: d.Topic || '',
            Room: d.Room || '',
            Time: d.Time || '',
            Lesson: typeof d.Lesson === 'number' ? d.Lesson : 0,
            ID: d.ID || '',
            Image: urlArr[i] || '',
            Teacher: d.Teacher || '',
            TeachingAs: d.TeachingAs || '',
        }));

        /* ----------- Lưu MongoDB ----------- */
        await PostCourse.create({
            ID: newCourseID,
            Name: Name.trim(),
            Area: Area.trim(),
            TeacherHR: TeacherHR.trim(),
            Status:
                typeof Status === 'boolean'
                    ? Status
                    : String(Status).toLowerCase().trim() === 'true' ||
                    String(Status).toLowerCase().trim() === 'active',
            Type: Type.trim(),
            Address: Address.trim(),
            Price: typeof Price === 'number' ? Price : 0,
            TimeStart: TimeStart.trim(),
            TimeEnd: TimeEnd.trim(),
            Detail: detailArray,
            Student: Array.isArray(Student) ? Student : [],
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        return NextResponse.json(
            {
                x: 2,
                mes: `Tạo khóa học thành công! ID: ${newCourseID}`,
                data: [],
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('[COURSE_CREATE]', err);
        return NextResponse.json(
            { x: 1, mes: 'Server error', data: [] },
            { status: 500 }
        );
    }
}