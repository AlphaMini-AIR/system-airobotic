// /app/api/validate-course-topics/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/config/connectDB'; // Giả sử bạn có một file helper để kết nối DB
import PostCourse from '@/models/course';
import Book from '@/models/book'; // Import Book model để Mongoose biết cách populate

export async function GET(request) {
    try {
        await dbConnect();

        // 1. Lấy tất cả các khóa học và populate thông tin sách liên quan
        // Chúng ta chỉ cần các trường ID, Name, và Topics từ Book để kiểm tra
        const courses = await PostCourse.find({})
            .populate({
                path: 'Book',
                model: Book,
                select: 'ID Name Topics' // Chỉ lấy những trường cần thiết từ Book
            })
            .lean(); // Sử dụng .lean() để tăng hiệu suất vì chúng ta chỉ đọc dữ liệu

        const validationErrors = [];

        // 2. Lặp qua từng khóa học để kiểm tra
        for (const course of courses) {
            // Bỏ qua nếu khóa học không có sách hoặc sách không có topics
            if (!course.Book || !course.Book.Topics || course.Book.Topics.length === 0) {
                // Bạn có thể thêm một loại lỗi khác ở đây nếu cần
                // ví dụ: một khóa học không có sách tham chiếu
                continue;
            }

            // Tạo một Set chứa các ID của Topic hợp lệ từ sách để tra cứu nhanh (O(1))
            const validTopicIds = new Set(
                course.Book.Topics.map(topic => topic._id.toString())
            );

            // 3. Lặp qua từng phần tử trong mảng Detail của khóa học
            course.Detail.forEach((detail, index) => {
                // Chuyển ID của Topic trong Detail sang chuỗi để so sánh
                const detailTopicId = detail.Topic ? detail.Topic.toString() : null;

                // 4. Kiểm tra xem detailTopicId có tồn tại trong Set các ID hợp lệ không
                if (detailTopicId && !validTopicIds.has(detailTopicId)) {
                    // Nếu không tìm thấy, ghi nhận là lỗi
                    validationErrors.push({
                        courseID: course.ID, // Tên/ID của khóa học
                        courseMongoId: course._id,
                        bookName: course.Book.Name,
                        error: `Phần tử trong Detail không hợp lệ.`,
                        mismatchedDetail: {
                            detailIndex: index, // Vị trí phần tử lỗi trong mảng Detail
                            topicIdNotFound: detailTopicId // ID của Topic không tìm thấy
                        }
                    });
                }
            });
        }

        // 5. Trả về kết quả
        if (validationErrors.length > 0) {
            return NextResponse.json({
                message: 'Đã tìm thấy các phần tử Detail không hợp lệ.',
                errors: validationErrors
            }, { status: 200 });
        }

        return NextResponse.json({
            message: 'Tất cả các khóa học đều có dữ liệu hợp lệ.'
        }, { status: 200 });

    } catch (error) {
        console.error("Lỗi khi xác thực dữ liệu khóa học:", error);
        return NextResponse.json({
            message: 'Lỗi máy chủ nội bộ',
            error: error.message
        }, { status: 500 });
    }
}