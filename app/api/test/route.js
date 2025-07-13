import { NextResponse } from 'next/server'
import { Types } from 'mongoose'
import dbConnect from '@/config/connectDB'
import Area from '@/models/area'         
import jsonRes from '@/utils/response'    

export async function GET() {
    try {
        await dbConnect()

        const areas = await Area.find()
        let scanned = 0
        let updated = 0

        for (const area of areas) {
            scanned++

            // lấy danh sách phòng gốc (rooms mới hoặc room cũ - kiểu string[])
            let rawRooms = area.rooms?.length ? area.rooms : area.room || []

            // đã chuẩn rồi (đã có id) ⇒ bỏ qua
            if (rawRooms.length && typeof rawRooms[0] === 'object' && rawRooms[0].id) continue

            // chuyển string[] → [{id,name}]
            const newRooms = rawRooms.map((name) => ({
                id: new Types.ObjectId().toString(),
                name: String(name).trim()
            }))

            // gán & xoá trường cũ nếu có
            area.rooms = newRooms
            if (area.room) area.room = undefined

            await area.save()
            updated++
        }

        return jsonRes(200, {
            status: true,
            mes: 'Migration completed',
            data: { scanned, updated }
        })
    } catch (e) {
        console.error('ROOM-MIGRATION ERR:', e)
        return jsonRes(500, { status: false, mes: 'Server error', data: null })
    }
}
