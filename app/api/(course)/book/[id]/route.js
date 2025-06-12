import connectDB from '@/config/connectDB';
import Book from '@/models/book'; // Đảm bảo model Book của bạn có trường Topics là một Array
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/books/{id}:
 * get:
 * summary: Lấy thông tin chi tiết khóa học và các chủ đề đang hoạt động.
 * description: Trả về thông tin của khóa học dựa trên ID. Danh sách chủ đề (Topics) sẽ chỉ bao gồm các phần tử có `Status: true`.
 * tags: [Books]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: ID của khóa học.
 * responses:
 * 200:
 * description: Lấy dữ liệu thành công.
 * 404:
 * description: Không tìm thấy khóa học.
 * 500:
 * description: Lỗi máy chủ.
 */
export async function GET(request, { params }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ status: 1, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
    }

    try {
        await connectDB();

        // Sử dụng aggregation để lọc các chủ đề con có Status: true
        const course = await Book.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $project: {
                    Name: 1,
                    Type: 1,
                    Price: 1,
                    TotalLesson: 1,
                    Image: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    Topics: {
                        $filter: {
                            input: '$Topics',
                            as: 'topic',
                            cond: { $eq: ['$$topic.Status', true] }
                        }
                    }
                }
            }
        ]);

        if (!course || course.length === 0) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học với ID này.', data: [] },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { status: 2, mes: 'Lấy dữ liệu thành công.', data: course[0] },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { status: 1, mes: 'Đã có lỗi xảy ra trên máy chủ.', data: [] },
            { status: 500 }
        );
    }
}

/**
 * @swagger
 * /api/books/{id}:
 * post:
 * summary: Thêm chủ đề mới vào khóa học.
 * description: Thêm một hoặc nhiều chủ đề mới vào cuối danh sách `Topics` của khóa học.
 * tags: [Books]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: _id của khóa học cần thêm chủ đề.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * topics:
 * type: array
 * items:
 * type: object
 * properties:
 * Name:
 * type: string
 * Content:
 * type: string
 * example:
 * topics: [{ "Name": "Chủ đề mới", "Content": "Nội dung chủ đề..." }]
 * responses:
 * 200:
 * description: Thêm chủ đề thành công.
 * 400:
 * description: Dữ liệu không hợp lệ.
 * 404:
 * description: Không tìm thấy khóa học.
 * 500:
 * description: Lỗi máy chủ.
 */
export async function POST(request, { params }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ status: 1, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { topics } = body;

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return NextResponse.json({ status: 1, mes: 'Dữ liệu chủ đề không hợp lệ hoặc rỗng.' }, { status: 400 });
        }
        await connectDB();

        // Thêm các chủ đề mới vào mảng Topics
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { $push: { Topics: { $each: topics } } },
            { new: true, runValidators: true, lean: true }
        );

        if (!updatedBook) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học để thêm chủ đề.' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { status: 2, mes: 'Thêm chủ đề mới thành công.', data: updatedBook },
            { status: 200 }
        );

    } catch (error) {
        // Xử lý lỗi validation từ Mongoose
        if (error.name === 'ValidationError') {
            const firstErrorField = Object.keys(error.errors)[0];
            const errorMessage = error.errors[firstErrorField].message;
            return NextResponse.json({ status: 1, mes: errorMessage }, { status: 400 });
        }
        return NextResponse.json(
            { status: 1, mes: 'Đã có lỗi xảy ra trên máy chủ.' },
            { status: 500 }
        );
    }
}


/**
 * @swagger
 * /api/books/{id}:
 * put:
 * summary: Cập nhật thông tin khóa học, chủ đề hoặc sắp xếp lại chủ đề.
 * description: |
 * API linh hoạt cho phép 3 loại cập nhật khác nhau:
 * 1. **Cập nhật thông tin khóa học**: Gửi các trường cần cập nhật (Name, Price, ...).
 * 2. **Cập nhật một chủ đề**: Gửi `topicId` và các trường cần cập nhật của chủ đề đó.
 * 3. **Sắp xếp lại các chủ đề**: Gửi một mảng `orderedTopicIds` chứa các ID của chủ đề theo thứ tự mới.
 * tags: [Books]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: _id của khóa học cần cập nhật.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * examples:
 * updateCourse:
 * summary: Cập nhật thông tin khóa học
 * value:
 * Name: "Khóa học ReactJS nâng cao"
 * Price: 1200000
 * updateTopic:
 * summary: Cập nhật một chủ đề
 * value:
 * topicId: "66681b9b3e155c573e8a4a5f"
 * updateData:
 * Name: "Giới thiệu về React Hooks (đã cập nhật)"
 * Content: "Nội dung đã được cập nhật..."
 * reorderTopics:
 * summary: Sắp xếp lại chủ đề
 * value:
 * orderedTopicIds: ["66681b9b3e155c573e8a4a60", "66681b9b3e155c573e8a4a5f"]
 * responses:
 * 200:
 * description: Cập nhật thành công.
 * 400:
 * description: Dữ liệu không hợp lệ hoặc ID không hợp lệ.
 * 404:
 * description: Không tìm thấy khóa học hoặc chủ đề.
 * 500:
 * description: Lỗi máy chủ.
 */
export async function PUT(request, { params }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ status: 1, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
    }

    try {
        const body = await request.json();
        await connectDB();
        let updatedBook;

        // Trường hợp 3: Sắp xếp lại vị trí các chủ đề
        if (body.orderedTopicIds) {
            const book = await Book.findById(id);
            if (!book) {
                return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 });
            }

            const newTopicsOrder = body.orderedTopicIds.map(topicId => {
                const foundTopic = book.Topics.find(t => t._id.toString() === topicId);
                return foundTopic;
            }).filter(t => t); // Lọc bỏ các topic không tìm thấy

            if (newTopicsOrder.length !== book.Topics.length) {
                return NextResponse.json({ status: 1, mes: 'Danh sách ID chủ đề để sắp xếp không khớp.' }, { status: 400 });
            }

            book.Topics = newTopicsOrder;
            updatedBook = await book.save();

        }
        // Trường hợp 2: Cập nhật một chủ đề cụ thể
        else if (body.topicId && body.updateData) {
            if (!mongoose.Types.ObjectId.isValid(body.topicId)) {
                return NextResponse.json({ status: 1, mes: 'ID chủ đề không hợp lệ.' }, { status: 400 });
            }
            const updateFields = {};
            // Tạo các trường cần cập nhật cho chủ đề con
            for (const key in body.updateData) {
                updateFields[`Topics.$[elem].${key}`] = body.updateData[key];
            }

            updatedBook = await Book.findByIdAndUpdate(
                id,
                { $set: updateFields },
                {
                    arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(body.topicId) }],
                    new: true,
                    runValidators: true,
                    lean: true
                }
            );
        }
        // Trường hợp 1: Cập nhật thông tin khóa học
        else {
            const { topicId, updateData, orderedTopicIds, ...courseData } = body;
            updatedBook = await Book.findByIdAndUpdate(
                id,
                { $set: courseData },
                { new: true, runValidators: true, lean: true }
            );
        }

        if (!updatedBook) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy đối tượng để cập nhật.' }, { status: 404 });
        }

        return NextResponse.json(
            { status: 2, mes: 'Cập nhật thành công.', data: updatedBook },
            { status: 200 }
        );

    } catch (error) {
        if (error.name === 'ValidationError') {
            const firstErrorField = Object.keys(error.errors)[0];
            const errorMessage = error.errors[firstErrorField].message;
            return NextResponse.json({ status: 1, mes: errorMessage }, { status: 400 });
        }
        return NextResponse.json({ status: 1, mes: 'Đã có lỗi xảy ra trên máy chủ.' }, { status: 500 });
    }
}


/**
 * @swagger
 * /api/books/{id}:
 * delete:
 * summary: Vô hiệu hóa một chủ đề trong khóa học (Soft Delete).
 * description: Cập nhật trạng thái `Status` của một chủ đề thành `false` thay vì xóa vĩnh viễn.
 * tags: [Books]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: _id của khóa học.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * topicId:
 * type: string
 * description: _id của chủ đề cần vô hiệu hóa.
 * required:
 * - topicId
 * responses:
 * 200:
 * description: Vô hiệu hóa chủ đề thành công.
 * 400:
 * description: ID không hợp lệ.
 * 404:
 * description: Không tìm thấy khóa học hoặc chủ đề.
 * 500:
 * description: Lỗi máy chủ.
 */
export async function DELETE(request, { params }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ status: 1, mes: 'ID khóa học không hợp lệ.' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { topicId } = body;

        if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
            return NextResponse.json({ status: 1, mes: 'Yêu cầu phải có topicId hợp lệ.' }, { status: 400 });
        }

        await connectDB();

        const result = await Book.updateOne(
            { _id: id, 'Topics._id': new mongoose.Types.ObjectId(topicId) },
            { $set: { 'Topics.$.Status': false } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { status: 1, mes: 'Không tìm thấy khóa học hoặc chủ đề tương ứng.' },
                { status: 404 }
            );
        }

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { status: 1, mes: 'Chủ đề đã ở trạng thái vô hiệu hóa.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { status: 2, mes: 'Vô hiệu hóa chủ đề thành công.' },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { status: 1, mes: 'Đã có lỗi xảy ra trên máy chủ.' },
            { status: 500 }
        );
    }
}