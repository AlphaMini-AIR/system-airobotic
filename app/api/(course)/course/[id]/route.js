// File: app/api/course-details/[id]/route.js

import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import PostStudent from '@/models/student';
import { NextResponse } from 'next/server';
import { Types } from 'mongoose'; // Import Types để sử dụng ObjectId

export async function GET(request, { params }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { status: 1, mes: 'Thiếu ID của khóa học.', data: null },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        const course = await PostCourse.findOne({ ID: id }).populate({ path: 'Book', select: '-Topics' })
            .populate({ path: 'TeacherHR', select: 'name phone' }).lean();

        if (!course) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học.', data: null },
                { status: 404 }
            );
        }

        // --- LOGIC MỚI ĐỂ LINK DỮ LIỆU TỪ DETAIL.LESSON ---
        if (course.Detail && course.Detail.length > 0) {
            const lessonIds = [
                ...new Set(
                    course.Detail
                        .map(d => d.Lesson?.toString()) // Lấy ID và chuyển sang string
                        .filter(Boolean) // Loại bỏ các giá trị null hoặc undefined
                )
            ];

            if (lessonIds.length > 0) {
                // 3. Tìm tất cả các sách có chứa bất kỳ topic nào có _id trong danh sách lessonIds
                const relevantBooks = await PostBook.find({
                    'Topics._id': { $in: lessonIds.map(lid => new Types.ObjectId(lid)) }
                }).lean()

                // 4. Xây dựng một Map tra cứu hiệu quả: TopicID -> { BookInfo, TopicInfo }
                const lessonDetailsMap = new Map();
                for (const book of relevantBooks) {
                    // Tách thông tin sách (không bao gồm mảng Topics lớn)
                    const { Topics, ...bookInfo } = book;

                    for (const topic of book.Topics) {
                        const topicIdStr = topic._id.toString();
                        // Nếu topic này nằm trong danh sách lesson ta cần tìm
                        if (lessonIds.includes(topicIdStr)) {
                            lessonDetailsMap.set(topicIdStr, {
                                Book: bookInfo, // Thông tin sách chứa topic
                                Topic: topic,    // Thông tin chi tiết của topic (bài học)
                            });
                        }
                    }
                }

                // 5. "Làm giàu" (enrich) mảng Detail của khóa học
                course.Detail = course.Detail.map(detailItem => {
                    const lessonId = detailItem.Lesson?.toString();
                    // Lấy thông tin chi tiết từ Map đã tạo
                    const lessonData = lessonDetailsMap.get(lessonId);

                    return {
                        ...detailItem,
                        // Thêm trường mới chứa thông tin đã được gộp
                        LessonDetails: lessonData || null
                    };
                });
            }
        }
        // --- KẾT THÚC LOGIC MỚI ---


        // 6. Xử lý và gộp thông tin Học sinh (Student) - Logic này không đổi
        if (course.Student && course.Student.length > 0) {
            const studentIds = course.Student.map(s => s.ID);
            const studentsData = await PostStudent.find({ ID: { $in: studentIds } })
                .select('ID Name')
                .lean();

            const studentInfoMap = new Map(
                studentsData.map(s => [s.ID, { Name: s.Name }])
            );

            course.Student = course.Student.map(studentInCourse => ({
                ...studentInCourse,
                Name: studentInfoMap.get(studentInCourse.ID)?.Name || 'Không tìm thấy',
            }));
        }

        // 7. Trả về dữ liệu đã được tổng hợp hoàn chỉnh
        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu chi tiết khóa học thành công.', data: course },
            { status: 200 }
        );

    } catch (error) {
        console.error('[COURSE_DETAILS_GET_BY_ID_ERROR]', error);
        const isCastError = error.name === 'CastError';
        return NextResponse.json(
            { status: 1, mes: isCastError ? 'ID không hợp lệ.' : 'Lỗi từ máy chủ.', data: null },
            { status: isCastError ? 400 : 500 }
        );
    }
}