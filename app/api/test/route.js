// File: app/api/students/ensure-status/route.js (hoặc file API của bạn)

import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import Student from '@/models/student';

export async function POST(request) {
    try {
        await connectDB();

        // --- THAY ĐỔI CỐT LÕI: Bộ lọc giờ đây tìm học sinh chưa có khóa học ---
        // 1. Định nghĩa bộ lọc (filter) để tìm những học sinh:
        //    - KHÔNG có trường 'Course' ($exists: false)
        //    - HOẶC có trường 'Course' là một mảng rỗng ($size: 0)
        const filter = {
            $or: [
                { Course: { $exists: false } },
                { Course: { $size: 0 } }
            ]
        };

        // 2. Định nghĩa nội dung cập nhật.
        //    $set sẽ XÓA Status cũ và THAY THẾ bằng mảng mới này.
        const defaultStatus = {
            status: 0,
            date: new Date("2024-09-28T00:00:00.000Z"),
            note: 'Báo nghỉ',
        };

        const updateDoc = {
            $set: { Status: [defaultStatus] }
        };

        // 3. Thực thi updateMany để cập nhật tất cả học sinh khớp với bộ lọc
        const result = await Student.updateMany(filter, updateDoc);

        return NextResponse.json({
            message: "Hoàn tất quá trình cập nhật trạng thái cho các học sinh chưa có khóa học.",
            matchedCount: result.matchedCount, // Số học sinh khớp điều kiện (chưa có khóa học)
            updatedCount: result.modifiedCount, // Số học sinh đã được cập nhật trạng thái
        }, { status: 200 });

    } catch (error) {
        console.error("Lỗi khi rà soát trạng thái học sinh:", error);
        return NextResponse.json({
            message: "Lỗi máy chủ nội bộ khi thực hiện rà soát.",
            error: error.message
        }, { status: 500 });
    }
}
