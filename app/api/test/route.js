import { NextResponse } from 'next/server';
import dbConnect from '@/config/connectDB';
import PostStudent from '@/models/student';

/**
 * API Route to bulk update all student documents.
 * Action 1: Removes the 'Type' field from all documents.
 * Action 2: Resets the 'Status' field to a default value for all documents.
 */
export async function POST(request) {
    try {
        // Connect to the database
        await dbConnect();

        // 1. Define the new default value for the 'Status' field.
        // This value conforms to the 'Status' sub-schema (status is a String).
        const newDefaultStatus = [{
            status: 2, // Assuming 'active' is the default status
            act: 'tạo', // Using 'create' as a string to match the Schema type
            date: new Date(),
            note: 'Tạo học sinh thành công' // Note for the action
        }];

        // 2. Use `updateMany` to apply changes to all documents in the collection.
        // - Filter `{}`: An empty filter selects ALL documents.
        // - Update operations:
        //   - `$unset: { Type: "" }`: This operator deletes the 'Type' field completely.
        //   - `$set: { Status: newDefaultStatus }`: This operator overwrites the existing 'Status' field with the new default value.
        const result = await PostStudent.updateMany(
            {}, // Empty filter to match all documents
            {
                $unset: { Type: "" }, // Remove the 'Type' field
                $set: { Status: newDefaultStatus } // Set the 'Status' field to the new default
            }
        );

        // 3. Return a successful response with statistics about the update operation.
        return NextResponse.json({
            success: true,
            message: 'Đã xóa trường "Type" và reset "Status" cho tất cả học sinh thành công.',
            data: {
                matchedCount: result.matchedCount, // Number of documents that matched the filter
                modifiedCount: result.modifiedCount, // Number of documents that were actually modified
            }
        }, { status: 200 });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Lỗi API - Không thể cập nhật hàng loạt cho học sinh:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ. Không thể hoàn thành yêu cầu.',
                error: error.message
            },
            { status: 500 }
        );
    }
}
