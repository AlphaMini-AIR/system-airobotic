import { NextResponse } from 'next/server';
import PostCourse from '@/models/course';
import connectDB from '@/config/connectDB';

export async function GET(request, { params }) {
    try {

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { status: 1, mes: 'Missing id parameter', data: [] },
                { status: 400 }
            );
        }

        await connectDB();

        const doc = await PostCourse.findOne(
            { 'Detail.Image': id },
            {
                'Detail.$': 1,
                ID: 1,
                Name: 1,
                Area: 1,
                TeacherHR: 1,
                Student: 1
            }
        ).lean();

        if (!doc || !doc.Detail?.length) {
            return NextResponse.json(
                { status: 1, mes: 'Buổi học không tìm thấy', data: [] },
                { status: 404 }
            );
        }

        const detail = doc.Detail[0];

        const session = {
            day: detail.Day,
            topic: detail.Topic,
            room: detail.Room,
            time: detail.Time,
            lesson: detail.Lesson,
            teacher: detail.Teacher,
            teachingAs: detail.TeachingAs,
            image: detail.Image,
            id: detail.ID
        };

        const { Detail, ...course } = doc;

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công', data: { course, session } },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { status: 1, mes: 'Internal Server Error', data: [] },
            { status: 500 }
        );
    }
}
