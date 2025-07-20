import { NextResponse } from 'next/server';
import connectToDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import '@/models/users'; // Đảm bảo model 'user' được đăng ký

export async function GET() {
    try {
        await connectToDB();

        const now = new Date();

        // Lấy tất cả khóa học và populate thông tin cần thiết
        const courses = await PostCourse.find({})
            .populate({
                path: 'Detail.Teacher',
                model: 'user',
                select: 'name avt phone'
            })
            .populate({ path: 'Area', select: 'rooms' })
            .lean();

        const teacherData = {};

        // Duyệt qua từng khóa học để tổng hợp dữ liệu
        for (const course of courses) {
            if (!course.Detail || course.Detail.length === 0) continue;

            // Tạo map để tra cứu tên phòng học hiệu quả
            const roomMap = new Map(course.Area?.rooms?.map(r => [r._id.toString(), r.name]) || []);

            // Duyệt qua từng buổi học trong khóa
            for (const lesson of course.Detail) {
                if (!lesson.Teacher || !lesson.Teacher._id) continue;

                const teacherId = lesson.Teacher._id.toString();
                const lessonId = lesson._id.toString();

                // Khởi tạo dữ liệu cho giáo viên nếu chưa có
                if (!teacherData[teacherId]) {
                    teacherData[teacherId] = {
                        teacherInfo: lesson.Teacher,
                        allLessons: [],
                        totalViolations: 0,
                    };
                }

                const lessonDate = new Date(lesson.Day);

                // --- Xử lý các buổi học CHƯA DIỄN RA ---
                if (lessonDate > now) {
                    teacherData[teacherId].allLessons.push({
                        lessonId,
                        courseId: course.ID,
                        course_id: course._id.toString(),
                        day: lesson.Day,
                        room: roomMap.get(lesson.Room?.toString()) || lesson.Room,
                        status: 'chưa diễn ra',
                        isViolation: false,
                        errors: { attendance: false, comment: false, image: false },
                    });
                    continue; // Chuyển sang buổi học tiếp theo
                }

                // --- Xử lý các buổi học ĐÃ DIỄN RA ---

                // highlight-start
                // CẬP NHẬT LOGIC KIỂM TRA LỖI

                // 1. Lỗi hình ảnh
                const hasImageViolation = !lesson.DetailImage || lesson.DetailImage.length === 0;

                // 2. Lỗi điểm danh và nhận xét
                let hasAttendanceViolation = false;
                let hasCommentViolation = false;

                if (course.Student && course.Student.length > 0) {
                    for (const student of course.Student) {
                        const learnRecord = student.Learn.find(lr => lr.Lesson?.toString() === lessonId);

                        if (learnRecord) {
                            // Lỗi điểm danh: Học sinh có trong danh sách nhưng chưa được điểm danh (Checkin = 0)
                            if (learnRecord.Checkin === 0) {
                                hasAttendanceViolation = true;
                            }
                            // Lỗi nhận xét: Học sinh có đi học (Checkin = 1) nhưng không có nhận xét
                            if (learnRecord.Checkin === 1 && (!learnRecord.Cmt || learnRecord.Cmt.length === 0)) {
                                hasCommentViolation = true;
                            }
                        } else {
                            // Nếu học sinh thuộc khóa học nhưng không có bản ghi học tập cho buổi đã qua -> Lỗi điểm danh
                            hasAttendanceViolation = true;
                        }

                        // Tối ưu: Nếu đã phát hiện đủ các loại lỗi thì không cần duyệt tiếp
                        if (hasAttendanceViolation && hasCommentViolation) break;
                    }
                } else {
                    // Nếu khóa học có lịch học nhưng không có học sinh -> Lỗi hệ thống
                    hasAttendanceViolation = true;
                    hasCommentViolation = true;
                }

                const isViolation = hasAttendanceViolation || hasCommentViolation || hasImageViolation;
                if (isViolation) {
                    teacherData[teacherId].totalViolations++;
                }

                // Thêm kết quả buổi học vào danh sách của giáo viên
                teacherData[teacherId].allLessons.push({
                    lessonId,
                    courseId: course.ID,
                    course_id: course._id.toString(),
                    day: lesson.Day,
                    room: roomMap.get(lesson.Room?.toString()) || lesson.Room,
                    status: 'đã diễn ra',
                    isViolation,
                    errors: {
                        attendance: hasAttendanceViolation,
                        comment: hasCommentViolation,
                        image: hasImageViolation,
                    },
                });
                // highlight-end
            }
        }

        const result = Object.values(teacherData);
        return NextResponse.json({ status: 2, mes: 'Success', data: result }, { status: 200 });

    } catch (error) {
        console.error("Error fetching teacher reports:", error);
        return NextResponse.json({ status: 0, mes: "Internal Server Error", data: [] }, { status: 500 });
    }
}