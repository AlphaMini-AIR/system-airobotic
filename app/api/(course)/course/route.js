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
        const code = error.message === 'Authentication failed' ? 0 : 1;
        return NextResponse.json(
            { x: code, mes: error.message, data: [] },
            { status: code === 0 ? 401 : 500 }
        );
    }
}

const APPSCRIPT =
    'https://script.google.com/macros/s/AKfycby4HNPYOKq-XIMpKMqn6qflHHJGQMSSHw6z00-5wuZe5Xtn2OrfGXEztuPj1ynKxj-stw/exec';

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
                { status: 400 } // Nên dùng status 400 cho bad request
            );
        }

        /* ----------- Sinh ID mới (Đảm bảo độc nhất) ----------- */
        const yy = new Date().getFullYear().toString().slice(-2);
        const prefix = `${yy}${code.trim().toUpperCase()}`;

        // Bắt đầu với một con số dự đoán
        let seq = (await PostCourse.countDocuments({ ID: { $regex: `^${prefix}` } })) + 1;
        let newCourseID;
        let isUnique = false;

        // Vòng lặp để kiểm tra và tìm ID duy nhất
        do {
            newCourseID = `${prefix}${seq.toString().padStart(3, '0')}`;
            // Kiểm tra xem ID đã tồn tại chưa
            const existingCourse = await PostCourse.findOne({ ID: newCourseID }).lean();
            if (existingCourse) {
                // Nếu tồn tại, tăng seq và thử lại ở vòng lặp tiếp theo
                seq++;
            } else {
                // Nếu không tồn tại, ID này là duy nhất, thoát khỏi vòng lặp
                isUnique = true;
            }
        } while (!isUnique);

        console.log(`[COURSE_CREATE] Found unique ID: ${newCourseID}`);

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
        });

        return NextResponse.json(
            {
                x: 2,
                mes: `Tạo khóa học thành công!`,
                data: [],
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('[COURSE_CREATE]', err);
        if (err.code === 11000) {
            return NextResponse.json(
                { x: 1, mes: 'Lỗi tạo ID, vui lòng thử lại.', data: [] },
                { status: 409 } 
            );
        }
        return NextResponse.json(
            { x: 1, mes: 'Server error', data: [] },
            { status: 500 }
        );
    }
}