import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostModel from '@/models/student';

export async function POST(req) {
    try {
        const { courseID, students } = await req.json();

        if (!courseID || !Array.isArray(students) || students.length === 0) {
            return NextResponse.json(
                { ok: false, mes: 'Thiếu courseID hoặc danh sách học sinh', data: null },
                { status: 400 }
            );
        }

        await connectDB();
        const course = await PostCourse.findById(
            courseID,
            { Detail: 1, ID: 1, Price: 1, Student: 1 }
        );
        if (!course) {
            return NextResponse.json(
                { ok: false, mes: 'Khóa học không tồn tại', data: null },
                { status: 404 }
            );
        }

        /* ---------- build Learn template từ Detail ---------- */
        const learnTemplate = {};
        course.Detail.forEach((d) => {
            learnTemplate[d.ID] = { Checkin: 0, Cmt: '', Note: '' };
        });

        /* ---------- id học sinh đã có trong khóa để tránh trùng ---------- */
        const existedIds = new Set((course.Student || []).map((s) => String(s._id)));

        const newStudentDocs = [];

        /* ---------- xử lý từng id ---------- */
        for (const stuId of students) {
            if (existedIds.has(String(stuId))) continue;           // đã có
            const stuDoc = await PostModel.findById(stuId);
            if (!stuDoc) continue;                                 // không tồn tại

            /* cập nhật trường Course bên document học sinh */
            const updatedCourseField = {
                ...(stuDoc.Course || {}),
                [course.ID]: { StatusLearn: false, StatusPay: course.Price },
            };

            const updatedStu = await PostModel.findByIdAndUpdate(
                stuId,
                { $set: { Course: updatedCourseField } },
                { new: true }
            );

            newStudentDocs.push({
                _id: updatedStu._id,
                ID: updatedStu.ID,
                Name: updatedStu.Name,
                Learn: learnTemplate,
            });
        }

        /* ---------- ghép vào mảng Student của khóa ---------- */
        const mergedStudentList = course.Student
            ? [...newStudentDocs, ...course.Student]
            : newStudentDocs;

        const updatedCourse = await PostCourse.findByIdAndUpdate(
            courseID,
            { $set: { Student: mergedStudentList } },
            { new: true }
        );

        return NextResponse.json(
            { ok: true, mes: 'Đã thêm học sinh', data: updatedCourse },
            { status: 200 }
        );
    } catch (err) {
        console.error('[ADD_STUDENT_API]', err);
        return NextResponse.json(
            { ok: false, mes: err.message || 'Server error', data: null },
            { status: 500 }
        );
    }
}
