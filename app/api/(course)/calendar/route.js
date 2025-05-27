import { NextResponse } from 'next/server';
import PostCourse from '@/models/course';
import connectDB from '@/config/connectDB';

export async function GET(request) {
  try {
    // 1. Parse month & year from query
    const { searchParams } = new URL(request.url);
    const monthParam = parseInt(searchParams.get('month') || '', 10);
    const yearParam = parseInt(searchParams.get('year') || '', 10);

    if (
      Number.isNaN(monthParam) ||
      Number.isNaN(yearParam) ||
      monthParam < 1 ||
      monthParam > 12
    ) {
      return NextResponse.json(
        { error: 'Tham số month và year không hợp lệ' },
        { status: 400 }
      );
    }

    // 2. Connect to the database
    await connectDB();

    // 3. Compute the date range for that month
    //    JS Date months are 0-based
    const startDate = new Date(yearParam, monthParam - 1, 1);
    const endDate = new Date(yearParam, monthParam, 1);

    // 4. Run the aggregation pipeline
    const events = await PostCourse.aggregate([
      { $unwind: '$Detail' },

      // Parse the 'dd/MM/yyyy' string into a real Date object
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: '$Detail.Day',
              format: '%d/%m/%Y'
            }
          }
        }
      },

      // Only keep those within the requested month/year
      {
        $match: {
          parsedDate: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },

      // Sort ascending by that date
      { $sort: { parsedDate: 1 } },

      // Project the fields you need
      {
        $project: {
          _id: 0,
          courseId: '$ID',
          courseName: '$Name',
          day: '$Detail.Day',
          month: { $month: '$parsedDate' },
          year: { $year: '$parsedDate' },
          topic: '$Detail.Topic',
          room: '$Detail.Room',
          time: '$Detail.Time',
          lesson: '$Detail.Lesson',
          teacher: '$Detail.Teacher',
          teachingAs: '$Detail.TeachingAs',
          id: '$Detail.Image',
        }
      }
    ]);

    // 5. Return JSON
    return NextResponse.json(
      { status: 2, mes: 'Lấy dữ liệu thành công', data: events },
      { status: 200 }
    );

  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
