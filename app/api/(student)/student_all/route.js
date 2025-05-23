import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import authenticate from '@/utils/authenticate';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { user } = await authenticate(request);
        let data;
        let message = 'Lấy dữ liệu thành công';
        let status = 200;
        await connectDB();
        data = await PostStudent.find({}, { _id: 1 })
        return NextResponse.json(
            { air: status === 200 ? 2 : 1, mes: message, data },
            { status }
        );
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            { status: error.message === 'Authentication failed' ? 401 : 500 }
        );
    }
}
