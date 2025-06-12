// app/api/sessions/[id]/route.js (hoặc đường dẫn của bạn)

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import connectDB from '@/config/connectDB';

export async function GET(request, { params }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { status: 1, mes: 'Thiếu ID hình ảnh của buổi học.', data: [] },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        // Tìm khóa học và buổi học cụ thể chứa ID hình ảnh
        const courseData = await PostCourse.findOne(
            { 'Detail.Image': id },
            { 'Detail.$': 1, ID: 1, Area: 1, TeacherHR: 1, Student: 1 }
        ).lean();

        if (!courseData || !courseData.Detail?.length) {
            return NextResponse.json(
                { status: 1, mes: 'Buổi học không được tìm thấy.', data: [] },
                { status: 404 }
            );
        }

        const sessionDetail = courseData.Detail[0];
        const { Detail, ...courseInfo } = courseData;

        let topicInfo = {};

        // Trích xuất bookId từ courseId để tìm giáo trình tương ứng
        const match = courseInfo.ID.match(/^\d{2}([A-Z0-9]+)\d{3}$/);
        if (match) {
            const bookId = match[1];
            // Tìm giáo trình và chỉ lấy về topic khớp với ID của buổi học
            const bookData = await PostBook.findOne(
                { ID: bookId },
                { Topics: { $elemMatch: { _id: new mongoose.Types.ObjectId(sessionDetail.ID) } } }
            ).lean();

            if (bookData?.Topics?.length > 0) {
                const foundTopic = bookData.Topics[0];
                topicInfo = {
                    topicName: foundTopic.Name,
                    slide: foundTopic.Slide,
                    period: foundTopic.Period
                };
            }
        }

        const sessionData = {
            day: sessionDetail.Day,
            room: sessionDetail.Room,
            time: sessionDetail.Time,
            lesson: sessionDetail.Lesson,
            teacher: sessionDetail.Teacher,
            teachingAs: sessionDetail.TeachingAs,
            image: sessionDetail.Image,
            detailImage: sessionDetail.DetailImage, 
            id: sessionDetail.ID,
            ...topicInfo 
        };

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công', data: { course: courseInfo, session: sessionData } },
            { status: 200 }
        );

    } catch (error) {
        console.error('[SESSION_GET_ERROR]', error);
        return NextResponse.json(
            { status: 1, mes: 'Lỗi máy chủ nội bộ.', data: [] },
            { status: 500 }
        );
    }
}