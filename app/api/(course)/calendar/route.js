import { NextResponse } from 'next/server';
import PostCourse from '@/models/course';
import connectDB from '@/config/connectDB';

export async function GET() {
    try {
        await connectDB();
        const events = await PostCourse.aggregate([
            { $unwind: '$Detail' },
            {
                $addFields: {
                    parsedDate: {
                        $dateFromString: {
                            dateString: '$Detail.Day',
                            format: '%d/%m/%Y'
                        }
                    }
                }
            },
            { $sort: { parsedDate: 1 } },
            {
                $project: {
                    _id: 0,
                    courseId: '$ID',
                    courseName: '$Name',
                    day: '$Detail.Day',
                    month: { $month: '$parsedDate' },
                    year: { $year: '$parsedDate' },
                    topic: '$Detail.Topic',
                    room: '$Detail.Room',
                    time: '$Detail.Time',
                    lesson: '$Detail.Lesson',
                    teacher: '$Detail.Teacher',
                    teachingAs: '$Detail.TeachingAs',
                    imageLinks: '$Detail.ImageLink'
                }
            }
        ]);

        return NextResponse.json({ status: 2, mes: 'Lấy dữ liệu thành công', data: events }, { status: 200 });
    } catch (error) {
        console.error('Schedule API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
