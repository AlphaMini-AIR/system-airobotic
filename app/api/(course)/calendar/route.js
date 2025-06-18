import { NextResponse } from 'next/server';
import PostCourse from '@/models/course';
import connectDB from '@/config/connectDB';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = parseInt(searchParams.get('month'), 10);
    const yearParam = parseInt(searchParams.get('year'), 10);

    if (
      !Number.isInteger(monthParam) ||
      !Number.isInteger(yearParam) ||
      monthParam < 1 ||
      monthParam > 12
    ) {
      return NextResponse.json(
        { error: 'Tham số month và year không hợp lệ' },
        { status: 400 }
      );
    }

    await connectDB();

    const startDate = new Date(Date.UTC(yearParam, monthParam - 1, 1));
    const endDate = new Date(Date.UTC(yearParam, monthParam, 1));

    const events = await PostCourse.aggregate([
      { $unwind: '$Detail' },
      {
        $match: {
          'Detail.Day': {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },

      // === BẮT ĐẦU CHUỖI XỬ LÝ TOPIC PHỨC TẠP ===

      // 1. Join với collection 'books' để lấy document book tương ứng
      {
        $lookup: {
          from: 'books', // Tên collection của model Book
          localField: 'Book',
          foreignField: '_id',
          as: 'bookInfo',
        },
      },
      // Lấy document book ra khỏi mảng bookInfo (vì kết quả lookup luôn là mảng)
      {
        $addFields: {
          bookDoc: { $arrayElemAt: ['$bookInfo', 0] },
        },
      },
      // 2. Lọc mảng 'Topics' bên trong bookDoc để tìm đúng topic
      {
        $addFields: {
          matchedTopic: {
            $filter: {
              input: '$bookDoc.Topics',
              as: 'topicItem',
              cond: { $eq: ['$$topicItem._id', '$Detail.Topic'] },
            },
          },
        },
      },
      // 3. Lấy object topic ra khỏi mảng kết quả sau khi lọc
      {
        $addFields: {
          topic: { $arrayElemAt: ['$matchedTopic', 0] },
        },
      },

      // === KẾT THÚC CHUỖI XỬ LÝ TOPIC ===

      {
        $lookup: {
          from: 'users',
          localField: 'Detail.Teacher',
          foreignField: '_id',
          as: 'teacherInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'Detail.TeachingAs',
          foreignField: '_id',
          as: 'teachingAsInfo',
        },
      },
      { $sort: { 'Detail.Day': 1 } },
      {
        $project: {
          _id: '$Detail._id',
          courseId: '$ID',
          courseName: '$Name',
          day: { $dayOfMonth: '$Detail.Day' },
          month: { $month: '$Detail.Day' },
          year: { $year: '$Detail.Day' },
          date: '$Detail.Day',
          room: '$Detail.Room',
          time: '$Detail.Time',
          image: '$Detail.Image',
          topic: '$topic',
          teacher: { $arrayElemAt: ['$teacherInfo', 0] },
          teachingAs: { $arrayElemAt: ['$teachingAsInfo', 0] },
        },
      },
    ]);

    return NextResponse.json(
      { success: true, message: 'Lấy dữ liệu thành công', data: events },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi API lấy lịch trình:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}