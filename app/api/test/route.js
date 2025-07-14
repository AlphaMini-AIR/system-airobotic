import { NextResponse } from 'next/server';
import dbConnect from '@/config/connectDB';
import Area from '@/models/area';
import Course from '@/models/course';

export const dynamic = 'force-dynamic';   // luôn chạy server-side

const specialRoomMap = new Map([
    ['long khánh', '6873385f5a9f5d813b1bdcc1'],
    ['ai robotic', '6873385f5a9f5d813b1bdcc1'],
    ['kt_p2', '687338595a9f5d813b1bdcbb'],
    ['kt_p1', '687338595a9f5d813b1bdcba'],
    ['t&a', '687338155a9f5d813b1bdcb3'],
    ['lab_b304', '687338155a9f5d813b1bdcb3'],
    ['kt_2', '687338595a9f5d813b1bdcbb'],
    ['kt_1', '687338595a9f5d813b1bdcba'],
    ['t&a lab', '687338155a9f5d813b1bdcb3']
]);

export async function PUT(req) {
    try {
        await dbConnect();

        const url = new URL(req.url);
        const courseId = url.searchParams.get('courseId');   // null → tất cả
        const query = courseId ? { _id: courseId } : {};

        /* ❷ Nạp dữ liệu */
        const [courses, areas] = await Promise.all([
            Course.find(query).lean(),
            Area.find().lean()
        ]);

        /* ❸ Map phòng trong Area → _id  */
        const areaRoomMap = new Map();
        areas.forEach(a =>
            a.rooms.forEach(r =>
                areaRoomMap.set(r.name.trim().toLowerCase(), String(r._id))
            )
        );

        const notFoundRooms = [];          // [{ courseId, room }]
        const unresolvedSet = new Set();   // _id khóa chưa xong
        let coursesUpdated = 0;           // số khóa có ÍT NHẤT 1 buổi được đổi

        /* ❹ Xử lý từng khóa */
        for (const course of courses) {
            const details = Array.isArray(course.Detail)
                ? course.Detail
                : [course.Detail || {}];

            const setOps = {};
            let changed = false;

            details.forEach((d, idx) => {
                if (!d.Room || typeof d.Room !== 'string') return;

                const key = d.Room.trim().toLowerCase();
                const matchedId =
                    specialRoomMap.get(key) || areaRoomMap.get(key);

                if (matchedId) {
                    setOps[`Detail.${idx}.Room`] = matchedId;
                    changed = true;
                } else {
                    notFoundRooms.push({ courseId: String(course._id), room: d.Room });
                    unresolvedSet.add(String(course._id));               // đánh dấu khóa lỗi
                }
            });

            if (changed) {
                await Course.updateOne({ _id: course._id }, { $set: setOps });
                coursesUpdated += 1;
            }
        }

        /* ❺ Chuẩn bị thống kê */
        const unresolvedCourseIds = [...unresolvedSet];

        return NextResponse.json({
            message: 'Đã hoàn tất cập nhật',
            totalCoursesScanned: courses.length,
            coursesUpdated,                              // ≥ 1 buổi được đổi
            coursesUnresolved: unresolvedCourseIds.length,
            unresolvedCourseIds,                         // mảng _id khóa chưa xong
            totalNotFound: notFoundRooms.length,
            notFoundRooms
        });
    } catch (err) {
        console.error('update-room-id error:', err);
        return NextResponse.json(
            { message: 'Có lỗi xảy ra', error: err.message },
            { status: 500 }
        );
    }
}