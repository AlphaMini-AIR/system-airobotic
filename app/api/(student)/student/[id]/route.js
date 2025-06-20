import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        let data;
        let message = 'Lấy dữ liệu thành công';
        let status = 200;
        await connectDB();
        data = await PostStudent.findById(id);
        return NextResponse.json(
            { air: status === 200 ? 2 : 1, mes: message, data },
            { status }
        );
    } catch (error) {
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            { status: error.message === 'Authentication failed' ? 401 : 500 }
        );
    }
}
