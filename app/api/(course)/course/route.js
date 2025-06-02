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
                Detail: 1
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

export async function POST(req) {
    try {
        await connectDB();

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

        // Validate đầu vào
        if (
            !code ||
            typeof code !== 'string' ||
            !Name ||
            !Area ||
            !TeacherHR ||
            !TimeStart ||
            !TimeEnd ||
            !Array.isArray(Detail)
        ) {
            return NextResponse.json(
                {
                    x: 1,
                    mes: 'Thiếu một hoặc nhiều trường bắt buộc: code, Name, Area, TeacherHR, TimeStart, TimeEnd hoặc Detail không phải mảng.',
                    data: []
                },
                { status: 200 }
            );
        }

        // Sinh ID mới
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2); // "25"
        const cleanCode = code.trim().toUpperCase();
        const prefix = `${yy}${cleanCode}`;
        const existingCount = await PostCourse.countDocuments({
            ID: { $regex: `^${prefix}` }
        });
        const seqNum = existingCount + 1;               // tăng 1 để tránh trùng với "000"
        const seqStr = seqNum.toString().padStart(3, '0');
        const newCourseID = `${prefix}${seqStr}`;

        // Chuyển Status sang boolean
        let statusBoolean = false;
        if (typeof Status === 'boolean') {
            statusBoolean = Status;
        } else {
            const s = String(Status).toLowerCase().trim();
            statusBoolean = s === 'true' || s === 'active';
        }

        // Chuẩn hoá Detail
        const detailArray = Detail.map((e) => ({
            Day: e.Day || '',
            Topic: e.Topic || '',
            Room: e.Room || '',
            Time: e.Time || '',
            Lesson: typeof e.Lesson === 'number' ? e.Lesson : 0,
            ID: e.ID || '',
            Image: e.Image || '',
            Teacher: e.Teacher || '',
            TeachingAs: e.TeachingAs || '',
        }));

        // Chuẩn hoá Student
        const studentArray = Array.isArray(Student) ? Student : [];

        // Tạo record mới
        await PostCourse.create({
            ID: newCourseID,
            Name: Name.trim(),
            Area: Area.trim(),
            TeacherHR: TeacherHR.trim(),
            Status: statusBoolean,
            Type: Type.trim(),
            Address: Address.trim(),
            Price: typeof Price === 'number' ? Price : 0,
            TimeStart: TimeStart.trim(),
            TimeEnd: TimeEnd.trim(),
            Detail: detailArray,
            Student: studentArray,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        // Không cần trả về đối tượng đã tạo, chỉ trả trạng thái và thông báo
        return NextResponse.json(
            {
                x: 2,
                mes: `Tạo khóa học thành công! ID: ${newCourseID}`,
                data: []
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('[COURSE_CREATE]', err);
        return NextResponse.json(
            {
                x: 1,
                mes: 'Server error',
                data: []
            },
            { status: 500 }
        );
    }
}
