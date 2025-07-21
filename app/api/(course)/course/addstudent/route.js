import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostModel from '@/models/student';
import { isValidObjectId } from 'mongoose';
import { revalidateTag } from 'next/cache';
import { Re_Student_All } from '@/data/student';

export async function POST(req) {
    try {
        const { courseID, students } = await req.json();

        if (!courseID || !Array.isArray(students) || students.length === 0) {
            return NextResponse.json(
                { ok: false, mes: 'Missing course ID or student list is empty.', data: null },
                { status: 400 }
            );
        }

        if (!isValidObjectId(courseID)) {
            return NextResponse.json(
                { ok: false, mes: 'Invalid course ID format.', data: null },
                { status: 400 }
            );
        }

        await connectDB();

        const course = await PostCourse.findById(
            courseID,
            { Detail: 1, ID: 1, Student: 1 }
        ).lean();

        if (!course) {
            return NextResponse.json(
                { ok: false, mes: 'Course not found.', data: null },
                { status: 404 }
            );
        }

        const filteredDetailLessons = course.Detail.filter(d =>
            !d.Type || d.Type === ''
        );

        const learnEntriesForNewStudent = filteredDetailLessons.map(d => ({
            Checkin: 0,
            Cmt: [],
            CmtFn: '',
            Note: '',
            Lesson: d._id,
            Image: []
        }));

        const existingStudentIDsInCourse = new Set(course.Student.map(s => s.ID));

        const newStudentIDsToAdd = students.filter(studentIdString =>
            !existingStudentIDsInCourse.has(studentIdString)
        );

        if (newStudentIDsToAdd.length === 0) {
            return NextResponse.json(
                { ok: true, mes: 'Không có học sinh nào để thêm.', data: course },
                { status: 200 }
            );
        }

        const newStudentDocsToAdd = [];
        const studentUpdates = [];

        const foundStudents = await PostModel.find({ ID: { $in: newStudentIDsToAdd } }).lean();

        const foundStudentIDs = new Set(foundStudents.map(s => s.ID));

        // --- BẮT ĐẦU PHẦN LOGIC CẬP NHẬT MỚI NHẤT ---
        for (const studentDoc of foundStudents) {
            // Phần cập nhật cho Course vẫn giữ nguyên
            newStudentDocsToAdd.push({
                ID: studentDoc.ID,
                Learn: learnEntriesForNewStudent
            });

            const newCourseEntry = {
                course: course._id,
                tuition: null,
                status: 0,
            };
            const pushOperations = {
                Course: newCourseEntry
            };

            const latestStatus = studentDoc.Status?.[studentDoc.Status.length - 1];
            if (latestStatus && latestStatus.status !== 2) {
                const newLearningStatus = {
                    status: 2,
                    act: 'học',
                    note: `Tham gia khóa học ${course.ID}`,
                    date: new Date(),
                };
                pushOperations.Status = newLearningStatus;
            }

            studentUpdates.push({
                updateOne: {
                    filter: { _id: studentDoc._id },
                    update: { $push: pushOperations }
                }
            });
        }

        const notFoundStudentIDs = newStudentIDsToAdd.filter(id => !foundStudentIDs.has(id));
        if (notFoundStudentIDs.length > 0) {
            console.warn(`Students not found in collection: ${notFoundStudentIDs.join(', ')}`);
        }
        console.log(studentUpdates);
        
        if (studentUpdates.length > 0) {
            await PostModel.bulkWrite(studentUpdates);
        }

        const updatedCourseResult = await PostCourse.findByIdAndUpdate(
            courseID,
            { $push: { Student: { $each: newStudentDocsToAdd } } },
            { new: true }
        );
        Re_Student_All();
        
        return NextResponse.json(
            { ok: true, mes: `Thêm ${newStudentDocsToAdd.length} học sinh mới vào khóa học.`, data: null },
            { status: 200 }
        );

    } catch (err) {
        console.error('[ADD_STUDENT_API] Top-level error:', err);
        return NextResponse.json(
            { ok: false, mes: err.message || 'Server error', data: null },
            { status: 500 }
        );
    }
}