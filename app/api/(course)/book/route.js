import { NextResponse } from 'next/server';
import PostBook from '@/models/book';
import connectDB from '@/config/connectDB';

export async function GET(request) {
    try {
        await connectDB();

        const data = await PostBook.find();

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công', data },
            { status: 200 }
        );

    } catch (error) {
        console.error('Schedule API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
