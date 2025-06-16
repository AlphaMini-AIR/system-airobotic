// app/api/migrate-lessons/route.js

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/config/connectDB';
import PostCourse from '@/models/course';
import Book from '@/models/book';

/**
 * =======================================================================
 * CÁC HÀM TIỆN ÍCH XỬ LÝ DỮ LIỆU (ĐÃ TÁI CẤU TRÚC)
 * =======================================================================
 */

/**
 * HÀM DUY NHẤT: Xử lý, di chuyển và xác thực toàn bộ dữ liệu khóa học.
 * Hàm này xây dựng lại mảng Detail để tránh các lỗi cast của Mongoose.
 */
const processAndValidateCourseData = async (course) => {
    let lessonsIdAdded = 0;
    let lessonsMigrated = 0;

    // 1. Xử lý mảng Detail (Buổi học) bằng cách xây dựng lại nó một cách an toàn
    if (Array.isArray(course.Detail)) {
        const detailProcessingPromises = course.Detail.map(async (lessonDoc) => {
            const lessonData = lessonDoc.toObject(); // Làm việc với một bản sao JS object sạch

            // Nhiệm vụ 1: Đảm bảo mỗi buổi học có một _id duy nhất
            if (!lessonData._id) {
                lessonData._id = new mongoose.Types.ObjectId();
                lessonsIdAdded++;
            }

            // Nhiệm vụ 2: Xử lý, xác thực và di chuyển trường `Lesson`
            let finalLessonId = undefined;

            // Ưu tiên 1: Giữ lại nếu `Lesson` đã là một ObjectId hợp lệ
            if (lessonData.Lesson && mongoose.Types.ObjectId.isValid(lessonData.Lesson)) {
                finalLessonId = lessonData.Lesson;
            }
            // Ưu tiên 2: Nếu không, thử di chuyển từ `ID` và `Topic` cũ
            else if (lessonData.ID && lessonData.Topic) {
                try {
                    const book = await Book.findOne({ "Topics.Name": lessonData.Topic });
                    if (book && Array.isArray(book.Topics)) {
                        const topicData = book.Topics.find(t => t.Name === lessonData.Topic);
                        if (topicData && topicData._id) {
                            finalLessonId = topicData._id; // Gán ObjectId hợp lệ đã di chuyển
                            lessonsMigrated++;
                        }
                    }
                } catch (e) {
                    console.error(`Lỗi khi tìm topic '${lessonData.Topic}' cho khóa học:`, e);
                }
            }

            // Gán giá trị `Lesson` đã được làm sạch.
            // Bất kỳ giá trị không hợp lệ nào (như số 4) sẽ bị loại bỏ vì `finalLessonId` sẽ là `undefined`.
            lessonData.Lesson = finalLessonId;

            // Xóa các trường cũ không còn cần thiết
            delete lessonData.ID;
            delete lessonData.Topic;

            // Nhiệm vụ 4: Chuẩn hóa các trường khác
            lessonData.Room = String(lessonData.Room || '');
            lessonData.Teacher = String(lessonData.Teacher || '');
            lessonData.TeachingAs = String(lessonData.TeachingAs || '');
            lessonData.Image = String(lessonData.Image || '');
            lessonData.DetailImage = Array.isArray(lessonData.DetailImage) ? lessonData.DetailImage : [];

            // Chuyển đổi định dạng ngày và giờ
            let baseDate = null;
            if (typeof lessonData.Day === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(lessonData.Day)) {
                const parts = lessonData.Day.split('/');
                const dateObject = new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
                if (!isNaN(dateObject.getTime())) {
                    lessonData.Day = dateObject;
                    baseDate = dateObject;
                }
            } else if (lessonData.Day instanceof Date) {
                baseDate = lessonData.Day;
            }

            // Chuyển đổi TimeStart và TimeEnd thành Date object nếu có thể
            if (baseDate) {
                ['TimeStart', 'TimeEnd'].forEach(field => {
                    const timeValue = lessonData[field];
                    if (typeof timeValue === 'string' && /^\d{1,2}:\d{2}$/.test(timeValue)) {
                        const [hours, minutes] = timeValue.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            // Tạo một bản sao của baseDate để không thay đổi ngày của các trường khác
                            const dateTime = new Date(baseDate);
                            dateTime.setUTCHours(hours, minutes, 0, 0);
                            lessonData[field] = dateTime;
                        }
                    }
                });
            }

            // Xóa trường `Time` cũ không còn dùng
            delete lessonData.Time;

            return lessonData; // Trả về object đã được làm sạch
        });

        // Chờ tất cả các promise xử lý xong và thay thế hoàn toàn mảng Detail cũ
        course.Detail = await Promise.all(detailProcessingPromises);
    }

    // 2. Đồng bộ Student.Learn với mảng Detail đã được làm sạch
    if (Array.isArray(course.Student) && Array.isArray(course.Detail)) {
        // Tạo một Set chứa tất cả các _id hợp lệ từ mảng Detail để tra cứu nhanh.
        const validLessonIds = new Set(course.Detail.map(lesson => lesson._id.toString()));

        course.Student.forEach(student => {
            if (Array.isArray(student.Learn)) {
                // Lọc mảng Learn: chỉ giữ lại những mục có `Lesson` _id tồn tại trong `validLessonIds`.
                student.Learn = student.Learn.filter(learnEntry => {
                    // Đảm bảo learnEntry.Lesson tồn tại và là ObjectId hợp lệ trước khi so sánh
                    return learnEntry.Lesson &&
                        mongoose.Types.ObjectId.isValid(learnEntry.Lesson) &&
                        validLessonIds.has(learnEntry.Lesson.toString());
                });
            }
        });
    }

    return { lessonsIdAdded, lessonsMigrated };
};

/**
 * Đồng bộ sinh viên với các buổi học đã được xác thực
 */
const syncStudentsWithLessons = (course) => {
    let addedLearnEntries = 0;
    if (!Array.isArray(course.Detail) || !Array.isArray(course.Student)) {
        return { addedLearnEntries };
    }

    // Chỉ lấy các buổi học có _id hợp lệ
    const allLessonIds = course.Detail.map(lesson => lesson._id).filter(id => mongoose.Types.ObjectId.isValid(id));

    course.Student.forEach(student => {
        if (!Array.isArray(student.Learn)) {
            student.Learn = [];
        }

        const existingLearnLessonIds = new Set(
            student.Learn.map(learnEntry => learnEntry.Lesson.toString())
        );

        allLessonIds.forEach(lessonId => {
            if (!existingLearnLessonIds.has(lessonId.toString())) {
                const newLearnDetail = {
                    Lesson: lessonId, Checkin: 0, Cmt: [], CmtFn: '', Note: '', Image: [],
                };
                student.Learn.push(newLearnDetail);
                addedLearnEntries++;
            }
        });
    });
    return { addedLearnEntries };
};


/**
 * =======================================================================
 * API ROUTE HANDLER (PUT METHOD) - Đã đơn giản hóa
 * =======================================================================
 */
export async function PUT(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('id');

        if (courseId) {
            const course = await PostCourse.findOne({ ID: courseId });
            if (!course) {
                return NextResponse.json({ message: `Không tìm thấy khóa học: ${courseId}` }, { status: 404 });
            }

            const { lessonsIdAdded, lessonsMigrated } = await processAndValidateCourseData(course);
            const { addedLearnEntries } = syncStudentsWithLessons(course);

            const hasChanges = lessonsIdAdded > 0 || lessonsMigrated > 0 || addedLearnEntries > 0 || course.isModified();

            if (hasChanges) {
                await course.save();
                return NextResponse.json({
                    message: `Đồng bộ và dọn dẹp thành công cho khóa ${courseId}!`,
                    summary: {
                        lessons_with_new_id: lessonsIdAdded,
                        lessons_migrated: lessonsMigrated,
                        student_learn_entries_added: addedLearnEntries,
                    }
                });
            } else {
                return NextResponse.json({ message: `Khóa học ${courseId} đã được đồng bộ. Không có gì thay đổi.` });
            }
        } else {
            // Xử lý hàng loạt
            const allCourses = await PostCourse.find({});
            if (allCourses.length === 0) return NextResponse.json({ message: '✅ Không có khóa học nào trong database.' });

            let totalIdAdded = 0, totalMigrated = 0, totalLearnAdded = 0, coursesModifiedCount = 0;
            const savePromises = [];

            for (const course of allCourses) {
                const { lessonsIdAdded, lessonsMigrated } = await processAndValidateCourseData(course);
                const { addedLearnEntries } = syncStudentsWithLessons(course);

                if (lessonsIdAdded > 0 || lessonsMigrated > 0 || addedLearnEntries > 0 || course.isModified()) {
                    coursesModifiedCount++;
                    totalIdAdded += lessonsIdAdded;
                    totalMigrated += lessonsMigrated;
                    totalLearnAdded += addedLearnEntries;
                    savePromises.push(course.save());
                }
            }

            if (savePromises.length > 0) {
                await Promise.all(savePromises);
            }

            return NextResponse.json({
                message: 'Hoàn tất xử lý và dọn dẹp hàng loạt!',
                summary: {
                    coursesScanned: allCourses.length,
                    coursesUpdated: coursesModifiedCount,
                    total_lessons_with_new_id: totalIdAdded,
                    total_lessons_migrated: totalMigrated,
                    total_student_learn_entries_added: totalLearnAdded,
                }
            });
        }
    } catch (error) {
        console.error('❌ Đã xảy ra lỗi trong quá trình xử lý:', error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Lỗi xác thực dữ liệu', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Lỗi máy chủ nội bộ', error: error.message }, { status: 500 });
    }
}
