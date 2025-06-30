import { NextResponse } from 'next/server';
import connectToDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import '@/models/users';

export async function GET() {
    try {
        await connectToDB();

        const courses = await PostCourse.find({})
            .populate({
                path: 'Detail.Teacher',
                model: 'user',
                select: 'name avt phone'
            })
            .lean();

        const teacherData = {};

        for (const course of courses) {
            if (!course.Detail || course.Detail.length === 0) continue;

            for (const lesson of course.Detail) {
                if (!lesson.Teacher || !lesson.Teacher._id) continue;

                const teacherId = lesson.Teacher._id.toString();

                if (!teacherData[teacherId]) {
                    teacherData[teacherId] = {
                        teacherInfo: lesson.Teacher,
                        allLessons: [],
                        totalViolations: 0,
                    };
                }

                const lessonId = lesson._id.toString();
                let isViolation = false;

                let hasAttendanceViolation = false;
                let hasCommentViolation = false;
                const hasImageViolation = !lesson.DetailImage || lesson.DetailImage.length === 0;

                for (const student of course.Student) {
                    const learnRecord = student.Learn.find(
                        (lr) => lr.Lesson && lr.Lesson.toString() === lessonId
                    );

                    if (learnRecord) {
                        if (learnRecord.Checkin === 0) hasAttendanceViolation = true;
                        if (!learnRecord.Cmt || learnRecord.Cmt.length === 0) hasCommentViolation = true;
                    }
                }

                if (hasAttendanceViolation || hasCommentViolation || hasImageViolation) {
                    isViolation = true;
                    teacherData[teacherId].totalViolations++;
                }

                teacherData[teacherId].allLessons.push({
                    lessonId: lessonId,
                    courseId: course.ID, // Giữ lại mã lớp dạng string
                    course_id: course._id.toString(), // <<< THÊM TRƯỜNG MỚI TẠI ĐÂY
                    topicId: lesson.Topic,
                    day: lesson.Day,
                    room: lesson.Room,
                    isViolation: isViolation,
                    errors: {
                        attendance: hasAttendanceViolation,
                        comment: hasCommentViolation,
                        image: hasImageViolation,
                    },
                });
            }
        }

        const result = Object.values(teacherData);
        // Thay đổi response để nhất quán với format bạn cung cấp
        return NextResponse.json({ status: 2, mes: 'Success', data: result }, { status: 200 });

    } catch (error) {
        console.error("Error fetching teacher reports:", error);
        // Thay đổi response để nhất quán với format bạn cung cấp
        return NextResponse.json({ status: 0, mes: "Internal Server Error", data: [] }, { status: 500 });
    }
}