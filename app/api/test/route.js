// app/api/update-course-version/route.js
import dbConnect from '@/config/connectDB'; // Đảm bảo đường dẫn đúng đến file kết nối DB
import PostCourse from '@/models/course';   // Đảm bảo đường dẫn đúng đến Mongoose model của bạn

export async function GET(request) {
    await dbConnect(); // Kết nối đến database

    try {
        // Cập nhật tất cả các tài liệu PostCourse để thêm hoặc đặt trường 'Version' về 0.
        // Điều kiện {}: sẽ khớp với TẤT CẢ các tài liệu trong collection.
        // $set: { Version: 0 }: Đặt giá trị của trường 'Version' là 0.
        // option { new: true }: Trả về tài liệu đã cập nhật (không cần thiết cho updateMany nhưng là thông lệ).
        const result = await PostCourse.updateMany(
            {}, // Điều kiện rỗng để khớp với tất cả các tài liệu
            { $set: { Version: 0 } } // Cập nhật trường Version thành 0
        );

        // Trả về phản hồi thành công
        return new Response(
            JSON.stringify({
                message: `Đã cập nhật thành công trường 'Version' về 0 cho tất cả ${result.modifiedCount} tài liệu Course.`,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error('Lỗi khi cập nhật Version cho Course:', error);
        return new Response(
            JSON.stringify({
                message: 'Đã xảy ra lỗi khi cập nhật Version cho Course.',
                error: error.message,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}