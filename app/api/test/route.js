import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB'; // <-- Đảm bảo đường dẫn này chính xác
import PostStudent from '@/models/student';   // <-- Đảm bảo đường dẫn này chính xác

/**
 * @route   POST /api/students/update-avatars
 * @desc    API một lần để chuẩn hóa trường Avt trong tất cả hồ sơ học sinh.
 * Nó sẽ chuyển đổi các URL Avt đầy đủ thành ID file.
 * Ví dụ: 'http://.../picture/ABC' -> 'ABC'
 * Sử dụng POST để tránh bị vô tình kích hoạt bởi trình duyệt hoặc bot.
 * @access  Private (Nên có một lớp xác thực, nhưng hiện tại để mở cho mục đích script)
 */
export async function POST(request) {
    try {
        await connectDB();

        // Bước 1: Chỉ tìm những học sinh có trường 'Avt' là một URL.
        // Điều này hiệu quả hơn nhiều so với việc lấy tất cả tài liệu.
        const studentsToUpdate = await PostStudent.find({
            Avt: { $type: 'string', $regex: /^http/ }
        });

        if (studentsToUpdate.length === 0) {
            return NextResponse.json({
                message: "Không tìm thấy hồ sơ học sinh nào cần cập nhật trường Avt.",
                updatedCount: 0
            }, { status: 200 });
        }

        // Bước 2: Chuẩn bị các lệnh cập nhật hàng loạt (bulk operations).
        const bulkOperations = studentsToUpdate.map(student => {
            const currentAvt = student.Avt;

            // Tách chuỗi URL bằng dấu '/' và lấy phần tử cuối cùng.
            const parts = currentAvt.split('/');
            const newAvtId = parts[parts.length - 1];

            // Chỉ thực hiện cập nhật nếu ID mới hợp lệ và khác với giá trị cũ.
            if (newAvtId && newAvtId !== currentAvt) {
                return {
                    updateOne: {
                        filter: { _id: student._id },
                        update: { $set: { Avt: newAvtId } }
                    }
                };
            }
            // Trả về null cho những trường hợp không cần cập nhật
            return null;
        }).filter(op => op !== null); // Loại bỏ các giá trị null


        if (bulkOperations.length === 0) {
            return NextResponse.json({
                message: "Đã quét các hồ sơ nhưng không có URL Avt nào hợp lệ để chuyển đổi.",
                updatedCount: 0
            }, { status: 200 });
        }

        // Bước 3: Thực thi tất cả các lệnh cập nhật trong một lần gọi.
        const result = await PostStudent.bulkWrite(bulkOperations);

        return NextResponse.json({
            message: `Hoàn tất! Đã cập nhật thành công ${result.modifiedCount} hồ sơ học sinh.`,
            totalFound: studentsToUpdate.length,
            totalUpdated: result.modifiedCount,
        }, { status: 200 });

    } catch (error) {
        console.error("Lỗi trong quá trình cập nhật hàng loạt Avt học sinh:", error);
        return NextResponse.json(
            { message: "Đã xảy ra lỗi server", error: error.message },
            { status: 500 }
        );
    }
}