import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostBook from '@/models/book';
import PostArea from '@/models/area';
import Postuser from '@/models/users';
import PostStudent from '@/models/student';
import User from '@/models/users';
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { Re_course_all, Re_course_one } from '@/data/course';
import authenticate from '@/utils/authenticate';
import { Re_Student_All } from '@/data/student';
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request, { params }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { status: 1, mes: 'Thiếu ID của khóa học.', data: null },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        const course = await PostCourse.findOne({ ID: id })
            .populate([
                { path: 'Book' },
                { path: 'TeacherHR', select: 'name phone' },
                { path: 'Area', select: 'name rooms color' }
            ])
            .lean();

        if (!course) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học.', data: null },
                { status: 404 }
            );
        }

        const userIds = new Set();
        course.Detail?.forEach(d => {
            if (d.Teacher && Types.ObjectId.isValid(d.Teacher)) {
                userIds.add(d.Teacher.toString());
            }
            if (d.TeachingAs && Types.ObjectId.isValid(d.TeachingAs)) {
                userIds.add(d.TeachingAs.toString());
            }
        });

        const lessonIds = [...new Set(course.Detail?.map(d => d.Topic?.toString()).filter(Boolean) || [])];
        const studentIds = course.Student?.map(s => s.ID) || [];

        const promises = [
            userIds.size > 0
                ? User.find({ _id: { $in: Array.from(userIds) } }).select('name phone').lean()
                : Promise.resolve([]),

            lessonIds.length > 0
                ? PostBook.find({ 'Topics._id': { $in: lessonIds.map(lid => new Types.ObjectId(lid)) } }).lean()
                : Promise.resolve([]),

            studentIds.length > 0
                ? PostStudent.find({ ID: { $in: studentIds } }).select('ID Name _id').lean()
                : Promise.resolve([])
        ];

        const [usersData, relevantBooks, studentsData] = await Promise.all(promises);

        const userDetailsMap = new Map(usersData.map(u => [u._id.toString(), u]));
        const lessonDetailsMap = new Map();

        if (relevantBooks.length > 0) {
            for (const book of relevantBooks) {
                for (const topic of book.Topics) {
                    const topicIdStr = topic._id.toString();
                    if (lessonIds.includes(topicIdStr)) {
                        lessonDetailsMap.set(topicIdStr, topic);
                    }
                }
            }
        }
        let roomMap = null;
        if (course.Area && Array.isArray(course.Area.rooms)) {
            roomMap = new Map(course.Area.rooms.map(r => [r._id.toString(), r.name]));
        }

        if (course.Detail) {
            course.Detail.forEach(detailItem => {
                detailItem.LessonDetails = lessonDetailsMap.get(detailItem.Topic?.toString()) || null;
                detailItem.Teacher = userDetailsMap.get(detailItem.Teacher?.toString()) || null;
                detailItem.TeachingAs = userDetailsMap.get(detailItem.TeachingAs?.toString()) || null;
                if (roomMap) {
                    const rName = roomMap.get(detailItem.Room?.toString());
                    if (rName) detailItem.Room = rName;
                }
            });
        }

        if (studentsData.length > 0) {
            const studentInfoMap = new Map(studentsData.map(s => [s.ID, s]));
            course.Student.forEach(studentInCourse => {
                studentInCourse.Name = studentInfoMap.get(studentInCourse.ID)?.Name || 'Không tìm thấy';
                studentInCourse.userId = studentInfoMap.get(studentInCourse.ID)?._id || null;
            });
        }

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu chi tiết khóa học thành công.', data: course },
            { status: 200 }
        );

    } catch (error) {
        console.error('[COURSE_DETAILS_GET_BY_ID_ERROR]', error);
        const isCastError = error.name === 'CastError';
        return NextResponse.json(
            { status: 1, mes: isCastError ? 'ID không hợp lệ.' : 'Lỗi từ máy chủ.', data: null },
            { status: isCastError ? 400 : 500 }
        );
    }
}


async function generateSummaryComment(comments) {
    if (!comments || comments.length === 0) {
        return "Học sinh đã hoàn thành khóa học. Cần theo dõi thêm để có nhận xét chi tiết.";
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("GEMINI_API_KEY chưa được cấu hình. Sử dụng nhận xét mặc định.");
        return "Học sinh đã hoàn thành khóa học đầy đủ các buổi.";
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Với vai trò là giáo viên nhận xét học sinh. Dựa trên danh sách các nhận xét rời rạc sau đây về một học sinh trong suốt khóa học, hãy viết một đoạn văn tổng kết dài (khoảng 400 chữ) về thái độ và kết quả học tập của học sinh này. Chỉ trả về đoạn văn, không thêm bất kỳ lời dẫn nào.
            DỮ LIỆU NHẬN XÉT:
            - ${comments.join('\n- ')}
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.log(error);
        
        console.error("Lỗi khi gọi Gemini AI:", error);
        return "Học sinh đã hoàn thành các buổi học với sự tham gia tích cực."; 
    }
}


export async function PATCH(request, { params }) {
    const { id } = params;
    if (!id) return NextResponse.json({ status: 1, mes: 'Thiếu ID của khóa học.' }, { status: 400 });

    try {
        const { user, body } = await authenticate(request);
        if (Object.keys(body).length === 0) return NextResponse.json({ status: 1, mes: 'Không có dữ liệu để cập nhật.' }, { status: 400 });

        await connectDB();
        const course = await PostCourse.findOne({ ID: id }).populate('Book', 'ID Name').lean();
        if (!course) return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 });

        const isTeacherHR = course.TeacherHR?.toString() === user.id;
        const isAdmin = user.role?.includes('Admin');
        if (!isAdmin && !isTeacherHR) return NextResponse.json({ status: 1, mes: 'Bạn không có quyền thực hiện hành động này.' }, { status: 403 });

        delete body.ID;
        const updatedCourse = await PostCourse.findOneAndUpdate({ ID: id }, { $set: body }, { new: true }).populate('Book', 'ID Name').lean();
        if (!updatedCourse) return NextResponse.json({ status: 1, mes: 'Cập nhật khóa học thất bại.' }, { status: 404 });

        if (body.Status === true) {
            const studentIDsInCourse = updatedCourse.Student.map(s => s.ID);
            if (studentIDsInCourse.length > 0) {
                const students = await PostStudent.find({ ID: { $in: studentIDsInCourse } }).select('ID Course Profile');
                const bulkOperations = [];

                for (const student of students) {
                    const studentInCourseData = updatedCourse.Student.find(s => s.ID === student.ID);
                    const allComments = studentInCourseData?.Learn.flatMap(l => l.Cmt || []).filter(cmt => cmt && cmt.trim() !== '');
                    const summaryComment = await generateSummaryComment(allComments);

                    const newPresentation = {
                        course: updatedCourse._id,
                        bookId: updatedCourse.Book.ID,
                        bookName: updatedCourse.Book.Name,
                        Comment: summaryComment,
                        Video: '',
                        Img: ''
                    };

                    // **BẮT ĐẦU SỬA LỖI**
                    // 1. Lấy mảng Present hiện tại và lọc bỏ mục của khóa học này (nếu có)
                    const currentPresentations = student.Profile?.Present || [];
                    const otherPresentations = currentPresentations.filter(p => p.bookId !== updatedCourse.Book.ID);

                    // 2. Tạo mảng Present mới bằng cách thêm mục đã cập nhật vào
                    const newPresentArray = [...otherPresentations, newPresentation];
                    // **KẾT THÚC SỬA LỖI**

                    const hasOtherActiveCourses = student.Course.some(c => c.course.toString() !== updatedCourse._id.toString() && c.status === 0);
                    const newStatusForStudent = {
                        status: hasOtherActiveCourses ? 2 : 1, act: hasOtherActiveCourses ? 'học' : 'chờ',
                        date: new Date(), note: `Hoàn thành khóa học ${updatedCourse.ID}`
                    };

                    bulkOperations.push({
                        updateOne: {
                            filter: { _id: student._id },
                            update: {
                                // **SỬA LỖI: Dùng $set cho toàn bộ mảng Present**
                                $set: {
                                    'Course.$[c].status': 2,
                                    'Profile.Present': newPresentArray
                                },
                                $push: { Status: newStatusForStudent }
                            },
                            arrayFilters: [{ 'c.course': updatedCourse._id }]
                        }
                    });
                }

                if (bulkOperations.length > 0) {
                    await PostStudent.bulkWrite(bulkOperations);
                }
            }
        }

        Re_course_all();
        Re_course_one(id);
        Re_Student_All();

        return NextResponse.json({ status: 2, mes: 'Cập nhật thành công.' }, { status: 200 });

    } catch (error) {
        console.error('[COURSE_UPDATE_ERROR]', error);
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}