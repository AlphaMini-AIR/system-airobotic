import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { NextResponse } from 'next/server';


export async function POST(request) {
    try {

        const { courseId, detailId, data } = await request.json();

        if (!courseId || !detailId || !data || typeof data !== 'object') {
            return NextResponse.json(
                { status: 1, mes: 'Thiếu courseId, detailId hoặc data', data: null },
                { status: 400 }
            );
        }

        const setObj = {};
        Object.keys(data).forEach(k => {
            setObj[`Detail.$.${k}`] = data[k];
        });

        if (Object.keys(setObj).length === 0) {
            return NextResponse.json(
                { status: 1, mes: 'Không có trường nào để cập nhật', data: null },
                { status: 400 }
            );
        }

        await connectDB();

        const updatedCourse = await PostCourse.findOneAndUpdate(
            { _id: courseId, 'Detail.ID': detailId },
            { $set: setObj },
            { new: true, projection: { Detail: 1, ID: 1 } }
        );

        if (!updatedCourse) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học hoặc buổi học', data: { courseId, detailId } },
                { status: 404 }
            );
        }

        /* -------- 4. Trả kết quả -------- */
        return NextResponse.json(
            { status: 2, mes: 'Cập nhật buổi học thành công', data: updatedCourse },
            { status: 200 }
        );
    } catch (err) {
        console.error('[update-detail] error:', err);
        return NextResponse.json(
            { status: 1, mes: err.message || 'Server Error', data: null },
            { status: 500 }
        );
    }
}
