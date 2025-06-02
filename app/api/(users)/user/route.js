import connectDB from '@/config/connectDB';
import users from '@/models/users';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        await connectDB();

        // Tìm tất cả user có trường uid (không null hoặc undefined)
        const data = await users
            .find(
                { uid: { $exists: true, $ne: null } },
                { uid: 0 } // Loại bỏ trường uid khỏi kết quả
            )
            .lean()
            .exec();

        return NextResponse.json(
            { air: 2, mes: 'Lấy danh sách người dùng có uid thành công', data },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            { status: error.message === 'Authentication failed' ? 401 : 500 }
        );
    }
}
