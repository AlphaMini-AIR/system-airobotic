import { NextResponse } from 'next/server';
import PostBook from '@/models/book'; // Đảm bảo đường dẫn này chính xác
import connectDB from '@/config/connectDB'; // Đảm bảo đường dẫn này chính xác

// --- LẤY TẤT CẢ SÁCH (GET) ---
export async function GET(request) {
    try {
        await connectDB();

        const data = await PostBook.find();

        return NextResponse.json(
            { status: 200, mes: 'Lấy dữ liệu thành công', data },
            { status: 200 }
        );

    } catch (error) {
        console.error('API GET error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { ID, Name, Type, Price, Image, Topics } = body;
        const missingFields = [];
        if (!ID) missingFields.push('ID');
        if (!Name) missingFields.push('Name');
        if (!Type) missingFields.push('Type');
        if (Price === undefined || Price === null) missingFields.push('Price');
        if (!Image) missingFields.push('Image');
        ID = ID.toUpperCase();
        
        if (missingFields.length > 0) {
            const message = `Dữ liệu không hợp lệ. Các trường sau là bắt buộc: ${missingFields.join(', ')}.`;
            return NextResponse.json(
                { status: 1, mes: message, data: null },
                { status: 400 } // Bad Request
            );
        }

        // === Tạo và lưu vào database ===
        const newBook = new PostBook({
            ID,
            Name,
            Type,
            Price,
            Image,
            Topics // Mongoose sẽ đặt giá trị mặc định là [] nếu không được cung cấp
        });

        const savedBook = await newBook.save();

        return NextResponse.json(
            { status: 2, mes: 'Thêm chương trình thành công.', data: savedBook },
            { status: 201 } // Created
        );

    } catch (error) {
        console.error('API POST Error:', error);

        // Xử lý lỗi validation hoặc lỗi trùng lặp ID từ Mongoose
        if (error.name === 'ValidationError' || (error.code && error.code === 11000)) {
            const message = error.code === 11000
                ? `ID '${error.keyValue.ID}' đã tồn tại. Vui lòng chọn một ID khác.`
                : 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.';

            return NextResponse.json(
                { status: 1, mes: message, data: null },
                { status: 400 } // Bad Request
            );
        }

        // Xử lý các lỗi server khác
        return NextResponse.json(
            { status: 1, mes: 'Lỗi máy chủ: Không thể tạo chương trình.', data: null },
            { status: 500 } // Internal Server Error
        );
    }
}