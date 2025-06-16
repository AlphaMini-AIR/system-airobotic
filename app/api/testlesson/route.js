// app/api/courses/fix-dates/route.js

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import User from '@/models/users';

/**
 * API dọn dẹp và báo cáo tổng thể cho mảng Detail của Course.
 * - Sửa lỗi và cập nhật dữ liệu (id, Day, Teacher, TeachingAs).
 * - Báo cáo chi tiết các khóa học cập nhật chưa hoàn tất do không tìm thấy user.
 */
export async function POST(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('id');

        const filter = {};
        if (courseId) {
            filter.ID = courseId;
        }

        const courses = await PostCourse.find(filter).lean();
        if (courseId && courses.length === 0) {
            return NextResponse.json({
                message: `Không tìm thấy khóa học nào với ID: '${courseId}'`,
                success: false,
            }, { status: 404 });
        }

        const operations = [];
        const userCache = new Map();
        const report = {
            partiallyUpdatedCourses: [], // Danh sách các khóa học cập nhật chưa hoàn tất
        };
        const stats = {
            totalDetailsModified: 0,
            teachersUpdated: 0,
            teachingAsUpdated: 0,
        };

        for (const course of courses) {
            let courseNeedsModification = false;
            const unresolvedNames = new Set(); // Theo dõi các tên không tìm thấy cho khóa học này

            const newDetailArray = await Promise.all(course.Detail.map(async (item) => {
                const updatedItem = { ...item };
                let itemModified = false;

                // --- Logic xử lý _id và Day (giữ nguyên) ---
                if (!updatedItem._id) {
                    updatedItem._id = new mongoose.Types.ObjectId();
                    courseNeedsModification = true;
                    itemModified = true;
                }
                if (updatedItem.Day && typeof updatedItem.Day === 'string') {
                    const dateParts = updatedItem.Day.split('/');
                    if (dateParts.length === 3) {
                        const [dd, mm, yyyy] = dateParts;
                        const newDate = new Date(`${yyyy}-${mm}-${dd}`);
                        if (!isNaN(newDate.getTime())) {
                            updatedItem.Day = newDate;
                            courseNeedsModification = true;
                            itemModified = true;
                        }
                    }
                }

                // --- Hàm trợ giúp tìm user (có cache) ---
                const findUserId = async (name) => {
                    if (!name || typeof name !== 'string' || !name.trim()) return { id: null, found: true }; // Bỏ qua nếu tên rỗng/không hợp lệ
                    const trimmedName = name.trim();
                    if (userCache.has(trimmedName)) return userCache.get(trimmedName);

                    const user = await User.findOne({ name: trimmedName }).select('_id').lean();
                    const result = user ? { id: user._id, found: true } : { id: null, found: false };
                    userCache.set(trimmedName, result);
                    return result;
                };

                // --- Cập nhật Teacher và ghi nhận thất bại ---
                if (updatedItem.Teacher && typeof updatedItem.Teacher === 'string') {
                    const { id, found } = await findUserId(updatedItem.Teacher);
                    if (found && id) {
                        updatedItem.Teacher = id;
                        courseNeedsModification = true;
                        itemModified = true;
                        stats.teachersUpdated++;
                    } else if (!found) {
                        unresolvedNames.add(updatedItem.Teacher.trim());
                    }
                }

                // --- Cập nhật TeachingAs và ghi nhận thất bại ---
                if (updatedItem.TeachingAs && typeof updatedItem.TeachingAs === 'string') {
                    const { id, found } = await findUserId(updatedItem.TeachingAs);
                    if (found && id) {
                        updatedItem.TeachingAs = id;
                        courseNeedsModification = true;
                        itemModified = true;
                        stats.teachingAsUpdated++;
                    } else if (!found) {
                        unresolvedNames.add(updatedItem.TeachingAs.trim());
                    }
                }

                if (itemModified) {
                    stats.totalDetailsModified++;
                }

                return updatedItem;
            }));

            // Nếu khóa học có thay đổi, chuẩn bị lệnh cập nhật
            if (courseNeedsModification) {
                operations.push({
                    updateOne: {
                        filter: { _id: course._id },
                        update: { $set: { Detail: newDetailArray } }
                    }
                });
            }

            // Nếu có tên không tìm thấy, thêm vào báo cáo
            if (unresolvedNames.size > 0) {
                report.partiallyUpdatedCourses.push({
                    ID: course.ID,
                    unresolvedNames: Array.from(unresolvedNames),
                });
            }
        }

        if (operations.length > 0) {
            await PostCourse.collection.bulkWrite(operations);
        }

        // --- Xây dựng phản hồi cuối cùng ---
        let finalMessage;
        let finalData = {
            totalCoursesScanned: courses.length,
            coursesUpdated: operations.length,
            ...stats
        };

        if (courseId) {
            // Chế độ xem một khóa học
            const courseReport = report.partiallyUpdatedCourses.find(c => c.ID === courseId);
            if (courseReport) {
                finalMessage = `Xử lý khóa học '${courseId}' hoàn tất. Không tìm thấy ${courseReport.unresolvedNames.length} user.`;
                finalData.unresolvedDetails = courseReport;
            } else {
                finalMessage = `Xử lý và cập nhật khóa học '${courseId}' hoàn tất.`;
            }
        } else {
            // Chế độ xem tất cả
            const partialCount = report.partiallyUpdatedCourses.length;
            if (partialCount > 0) {
                finalMessage = `Quá trình hoàn tất. Có ${partialCount} khóa học chưa được cập nhật đầy đủ do không tìm thấy user.`;
                finalData.partiallyUpdatedCourses = report.partiallyUpdatedCourses;
            } else {
                finalMessage = "Quá trình hoàn tất. Tất cả các khóa học đủ điều kiện đã được cập nhật đầy đủ.";
            }
        }

        return NextResponse.json({
            message: finalMessage,
            success: true,
            data: finalData
        });

    } catch (error) {
        console.error("Lỗi khi xử lý cập nhật khóa học:", error);
        return NextResponse.json({
            message: "Đã xảy ra lỗi máy chủ.",
            error: error.message,
            success: false,
        }, { status: 500 });
    }
}