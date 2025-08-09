import { NextResponse } from 'next/server';
import { actionZalo } from '@/function/drive/appscript';

export async function GET(request) {
    try {
        const cs = await actionZalo({
            phone: '0833911375',
            uidPerson: '780176712954680238',
            actionType: 'addFriend',
            message: 'hi',
            uid: '851657826361020588'
        });
        console.log(cs);
        return NextResponse.json(
            { status: true, message: `Thành công`, data: cs },
            { status: 200 },
        );


    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { status: false, message: `Lỗi hệ thống: ${error.message || 'Không xác định'}`, data: null },
            { status: 500 }
        );
    }
}