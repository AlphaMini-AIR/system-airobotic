/* app/api/course/udetail/route.js */
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';

const APPSCRIPT =
    'https://script.google.com/macros/s/AKfycby4HNPYOKq-XIMpKMqn6qflHHJGQMSSHw6z00-5wuZe5Xtn2OrfGXEztuPj1ynKxj-stw/exec';

const CREATE_LESSON_REQUIRED = ['Day', 'Topic', 'Room', 'Time', 'Lesson', 'ID', 'Teacher', 'TeachingAs'];

const formatDay = d =>
    /^\d{4}-\d{2}-\d{2}$/.test(d)
        ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
        : d;

export async function POST(request) {
    try {
        const { courseId, detailId, data, student = [], type } = await request.json();

        if (!courseId || !data || typeof data !== 'object') {
            return NextResponse.json({ status: 1, mes: 'Thiếu courseId hoặc data' }, { status: 400 });
        }

        await connectDB();

        // --- TRƯỜNG HỢP 1: TẠO MỚI BUỔI HỌC BÙ / HỌC THỬ (Không đổi) ---
        if (type === 'Học bù' || type === 'Học thử') {
            const missing = CREATE_LESSON_REQUIRED.filter(k => !(k in data));
            if (missing.length) {
                return NextResponse.json({ status: 1, mes: `Thiếu trường khi tạo buổi học: ${missing.join(', ')}` }, { status: 400 });
            }

            data.Day = formatDay(data.Day);
            let imageURL = '';

            try {
                const scriptRes = await fetch(`${APPSCRIPT}?ID=${encodeURIComponent(courseId)}&Topic=${encodeURIComponent(data.Day)}`, { cache: 'no-store' });
                if (scriptRes.ok) {
                    const c = await scriptRes.json();
                    if (c && c.urls) imageURL = c.urls;
                }
            } catch (err) {
                console.error('[udetail] APPSCRIPT_ERROR:', err);
            }

            delete data.Start;
            const newLessonObjectId = new Types.ObjectId();
            const newDetail = { _id: newLessonObjectId, ...data, Image: imageURL, Type: type, Students: student };
            const updateOperations = { $push: { Detail: newDetail } };
            const options = { new: true, projection: { Detail: 1, ID: 1, Student: 1 } };

            if (student && student.length > 0) {
                const lessonId = data.ID;
                const dynamicLearnPath = `Student.$[elem].Learn.${lessonId}`;
                updateOperations.$set = {
                    [dynamicLearnPath]: {
                        Checkin: 0, Cmt: "", Note: "", Lesson: newLessonObjectId
                    }
                };
                options.arrayFilters = [{ "elem.ID": { $in: student } }];
            }

            const updated = await PostCourse.findByIdAndUpdate(courseId, updateOperations, options);

            if (!updated) {
                return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học để thêm buổi học' }, { status: 404 });
            }

            return NextResponse.json({ status: 2, mes: `Đã thêm buổi ${type} thành công`, data: updated }, { status: 200 });
        }

        // --- TRƯỜNG HỢP 2: BÁO NGHỈ BUỔI HỌC (Mới) ---
        else if (type === 'Báo nghỉ') {
            if (!detailId) {
                return NextResponse.json({ status: 1, mes: 'Thiếu detailId để báo nghỉ' }, { status: 400 });
            }

            // Tạo đối tượng set để cập nhật Type và Note
            const setObj = {
                'Detail.$.Type': type, // Cập nhật Type thành "Báo nghỉ"
                'Detail.$.Note': data.Note || '' // Cập nhật Note từ data, nếu không có thì là chuỗi rỗng
            };

            const updated = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: setObj },
                { new: true, projection: { Detail: 1, ID: 1 } }
            );

            if (!updated) {
                return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học hoặc buổi học để báo nghỉ' }, { status: 404 });
            }

            return NextResponse.json({ status: 2, mes: 'Báo nghỉ buổi học thành công', data: updated }, { status: 200 });
        }

        // --- TRƯỜNG HỢP 3: CẬP NHẬT BUỔI HỌC HIỆN CÓ (Không đổi) ---
        else {
            if (!detailId) {
                return NextResponse.json({ status: 1, mes: 'Thiếu detailId để cập nhật' }, { status: 400 });
            }

            const setObj = {};
            Object.keys(data).forEach(k => (setObj[`Detail.$.${k}`] = data[k]));

            if (student && Array.isArray(student)) {
                setObj['Detail.$.Students'] = student;
            }

            if (Object.keys(setObj).length === 0) {
                return NextResponse.json({ status: 1, mes: 'Không có dữ liệu để cập nhật' }, { status: 400 });
            }

            const updated = await PostCourse.findOneAndUpdate(
                { _id: courseId, 'Detail._id': detailId },
                { $set: setObj },
                { new: true, projection: { Detail: 1, ID: 1 } }
            );

            if (!updated) {
                return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học hoặc buổi học để cập nhật' }, { status: 404 });
            }

            return NextResponse.json({ status: 2, mes: 'Cập nhật buổi học thành công', data: updated }, { status: 200 });
        }

    } catch (err) {
        console.error('[udetail] top-level error:', err);
        return NextResponse.json({ status: 1, mes: err.message || 'Server Error' }, { status: 500 });
    }
}