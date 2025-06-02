import connectDB from '@/config/connectDB'
import PostCourse from "@/models/course"
import { NextResponse } from 'next/server'


export async function GET(request) {
    try {

        await connectDB();
        const data = await PostCourse.find({}, { ID: 1, Name: 1, TimeEnd: 1, Status: 1, TimeStart: 1, Area: 1, TeacherHR: 1, Address: 1, Detail: 1 }).lean().exec();

        return NextResponse.json(
            { air: 2, mes: 'Lấy dữ liệu thành công', data },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { air: 0, mes: error.message, data: null },
            { status: error.message === 'Authentication failed' ? 401 : 500 }
        )
    }
}
