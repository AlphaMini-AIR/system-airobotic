// app/api/checkin/route.js
import { NextResponse } from 'next/server'
import PostCourse from '@/models/course'
import connectDB from '@/config/connectDB'

export async function POST(req) {
  try {
    const { courseId, sessionId, attendanceData } = await req.json()

    if (!courseId || !sessionId || !Array.isArray(attendanceData) || !attendanceData.length)
      return NextResponse.json({ status: 1, mes: 'Thiếu thông tin cần thiết', data: [] }, { status: 400 })

    await connectDB()

    const courseDoc = await PostCourse.findById(courseId).select('Student.ID').lean()
    if (!courseDoc)
      return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học', data: [] }, { status: 404 })

    const students = courseDoc.Student?.map(s => s.ID) ?? []
    if (!students.length)
      return NextResponse.json({ status: 1, mes: 'Khóa học này chưa có học sinh', data: [] }, { status: 400 })

    const bulkOps = []
    const seen = new Set()

    for (const { studentId, checkin, comment } of attendanceData) {
      if (seen.has(studentId) || !students.includes(studentId)) continue
      seen.add(studentId)

      const setObj = {
        [`Student.$[stu].Learn.${sessionId}.Checkin`]: Number(checkin)
      }
      if (comment !== undefined)
        setObj[`Student.$[stu].Learn.${sessionId}.Cmt`] = comment

      bulkOps.push({
        updateOne: {
          filter: { _id: courseId },
          update: { $set: setObj },
          arrayFilters: [{ 'stu.ID': studentId }]
        }
      })
    }

    if (!bulkOps.length)
      return NextResponse.json({ status: 1, mes: 'Không cập nhật được học sinh nào', data: [] }, { status: 400 })

    const { modifiedCount: updatedCount = 0 } = await PostCourse.bulkWrite(bulkOps)

    return NextResponse.json(
      { status: 2, mes: 'Cập nhật điểm danh thành công', data: { courseId, sessionId, updatedCount } },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: 1, mes: 'Lỗi server khi cập nhật điểm danh', data: [] },
      { status: 500 }
    )
  }
}
