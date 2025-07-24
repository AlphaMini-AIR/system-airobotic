import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import { Re_Student_ById } from '@/data/student';
import '@/models/course'
import '@/models/book';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        await connectDB();
        const student = await PostStudent.findById(id).populate({
            path: 'Course.course',
            model: 'course',
            populate: {
                path: 'Book',
                model: 'book'
            },
            select: 'Name ID Book'
        }).lean();

        if (!student) {
            return NextResponse.json(
                { status: false, mes: 'Không tìm thấy học sinh.', data: null },
                { status: 404, headers: corsHeaders }
            );
        }
        return NextResponse.json(
            { status: true, mes: 'Lấy dữ liệu thành công.', data: { profile: student.Profile, name: student.Name, id: student.ID, course: student.Course } },
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.log(error);
        
        return NextResponse.json(
            { status: false, mes: error.message, data: null },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        if (!body || Object.keys(body).length === 0) {
            return NextResponse.json(
                { status: false, mes: 'Dữ liệu profile không được để trống.', data: null },
                { status: 400, headers: corsHeaders }
            );
        }

        await connectDB();
        const updated = await PostStudent.findByIdAndUpdate(
            id,
            { Profile: body },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return NextResponse.json(
                { status: false, mes: 'Cập nhật thất bại, không tìm thấy học sinh.', data: null },
                { status: 404, headers: corsHeaders }
            );
        }
        Re_Student_ById(id);
        return NextResponse.json(
            { status: true, mes: 'Cập nhật hồ sơ thành công.', data: null },
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        return NextResponse.json(
            { status: false, mes: error.message, data: null },
            { status: error.name === 'ValidationError' ? 400 : 500, headers: corsHeaders }
        );
    }
}