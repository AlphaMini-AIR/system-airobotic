// app/api/courses/[id]/route.js

import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = params; 

    try {
        await connectDB();
        const course = await PostCourse.findOne({ ID: id }).lean().exec();
        if (!course) {
            // Nếu không tìm thấy, trả về 404
            return NextResponse.json(
                { air: 0, mes: 'Không tìm thấy khóa học với ID này', data: null },
                { status: 404 }
            );
        }

        // Nếu tìm thấy, trả về course
        return NextResponse.json(
            { air: 2, mes: 'Lấy dữ liệu thành công', data: course },
            { status: 200 }
        );
    } catch (error) {
        // Nếu lỗi (ví dụ ID không đúng định dạng ObjectId, hoặc lỗi DB khác)
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            {
                status:
                    error.name === 'CastError'
                        ? 400 // Trường hợp ID không hợp lệ
                        : 500,
            }
        );
    }
}
