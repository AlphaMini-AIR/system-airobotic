import { NextResponse } from 'next/server';
import dbConnect from '@/config/connectDB';      // Giả định bạn có file kết nối db
import PostCourse from '@/models/course';        // Import model của bạn

export async function POST(req) {
    // Kết nối đến cơ sở dữ liệu
    await dbConnect();

    try {
        // Lấy dữ liệu từ body của yêu cầu POST
        const body = await req.json();
        const { image, studentId, newImages } = body;

        // --- 1. Validation đầu vào ---
        if (!image || !studentId || !newImages) {
            return NextResponse.json(
                { success: false, message: "Thiếu trường 'image', 'studentId', hoặc 'newImages' trong body." },
                { status: 400 } // Bad Request
            );
        }

        if (!Array.isArray(newImages)) {
            return NextResponse.json(
                { success: false, message: "'newImages' phải là một mảng." },
                { status: 400 }
            );
        }

        // --- 2. Tìm kiếm khóa học chứa buổi học ---
        const course = await PostCourse.findOne({ 'Detail.Image': image });

        if (!course) {
            return NextResponse.json(
                { success: false, message: `Không tìm thấy khóa học nào chứa buổi học với mã image: ${image}` },
                { status: 404 } // Not Found
            );
        }

        // --- 3. Xác định buổi học và học sinh ---
        const lessonDetail = course.Detail.find(d => d.Image === image);
        if (!lessonDetail) {
            // Trường hợp này hiếm khi xảy ra nếu course được tìm thấy, nhưng vẫn kiểm tra cho chắc chắn
            return NextResponse.json({ success: false, message: "Lỗi nội bộ: Không tìm thấy chi tiết buổi học." }, { status: 500 });
        }
        const lessonObjectId = lessonDetail._id; // Lấy ObjectId để lưu vào trường Lesson
        const lessonCustomId = lessonDetail.ID;  // Lấy ID tùy chỉnh để làm key cho Map

        const studentIndex = course.Student.findIndex(s => s.ID === studentId);
        if (studentIndex === -1) {
            return NextResponse.json(
                { success: false, message: `Không tìm thấy học sinh với ID: ${studentId} trong khóa học này.` },
                { status: 404 }
            );
        }

        const imageUpdatePath = `Student.${studentIndex}.Learn.${lessonCustomId}.Image`;
        const lessonUpdatePath = `Student.${studentIndex}.Learn.${lessonCustomId}.Lesson`;

        const result = await PostCourse.updateOne(
            { _id: course._id }, 
            {
                $set: {
                    [imageUpdatePath]: newImages,       
                    [lessonUpdatePath]: lessonObjectId  
                }
            }
        );

        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            return NextResponse.json(
                { success: true, message: 'Dữ liệu không thay đổi (có thể đã được lưu trước đó).' },
                { status: 200 }
            );
        }

        // --- 5. Trả về kết quả thành công ---
        return NextResponse.json(
            { success: true, message: `Cập nhật ảnh cho học sinh ${studentId} thành công.` },
            { status: 200 } // OK
        );

    } catch (error) {
        console.error('API Error:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { success: false, message: 'Dữ liệu JSON trong body không hợp lệ.' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Lỗi máy chủ.', error: error.message },
            { status: 500 }
        );
    }
}
