import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import { Re_Student_All } from '@/data/student';
import { Re_course_one } from '@/data/course';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const { students } = await req.json();

        if (!id || !Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ status: false, mes: 'Thiếu ID khóa học hoặc danh sách học sinh trống.' }, { status: 400 });
        }
        if (!isValidObjectId(id)) {
            return NextResponse.json({ status: false, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
        }
        await connectDB();
        const course = await PostCourse.findById(id, { Detail: 1, ID: 1, Student: 1 }).lean();
        if (!course) {
            return NextResponse.json({ status: false, mes: 'Không tìm thấy khóa học.' }, { status: 404 });
        }
        const learnEntriesForNewStudent = course.Detail
            .filter(d => !d.Type || d.Type === '')
            .map(d => ({
                Lesson: d._id,
                Checkin: 0, Cmt: [], CmtFn: '', Note: '', Image: []
            }));
        const existingStudentIDsInCourse = new Set(course.Student.map(s => s.ID));
        const newStudentIDsToAdd = students.filter(studentIdString => !existingStudentIDsInCourse.has(studentIdString));
        if (newStudentIDsToAdd.length === 0) {
            return NextResponse.json({ status: true, mes: 'Tất cả học sinh đã có trong khóa học.' }, { status: 200 });
        }
        const newStudentDocs = newStudentIDsToAdd.map(studentId => ({
            ID: studentId,
            Learn: learnEntriesForNewStudent
        }));
        const studentBulkUpdateOps = newStudentIDsToAdd.map(studentId => {
            const newCourseEntry = { course: id, tuition: null, status: 0 };
            const newLearningStatus = { status: 2, act: 'học', note: `Tham gia khóa học ${course.ID}`, date: new Date() };
            return {
                updateOne: {
                    filter: { ID: studentId },
                    update: { $push: { Course: newCourseEntry, Status: newLearningStatus } }
                }
            };
        });
        await Promise.all([
            PostStudent.bulkWrite(studentBulkUpdateOps),
            PostCourse.findByIdAndUpdate(id, { $push: { Student: { $each: newStudentDocs } } })
        ]);
        Re_Student_All();
        Re_course_one(course.ID);
        return NextResponse.json({ status: true, mes: `Thêm thành công ${newStudentDocs.length} học sinh.` }, { status: 200 });
    } catch (err) {
        console.error('[API_COURSE_ADD_STUDENT_ERROR]', err);
        return NextResponse.json({ status: false, mes: err.message || 'Lỗi máy chủ' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id: courseId } = await params;
        const { studentId, action, note } = await req.json();

        if (!courseId || !studentId || !action || !note) {
            return NextResponse.json({ status: false, mes: 'Thiếu thông tin (courseId, studentId, action, note).' }, { status: 400 });
        }
        if (!isValidObjectId(courseId)) {
            return NextResponse.json({ status: false, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
        }
        await connectDB();

        const student = await PostStudent.findOne({ ID: studentId });
        if (!student) {
            return NextResponse.json({ status: false, mes: 'Không tìm thấy học sinh.' }, { status: 404 });
        }

        const otherCourses = student.Course.filter(c => c.course.toString() !== courseId);
        const isStillLearning = otherCourses.some(c => c.status === 0);

        const newStatus = {
            status: isStillLearning ? 2 : 1,
            act: 'chờ',
            date: new Date(),
            note: note,
        };

        let updateCoursePromise, updateStudentPromise, successMessage;

        switch (action) {
            case 'remove':
                updateCoursePromise = PostCourse.updateOne(
                    { _id: courseId },
                    { $pull: { Student: { ID: studentId } } }
                );
                updateStudentPromise = PostStudent.updateOne(
                    { ID: studentId },
                    {
                        $pull: { Course: { course: courseId } },
                        $push: { Status: newStatus }
                    }
                );
                successMessage = `Đã xóa học sinh ${studentId} khỏi khóa học.`;
                break;

            case 'reserve':
                updateCoursePromise = PostCourse.updateOne(
                    { _id: courseId, 'Student.ID': studentId },
                    { $pull: { 'Student.$.Learn': { Checkin: 0 } } }
                );
                updateStudentPromise = PostStudent.updateOne(
                    { ID: studentId, 'Course.course': courseId },
                    {
                        $set: { 'Course.$.status': 1 },
                        $push: { Status: newStatus }
                    }
                );
                successMessage = `Đã bảo lưu kết quả cho học sinh ${studentId}.`;
                break;

            default:
                return NextResponse.json({ status: false, mes: 'Hành động không hợp lệ.' }, { status: 400 });
        }

        const [courseResult, studentResult] = await Promise.all([updateCoursePromise, updateStudentPromise]);

        if (courseResult.modifiedCount === 0 && studentResult.modifiedCount === 0) {
            return NextResponse.json({ status: false, mes: 'Không có gì thay đổi.' }, { status: 404 });
        }

        const course = await PostCourse.findById(courseId, 'ID').lean();
        if (course) {
            Re_course_one(course.ID);
        }
        Re_Student_All();
        return NextResponse.json({ status: true, mes: successMessage }, { status: 200 });
    } catch (err) {
        console.error('[API_COURSE_UPDATE_STUDENT_ERROR]', err);
        return NextResponse.json({ status: false, mes: err.message || 'Lỗi máy chủ' }, { status: 500 });
    }
}