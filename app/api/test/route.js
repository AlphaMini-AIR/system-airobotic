import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
    await connectDB();
    try {
        const targetAvatarId = "1Y-Dl9lHv4b4XjMZ5gW2DoRsC01UnAMn_";
        const filter = {
            Avt: targetAvatarId
        };
        const updateOperation = {
            $unset: { Avt: 1 }
        };
        const result = await PostStudent.updateMany(filter, updateOperation);
        revalidatePath('/student');
        const message = `Dọn dẹp hoàn tất. Số học sinh được cập nhật: ${result.modifiedCount}.`;

        return NextResponse.json(
            { air: 2, mes: message, data: result },
            { status: 200 }
        );

    } catch (error) {
        console.error("Lỗi trong quá trình dọn dẹp avatar:", error);
        return NextResponse.json(
            { air: 0, mes: "Đã có lỗi xảy ra từ server.", error: error.message },
            { status: 500 }
        );
    }
}