import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/config/connectDB';
import PostStudent from '@/models/student'; // Đảm bảo model này đã được cập nhật
import PostCourse from '@/models/course';

export async function POST(request) {
    try {
        await dbConnect();

        let payload = {};
        try {
            payload = await request.json();
        } catch (error) {
            // Bỏ qua nếu không có body
        }
        const { studentId } = payload;

        // =============================================================
        // BƯỚC 1: TẠO BẢN ĐỒ TRA CỨU
        // =============================================================
        const studentCourseMap = new Map();

        const allCoursesWithStudents = await PostCourse.find({
            "Student.0": { $exists: true }
        }).select('ID Student').lean();

        for (const course of allCoursesWithStudents) {
            for (const studentInCourse of course.Student) {
                const studentIdentifier = studentInCourse.ID;

                if (!studentCourseMap.has(studentIdentifier)) {
                    studentCourseMap.set(studentIdentifier, []);
                }

                studentCourseMap.get(studentIdentifier).push({
                    course: course._id,
                    tuition: null, // Hợp lệ cho cả type: Number và type: ObjectId
                });
            }
        }

        // =============================================================
        // TRƯỜNG HỢP 1: CẬP NHẬT THEO ID SINH VIÊN
        // =============================================================
        if (studentId) {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return NextResponse.json({ success: false, message: 'ID sinh viên không hợp lệ.' }, { status: 400 });
            }

            const student = await PostStudent.findById(studentId).lean();

            if (!student) {
                return NextResponse.json({ success: false, message: 'Không tìm thấy sinh viên.' }, { status: 404 });
            }

            if (typeof student.Course !== 'object' || Array.isArray(student.Course) || student.Course === null) {
                return NextResponse.json({ success: true, message: 'Trường Course của sinh viên này đã đúng định dạng (Array) hoặc rỗng.' }, { status: 200 });
            }

            const newCoursesArray = studentCourseMap.get(student.ID) || [];

            const result = await PostStudent.updateOne(
                { _id: student._id },
                { $set: { Course: newCoursesArray } }
            );

            return NextResponse.json({
                success: true,
                message: `Đã cập nhật thành công cho sinh viên có ID: ${studentId}`,
                data: result,
            }, { status: 200 });
        }

        // =============================================================
        // TRƯỜNG HỢP 2: CẬP NHẬT TẤT CẢ SINH VIÊN
        // =============================================================
        else {
            const studentsToUpdate = await PostStudent.find({
                'Course': { $type: 'object', $ne: null }
            }).lean();

            if (studentsToUpdate.length === 0) {
                return NextResponse.json({ success: true, message: 'Không có sinh viên nào có định dạng Course cần cập nhật.' }, { status: 200 });
            }

            const bulkOperations = studentsToUpdate.map(student => {
                const newCoursesArray = studentCourseMap.get(student.ID) || [];
                return {
                    updateOne: {
                        filter: { _id: student._id },
                        update: { $set: { Course: newCoursesArray } },
                    },
                };
            });

            if (bulkOperations.length === 0) {
                return NextResponse.json({ success: true, message: 'Không có thao tác cập nhật nào được thực hiện.' }, { status: 200 });
            }

            const result = await PostStudent.bulkWrite(bulkOperations);

            return NextResponse.json({
                success: true,
                message: 'Cập nhật hàng loạt khóa học cho sinh viên thành công!',
                data: {
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                }
            }, { status: 200 });
        }

    } catch (error) {
        console.error('Lỗi khi cập nhật khóa học sinh viên:', error);
        return NextResponse.json({
            success: false,
            message: 'Đã xảy ra lỗi server',
            error: error.message,
        }, { status: 500 });
    }
}