import connectDB from '@/config/connectDB'
import { Re_Area } from '@/data/area'
import PostArea from '@/models/area'
import { NextResponse } from 'next/server'
import jsonRes, { corsHeaders } from '@/utils/response'

export async function GET(request) {
    try {
        await connectDB()
        const data = await PostArea.find({}).sort({ createdAt: -1 }).lean()
        return jsonRes(200, { status: true, mes: 'Lấy dữ liệu thành công', data })

    } catch (error) {
        return jsonRes(error.message === 'Authentication failed' ? 401 : 500, { status: false, mes: error.message, data: [] })
    }
}

export async function POST(request) {
    try {
        await connectDB()
        const body = await request.json()
        const { name, room, color } = body

        if (!name || !room || !color) {
            return jsonRes(400, { status: false, mes: 'Vui lòng cung cấp đầy đủ các trường: name, room, và color.', data: [] })
        }

        const existingArea = await PostArea.findOne({ name }).lean()
        if (existingArea) {
            return jsonRes(409, { status: false, mes: `Khu vực với tên "${name}" đã tồn tại.`, data: [] })
        }

        const newArea = new PostArea({ name, room, color })
        await newArea.save()
        await Re_Area()
        return jsonRes(201, { status: true, mes: 'Tạo khu vực mới thành công!', data: newArea })

    } catch (error) {
        return jsonRes(error.message === 'Authentication failed' ? 401 : 500, { status: false, mes: error.message || 'Đã xảy ra lỗi từ máy chủ.', data: [] })
    }
}