import { NextResponse } from 'next/server'
import PostBook from '@/models/book'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import jsonRes from '@/utils/response'

export async function GET(request) {
    try {
        await connectDB()
        const data = await PostBook.find().lean()
        return jsonRes(200, { status: true, mes: 'Lấy dữ liệu thành công', data })
    } catch (error) {
        return jsonRes(500, { status: false, mes: 'Internal Server Error', data: null })
    }
}

export async function POST(request) {
    try {
        const authResult = await authenticate(request)
        if (!authResult || !authResult.user) {
            return jsonRes(401, { status: false, mes: 'Xác thực không thành công hoặc không tìm thấy người dùng.', data: null })
        }

        const { user, body } = authResult
        if (!user.role.includes('Admin') && !user.role.includes('Acadamic')) {
            return jsonRes(403, { status: false, mes: 'Bạn không có quyền truy cập vào chức năng này.', data: null })
        }

        await connectDB()
        const { ID, Name, Type, Price, Image, Topics } = body;

        const missingFields = []
        if (!ID) missingFields.push('ID')
        if (!Name) missingFields.push('Name')
        if (!Type) missingFields.push('Type')
        if (Price === undefined || Price === null) missingFields.push('Price')
        if (!Image) missingFields.push('Image')

        if (missingFields.length > 0) {
            const message = `Dữ liệu không hợp lệ. Các trường sau là bắt buộc: ${missingFields.join(', ')}`
            return jsonRes(400, { status: false, mes: message, data: null })
        }

        const urlPattern = new RegExp('^(https?:\\/\\/)?' + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + '((\\d{1,3}\\.){3}\\d{1,3}))' + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + '(\\?[;&a-z\\d%_.~+=-]*)?' + '(\\#[-a-z\\d_]*)?$', 'i')
        if (!urlPattern.test(Image)) {
            return jsonRes(400, { status: false, mes: 'URL hình ảnh không hợp lệ.', data: null })
        }

        const normalizedID = ID.toUpperCase();

        const existingBook = await PostBook.findOne({ ID: normalizedID }).lean()
        if (existingBook) {
            return jsonRes(409, { status: false, mes: `ID '${normalizedID}' đã tồn tại. Vui lòng sử dụng một ID khác.`, data: null })
        }

        const newBook = new PostBook({ ID: normalizedID, Name, Type, Price, Image, Topics })
        const savedBook = await newBook.save()
        return jsonRes(201, { status: true, mes: 'Thêm chương trình thành công.', data: savedBook })

    } catch (error) {
        if (error.name === 'ValidationError' || (error.code && error.code === 11000)) {
            const message = error.code === 11000
                ? `ID '${error.keyValue.ID || body.ID.toUpperCase()}' đã tồn tại.`
                : 'Dữ liệu nhập vào không hợp lệ.'
            return jsonRes(400, { status: false, mes: message, data: null })
        }
        return jsonRes(500, { status: false, mes: 'Lỗi máy chủ: Không thể tạo chương trình.', data: null })
    }
}