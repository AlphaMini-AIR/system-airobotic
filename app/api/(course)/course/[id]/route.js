
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import PostStudent from '@/models/student'; // Import model của student
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json(
            { status: 1, mes: 'Thiếu ID của khóa học.', data: [] },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        // 1. Tìm khóa học bằng ID
        const course = await PostCourse.findOne({ ID: id }).lean();

        if (!course) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học.', data: [] },
                { status: 404 }
            );
        }

        // 2. Lấy thông tin Topics từ giáo trình (book) và gộp vào Detail
        const match = id.match(/^\d{2}([A-Z0-9]+)\d{3}$/);
        if (match) {
            const bookId = match[1];
            const book = await PostBook.findOne({ ID: bookId }).select('Topics').lean();

            if (book?.Topics) {
                const topicsMap = new Map(book.Topics.map(topic => [topic._id.toString(), topic]));
                course.Detail = course.Detail.map(detailItem => {
                    const topicData = topicsMap.get(detailItem.ID);
                    if (topicData) {
                        const { _id, ...restOfTopicData } = topicData;
                        return { ...detailItem, ...restOfTopicData };
                    }
                    return detailItem;
                });
            }
        } else {
            console.warn(`Course ID ${id} không đúng định dạng để lấy topic.`);
        }

        // 3. Lấy thông tin Name của học sinh và gộp vào Student
        if (course.Student && course.Student.length > 0) {
            // Lấy danh sách ID của tất cả học sinh trong khóa học
            const studentIds = course.Student.map(s => s.ID);

            // Tìm tất cả học sinh có ID trong danh sách trên
            const studentsData = await PostStudent.find({ ID: { $in: studentIds } })
                .select('ID Name') // Chỉ lấy 2 trường cần thiết
                .lean();

            // Tạo một Map để tra cứu tên học sinh hiệu quả
            const studentNameMap = new Map(studentsData.map(s => [s.ID, s.Name]));

            // Gộp tên vào mảng Student của khóa học
            course.Student = course.Student.map(studentInCourse => ({
                ...studentInCourse,
                Name: studentNameMap.get(studentInCourse.ID) || '', // Thêm Name, nếu không tìm thấy thì là chuỗi rỗng
            }));
        }


        // 4. Trả về dữ liệu cuối cùng đã được gộp
        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công.', data: course },
            { status: 200 }
        );

    } catch (error) {
        console.error('[COURSE_GET_BY_ID_ERROR]', error);
        const isCastError = error.name === 'CastError';
        return NextResponse.json(
            { status: 1, mes: isCastError ? 'ID không hợp lệ.' : 'Lỗi từ máy chủ.', data: [] },
            { status: isCastError ? 400 : 500 }
        );
    }
}