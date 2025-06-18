import { NextResponse } from 'next/server';
import PostCourse from '@/models/course';
import connectDB from '@/config/connectDB';

function parseDate(value) {
    // 1. Nếu đã là Date hợp lệ, trả về ngay
    if (value instanceof Date && !isNaN(value)) {
        return value;
    }

    // 2. Chỉ xử lý chuỗi
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    // 3. Chuyển đổi trực tiếp. new Date() của JS hỗ trợ rất tốt định dạng này.
    const directParsedDate = new Date(value);
    if (!isNaN(directParsedDate)) {
        return directParsedDate;
    }

    // Các phương án dự phòng khác có thể thêm ở đây nếu cần

    // 4. Nếu mọi cách đều thất bại
    return null;
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json().catch(() => ({}));
        const { courseId } = body;

        // Chế độ 1: Xử lý một khóa học cụ thể
        if (courseId) {
            const course = await PostCourse.findById(courseId).lean();
            if (!course) {
                return NextResponse.json(
                    { success: false, message: 'Không tìm thấy khóa học.' },
                    { status: 404 }
                );
            }

            let needsUpdate = false;
            for (const detailItem of course.Detail) {
                const originalDay = detailItem.Day;
                if (typeof originalDay === 'string') {
                    const newDate = parseDate(originalDay);
                    if (newDate) {
                        detailItem.Day = newDate;
                        needsUpdate = true;
                    } else if (originalDay) { 
                        return NextResponse.json(
                            {
                                success: false,
                                message: `Khóa học ID "${course.ID}" chứa định dạng ngày không hợp lệ.`,
                                errorValue: originalDay,
                            },
                            { status: 400 }
                        );
                    }
                }
            }

            if (needsUpdate) {
                course.markModified('Detail');
                await course.save();
            }

            return NextResponse.json({
                success: true,
                message: `Đã kiểm tra và cập nhật thành công cho khóa học ID: ${course.ID}.`,
                updated: needsUpdate,
            });
        }

        // Chế độ 2: Xử lý hàng loạt tất cả các khóa học
        const coursesToProcess = await PostCourse.find({
            'Detail.Day': { $type: 'string', $ne: '' },
        });

        if (coursesToProcess.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Tất cả các khóa học đều có định dạng ngày hợp lệ.',
            });
        }

        const bulkOps = [];
        const failedCourses = [];

        for (const course of coursesToProcess) {
            let hasError = false;
            let needsUpdate = false;

            const newDetail = course.Detail.map(detailItem => {
                if (typeof detailItem.Day !== 'string' || detailItem.Day === '') {
                    return detailItem;
                }

                const newDate = parseDate(detailItem.Day);
                if (newDate === null) {
                    hasError = true;
                    return detailItem;
                } else {
                    needsUpdate = true;
                    return { ...detailItem, Day: newDate };
                }
            });

            if (hasError) {
                failedCourses.push({ id: course._id, ID: course.ID });
            } else if (needsUpdate) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: course._id },
                        update: { $set: { Detail: newDetail } },
                    },
                });
            }
        }

        if (bulkOps.length > 0) {
            await PostCourse.bulkWrite(bulkOps);
        }

        return NextResponse.json({
            success: true,
            message: 'Hoàn tất quá trình kiểm tra hàng loạt.',
            data: {
                coursesScanned: coursesToProcess.length,
                coursesUpdated: bulkOps.length,
                coursesFailed: failedCourses,
            },
        });

    } catch (error) {
        console.error('Lỗi API validate-day:', error);
        return NextResponse.json(
            { success: false, error: 'Lỗi máy chủ nội bộ' },
            { status: 500 }
        );
    }
}