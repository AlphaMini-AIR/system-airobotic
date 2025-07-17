import connectDB from '@/config/connectDB'
import Area from '@/models/area'
import jsonRes from '@/utils/response'
import { Re_Area } from '@/data/area'

export async function GET() {
    try {
        await connectDB()
        const data = await Area.find().sort({ createdAt: -1 }).lean()
        return jsonRes(200, { status: true, mes: 'Lấy dữ liệu thành công', data })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}

export async function POST(request) {
    try {
        await connectDB()
        const { name, rooms, color } = await request.json()
        if (!name || !rooms?.length || !color) {
            return jsonRes(400, { status: false, mes: 'Thiếu name, rooms hoặc color.', data: [] })
        }
        if (await Area.exists({ name })) {
            return jsonRes(409, { status: false, mes: `Khu vực "${name}" đã tồn tại.`, data: [] })
        }
        const normRooms = rooms.map((r) => typeof r === 'string' ? { name: r.trim() } : { name: String(r.name).trim() })
        const newArea = await Area.create({ name: name.trim(), rooms: normRooms, color })
        Re_Area()
        return jsonRes(201, { status: true, mes: 'Tạo khu vực thành công', data: newArea })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
