import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostModel from '@/models/student';
import { Types, isValidObjectId } from 'mongoose';

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
            { Detail: 1, ID: 1, Price: 1, Student: 1 }
        ).lean();

        if (!course) {
            return NextResponse.json(
                { ok: false, mes: 'Course not found.', data: null },
                { status: 404 }
            );
        }

        // Filter Detail lessons: Only include lessons that have no 'Type' field or an empty 'Type' string
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
                { ok: true, mes: 'No new students to add (all already exist).', data: course },
                { status: 200 }
            );
        }

        const newStudentDocsToAdd = [];
        const studentUpdates = [];

        const foundStudents = await PostModel.find({ ID: { $in: newStudentIDsToAdd } }).lean();

        const foundStudentIDs = new Set(foundStudents.map(s => s.ID));

        for (const studentDoc of foundStudents) {
            newStudentDocsToAdd.push({
                ID: studentDoc.ID,
                Learn: learnEntriesForNewStudent
            });

            const updatedCourseFieldForStudent = {
                ...(studentDoc.Course || {}),
                [course.ID]: { StatusLearn: false, StatusPay: course.Price }
            };
            studentUpdates.push({
                updateOne: {
                    filter: { _id: studentDoc._id },
                    update: { $set: { Course: updatedCourseFieldForStudent } }
                }
            });
        }

        const notFoundStudentIDs = newStudentIDsToAdd.filter(id => !foundStudentIDs.has(id));
        if (notFoundStudentIDs.length > 0) {
            console.warn(`Students not found in collection: ${notFoundStudentIDs.join(', ')}`);
        }

        if (studentUpdates.length > 0) {
            await PostModel.bulkWrite(studentUpdates);
        }

        const updatedCourseResult = await PostCourse.findByIdAndUpdate(
            courseID,
            { $push: { Student: { $each: newStudentDocsToAdd } } },
            { new: true }
        );

        return NextResponse.json(
            { ok: true, mes: `Thêm ${newStudentDocsToAdd.length} học sinh mới vào khóa học.`, data: updatedCourseResult },
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