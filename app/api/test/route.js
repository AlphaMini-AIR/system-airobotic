import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';

export async function POST(req) {
    try {
        const { courseId } = await req.json();

        if (!courseId || !isValidObjectId(courseId)) {
            return NextResponse.json(
                { status: false, message: 'ID của khóa học là bắt buộc và phải hợp lệ.' },
                { status: 400 }
            );
        }

        await connectDB();

        const course = await PostCourse.findById(courseId).select('ID Student').lean();

        if (!course) {
            return NextResponse.json(
                { status: false, message: 'Không tìm thấy khóa học với ID đã cho.' },
                { status: 404 }
            );
        }

        if (!course.Student || course.Student.length === 0) {
            return NextResponse.json(
                { status: true, message: 'Khóa học không có học sinh nào để đồng bộ.' },
                { status: 200 }
            );
        }

        const studentIdsInCourse = course.Student.map(s => s.ID);

        // BƯỚC MỚI: Dọn dẹp các phần tử lỗi trong mảng Course của học sinh
        // Lệnh này sẽ xóa bất kỳ phần tử nào trong mảng Course không có trường 'course'
        await PostStudent.updateMany(
            { ID: { $in: studentIdsInCourse } },
            { $pull: { Course: { course: { $exists: false } } } }
        );

        // Sau khi dọn dẹp, tiến hành logic đồng bộ như cũ trên dữ liệu đã sạch
        const studentsToSync = await PostStudent.find({
            ID: { $in: studentIdsInCourse }
        }).select('ID Course Status');

        const bulkUpdateOps = [];
        const newStatusEntry = {
            status: 2,
            act: 'học',
            date: new Date(),
            note: `Tham gia khóa học ${course.ID}`,
        };

        for (const student of studentsToSync) {
            const isAlreadyEnrolled = student.Course.some(
                c => c.course.toString() === courseId
            );

            if (!isAlreadyEnrolled) {
                const newCourseEntry = {
                    course: courseId,
                    tuition: null,
                    status: 0,
                };

                bulkUpdateOps.push({
                    updateOne: {
                        filter: { _id: student._id },
                        update: {
                            $push: {
                                Course: newCourseEntry,
                                Status: newStatusEntry
                            }
                        }
                    }
                });
            }
        }

        if (bulkUpdateOps.length === 0) {
            return NextResponse.json(
                { status: true, message: 'Tất cả học sinh đã được đồng bộ từ trước.' },
                { status: 200 }
            );
        }

        const result = await PostStudent.bulkWrite(bulkUpdateOps);

        return NextResponse.json(
            {
                status: true,
                message: `Đồng bộ hoàn tất. Đã cập nhật ${result.modifiedCount} học sinh.`,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error('[API_SYNC_STUDENTS_ERROR]', err);
        return NextResponse.json(
            { status: false, message: err.message || 'Lỗi từ máy chủ.' },
            { status: 500 }
        );
    }
}