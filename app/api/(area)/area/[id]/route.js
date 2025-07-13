import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Area from '@/models/area'
import { Re_Area } from '@/data/area'

const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)

export async function PUT(request, { params }) {
    const { id } = await params
    try {
        const { name, room, color } = await request.json()

        if (!name?.trim() || !room?.length || !isHex(color))
            return NextResponse.json({ status: 0, mes: 'Dữ liệu không hợp lệ.' }, { status: 400 })

        await connectDB()

        if (await Area.exists({ name: name.trim(), _id: { $ne: id } }))
            return NextResponse.json({ status: 0, mes: `Tên "${name}" đã tồn tại.` }, { status: 409 })
        const normRooms = room.map((r) =>
            typeof r === 'string' ? { name: r.trim() } : { name: String(r.name).trim() }
        )

        const updated = await Area.findByIdAndUpdate(
            id,
            { name: name.trim(), rooms: normRooms, color },
            { new: true, runValidators: true }
        )

        if (!updated)
            return NextResponse.json({ status: 0, mes: 'Không tìm thấy khu vực.' }, { status: 404 })

        await Re_Area()
        return NextResponse.json({ status: 2, mes: 'Cập nhật thành công!', data: updated }, { status: 200 })
    } catch (e) {
        const code = e.kind === 'ObjectId' ? 400 : e.message === 'Authentication failed' ? 401 : 500
        return NextResponse.json({ status: 0, mes: e.message }, { status: code })
    }
}
