import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import '@/models/course';
import '@/models/book';
import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';

export async function GET(request) {
    try {
        await connectDB();

        const data = await PostStudent.find({})
            .populate({
                path: 'Area'
            })
            .populate({
                path: 'Course.course',
                model: 'course',
                select: 'ID Status Book',
                populate: {
                    path: 'Book',
                    model: 'book',
                    select: 'Name Price'
                }
            })
            .lean();

        return NextResponse.json(
            { air: 2, mes: 'Lấy danh sách học sinh thành công', data },
            { status: 200 }
        );
    } catch (error) {
        // Log lỗi ra console server để dễ dàng debug
        console.error("Lỗi API lấy danh sách học sinh:", error);
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const authResult = await authenticate(request);
        if (!authResult || !authResult.user) {
            return NextResponse.json({ status: 1, mes: 'Xác thực không thành công.', data: null }, { status: 401 });
        }

        const { user, body } = authResult;

        if (!user.role.includes('Admin')) {
            return NextResponse.json({ status: 1, mes: 'Bạn không có quyền truy cập chức năng này.', data: null }, { status: 403 });
        }

        await connectDB();

        const { studentId, courseId, amountInitial, amountPaid, paymentMethod, discount } = body;

        if (!studentId || !courseId || !user.id || amountInitial === undefined || amountPaid === undefined) {
            return NextResponse.json(
                { success: false, message: 'Vui lòng cung cấp đủ các trường bắt buộc: studentId, courseId, createBy, amountInitial, amountPaid.' },
                { status: 400 }
            );
        }

        const newInvoice = new Invoice({
            studentId,
            courseId,
            amountInitial,
            amountPaid,
            paymentMethod,
            discount,
            createBy: user.id,
        });
        console.log("ID được tạo trước khi lưu:", newInvoice._id);
        
        

        const savedInvoice = await newInvoice.save();
        return NextResponse.json(
            { success: true, message: 'Hóa đơn đã được tạo thành công.', data: savedInvoice },
            { status: 201 }
        );

    } catch (error) {
        console.error('Lỗi khi tạo hóa đơn:', error);

        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { success: false, message: 'Lỗi xác thực dữ liệu.', errors: error.errors },
                { status: 400 } // Bad Request
            );
        }

        // Các lỗi khác
        return NextResponse.json(
            { success: false, message: 'Lỗi từ máy chủ.', error: error.message },
            { status: 500 } // Internal Server Error
        );
    }
}