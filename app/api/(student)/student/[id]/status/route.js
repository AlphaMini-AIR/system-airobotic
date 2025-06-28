import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import { revalidateTag } from 'next/cache';

export async function PATCH(request, { params }) {
    const { id: studentId } = params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return NextResponse.json(
            { success: false, message: 'ID học sinh không hợp lệ.' },
            { status: 400 }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Request body không phải là JSON hợp lệ.' },
            { status: 400 }
        );
    }

    const { action, note, courseId } = body;

    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let updatedStudent;

        switch (action) {
            case 'leave_permanently':
                if (!note) {
                    await session.abortTransaction();
                    session.endSession();
                    return NextResponse.json(
                        { success: false, message: 'Lý do nghỉ học là bắt buộc.' },
                        { status: 400 }
                    );
                }

                const studentToLeave = await PostStudent.findById(studentId, 'ID Course').session(session);
                if (!studentToLeave) {
                    throw new Error('Không tìm thấy học sinh.');
                }

                const studentCourseIds = studentToLeave.Course.map(c => c.course);
                if (studentCourseIds.length > 0) {
                    await PostCourse.updateMany(
                        { _id: { $in: studentCourseIds } },
                        { $pull: { Student: { ID: studentToLeave.ID } } }
                    ).session(session);
                }

                const permanentLeaveStatus = {
                    status: 0,
                    act: 'nghỉ',
                    date: new Date(),
                    note: note,
                };

                updatedStudent = await PostStudent.findByIdAndUpdate(
                    studentId,
                    {
                        $set: { Leave: true, Course: [] },
                        $push: { Status: permanentLeaveStatus }
                    },
                    { new: true, session }
                );
                break;

            case 'leave_course':
                if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
                    await session.abortTransaction();
                    session.endSession();
                    return NextResponse.json(
                        { success: false, message: 'ID khóa học không hợp lệ hoặc bị thiếu.' },
                        { status: 400 }
                    );
                }

                const studentForCourseCheck = await PostStudent.findById(studentId, 'ID').session(session);
                if (!studentForCourseCheck) {
                    throw new Error('Không tìm thấy học sinh.');
                }

                await PostCourse.updateOne(
                    { _id: courseId },
                    { $pull: { Student: { ID: studentForCourseCheck.ID } } }
                ).session(session);

                const studentAfterLeaveCourse = await PostStudent.findByIdAndUpdate(
                    studentId,
                    { $pull: { Course: { course: new mongoose.Types.ObjectId(courseId) } } },
                    { new: true, session }
                );

                const remainingCourseIds = studentAfterLeaveCourse.Course.map(c => c.course);
                let activeCoursesCount = 0;
                if (remainingCourseIds.length > 0) {
                    activeCoursesCount = await PostCourse.countDocuments({
                        _id: { $in: remainingCourseIds },
                        Status: false
                    }).session(session);
                }

                if (activeCoursesCount === 0) {
                    const waitingStatus = {
                        status: 1,
                        act: 'chờ',
                        date: new Date(),
                        note: '',
                    };
                    updatedStudent = await PostStudent.findByIdAndUpdate(
                        studentId,
                        { $push: { Status: waitingStatus } },
                        { new: true, session }
                    );
                } else {
                    updatedStudent = studentAfterLeaveCourse;
                }

                break;

            default:
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json(
                    { success: false, message: 'Hành động không hợp lệ.' },
                    { status: 400 }
                );
        }

        if (!updatedStudent) {
            throw new Error('Cập nhật học sinh thất bại.');
        }

        await session.commitTransaction();
        session.endSession();
        revalidateTag('student');
        return NextResponse.json({ success: true, data: updatedStudent }, { status: 200 });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('API Error:', error);

        const errorMessage = error.message === 'Không tìm thấy học sinh.'
            ? error.message
            : 'Lỗi máy chủ nội bộ.';
        const statusCode = error.message === 'Không tìm thấy học sinh.' ? 404 : 500;

        return NextResponse.json(
            { success: false, message: errorMessage, error: error.message },
            { status: statusCode }
        );
    }
}