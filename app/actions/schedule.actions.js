'use server';
import connectToDatabase from "@/config/connectDB";
import "@/models/users";
import ZaloAccount from "@/models/zalo";
import ScheduledJob from "@/models/schedule";
import checkAuthToken from "@/utils/checktoken";
import { user_data } from '@/data/actions/get';
import { revalidateData } from "./customer.actions";
import { reloadRunningSchedules } from "@/data/actions/reload";
import { unstable_cache as nextCache } from 'next/cache';

export async function getRunningSchedulesAction() {
    try {
        const user = await checkAuthToken();
        if (!user?.id || (!user.role.includes('Admin') && !user.role.includes('Sale'))) {
            throw new Error("Không có quyền xem thông tin này.");
        }
        const getSchedules = nextCache(async (currentUser) => {
            await connectToDatabase();
            const filter = {};
            if (currentUser.role.includes('Sale') && !currentUser.role.includes('Admin')) {
                const permittedAccountIds = (await ZaloAccount.find({ roles: currentUser.id }).select('_id').lean()).map(acc => acc._id);
                if (permittedAccountIds.length === 0) return [];
                filter.zaloAccount = { $in: permittedAccountIds };
            }
            return ScheduledJob.find(filter)
                .populate('zaloAccount', 'name avt')
                .populate('createdBy', 'name')
                .populate({
                    path: 'tasks',
                    populate: {
                        path: 'history',
                        model: 'logmes',
                        select: 'status'
                    }
                })
                .sort({ createdAt: -1, _id: -1 })
                .lean();
        }, ['running-schedules', user.id], { tags: ['running-schedules'] });
        const data = await getSchedules(user);
        return { success: true, data: JSON.parse(JSON.stringify(data)) };
    } catch (err) {
        console.error("Error getting running schedules:", err);
        return { success: false, error: err.message || "Lỗi không xác định từ máy chủ khi lấy danh sách lịch trình." };
    }
}

function schedulePersonsSmart(persons, account, actionsPerHour, actionType, startTime = null) {
    const scheduledTasks = [];
    const baseIntervalMs = 3600000 / actionsPerHour;
    const now = new Date();
    let currentTime = startTime ? new Date(startTime) : new Date(Math.max(now.getTime(), account.rateLimitHourStart?.getTime() || 0));
    let rateLimitHourStart = new Date(account.rateLimitHourStart || now);
    let rateLimitDayStart = new Date(account.rateLimitDayStart || now);
    let actionsUsedThisHour = account.actionsUsedThisHour || 0;
    let actionsUsedThisDay = account.actionsUsedThisDay || 0;
    const getNextDayStart = (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        return nextDay;
    };
    for (const person of persons) {
        if (actionType !== "sendMessage") {
            let safeTimeFound = false;
            while (!safeTimeFound) {
                const currentHourStartRef = new Date(currentTime);
                currentHourStartRef.setMinutes(0, 0, 0);
                if (currentTime.getTime() >= rateLimitHourStart.getTime() + 3600000) {
                    rateLimitHourStart = new Date(currentHourStartRef);
                    actionsUsedThisHour = 0;
                }
                if (currentTime.getTime() >= getNextDayStart(rateLimitDayStart).getTime()) {
                    rateLimitDayStart = new Date(currentTime);
                    rateLimitDayStart.setHours(0, 0, 0, 0);
                    actionsUsedThisDay = 0;
                    actionsUsedThisHour = 0;
                }
                if (actionsUsedThisHour >= account.rateLimitPerHour) {
                    currentTime = new Date(rateLimitHourStart.getTime() + 3600000);
                    continue;
                }
                if (actionsUsedThisDay >= account.rateLimitPerDay) {
                    currentTime = getNextDayStart(rateLimitDayStart);
                    continue;
                }
                safeTimeFound = true;
            }
        }
        const jitterMs = (Math.random() - 0.5) * baseIntervalMs * 0.3;
        const finalScheduledTime = new Date(currentTime.getTime() + jitterMs);
        scheduledTasks.push({
            person: {
                name: person.name || '',
                phone: person.phone || '',
                uid: person.uid || '',
                _id: person._id || '',
                type: person.type || false
            },
            scheduledFor: finalScheduledTime,
            status: false
        });
        actionsUsedThisHour++;
        actionsUsedThisDay++;
        currentTime.setTime(currentTime.getTime() + baseIntervalMs);
    }
    return {
        scheduledTasks,
        estimatedCompletion: new Date(currentTime.getTime()),
        finalCounters: { actionsUsedThisHour, rateLimitHourStart, actionsUsedThisDay, rateLimitDayStart },
    };
}


export async function createScheduleAction(prevState, formData) {
    try {
        const user = await checkAuthToken();
        if (!user || !user.id) throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) throw new Error("Bạn không có quyền thực hiện chức năng này.");

        await connectToDatabase();

        const { jobName, actionType, actionsPerHour, messageTemplate, selectedCustomersJSON } = Object.fromEntries(formData);

        // **QUAN TRỌNG**: Dữ liệu `tasksToSchedule` giờ sẽ chứa các object có cả `uid`
        const tasksToSchedule = JSON.parse(selectedCustomersJSON);

        if (!tasksToSchedule || tasksToSchedule.length === 0) throw new Error("Không có khách hàng nào được chọn.");

        let dbUser = await user_data({ _id: user.id });
        dbUser = dbUser[0] || {};
        if (!dbUser?.zalo?._id) throw new Error("Chưa chọn tài khoản Zalo hoạt động.");

        const zaloAccountId = dbUser.zalo._id;
        const account = await ZaloAccount.findById(zaloAccountId);
        if (!account) throw new Error("Không tìm thấy tài khoản Zalo.");

        let finalActionsPerHour = Math.min(Number(actionsPerHour) || 30, 30);

        // Logic "nối đuôi" cho 'findUid' vẫn giữ nguyên, nó hoạt động tốt.
        if (actionType === "findUid") {
            const existingJob = await ScheduledJob.findOne({
                zaloAccount: zaloAccountId,
                actionType: 'findUid',
                $expr: { $lt: ["$statistics.completed", "$statistics.total"] }
            }).sort({ createdAt: -1 });

            if (existingJob) {
                const existingPhones = new Set(existingJob.tasks.map(task => task.person.phone));
                const uniqueTasksToSchedule = tasksToSchedule.filter(task => !existingPhones.has(task.phone));
                const duplicateCount = tasksToSchedule.length - uniqueTasksToSchedule.length;

                if (uniqueTasksToSchedule.length === 0) {
                    return { success: true, message: `Tất cả ${tasksToSchedule.length} người trong danh sách mới đã tồn tại trong lịch chạy. Không có gì để thêm.` };
                }

                // Hàm schedulePersonsSmart sẽ tạo task với cấu trúc { person: { name, phone, uid, ... }, scheduledFor: ... }
                const { scheduledTasks, estimatedCompletion, finalCounters } = schedulePersonsSmart(uniqueTasksToSchedule, account, finalActionsPerHour, actionType, existingJob.estimatedCompletionTime);
                console.log(scheduledTasks);

                await ScheduledJob.updateOne({ _id: existingJob._id }, {
                    $push: { tasks: { $each: scheduledTasks } },
                    $inc: { 'statistics.total': uniqueTasksToSchedule.length },
                    $set: { estimatedCompletionTime: estimatedCompletion }
                });

                await ZaloAccount.updateOne({ _id: zaloAccountId }, { $set: finalCounters });

                let message = `Đã có lịch tìm UID đang chạy. Đã thêm ${uniqueTasksToSchedule.length} người mới vào cuối lịch trình.`;
                if (duplicateCount > 0) {
                    message += ` Đã bỏ qua ${duplicateCount} người do bị trùng.`;
                }
                return { success: true, message: message };
            }
        }

        // Lên lịch cho một công việc hoàn toàn mới
        const { scheduledTasks, estimatedCompletion, finalCounters } = schedulePersonsSmart(tasksToSchedule, account, finalActionsPerHour, actionType);

        // Cập nhật bộ đếm cho tài khoản Zalo
        await ZaloAccount.updateOne({ _id: zaloAccountId }, { $set: finalCounters });

        // **THAY ĐỔI CHÍNH**: Tạo bản ghi `ScheduledJob` với cấu trúc khớp Schema
        const newJob = await ScheduledJob.create({
            jobName: jobName || `Lịch trình ngày ${new Date().toLocaleDateString("vi-VN")}`,
            actionType,
            zaloAccount: zaloAccountId,

            // Dữ liệu `tasks` đã có cấu trúc đúng từ hàm `schedulePersonsSmart`
            tasks: scheduledTasks,

            // Cấu trúc `config` đúng với Schema
            config: {
                actionsPerHour: finalActionsPerHour,
                // Chỉ lưu messageTemplate nếu action là sendMessage
                messageTemplate: actionType === 'sendMessage' ? messageTemplate : null
            },

            // Cấu trúc `statistics` đúng với Schema
            statistics: {
                total: tasksToSchedule.length,
                completed: 0,
                failed: 0
            },

            createdBy: user.id,
            // Thêm trường estimatedCompletionTime để tiện theo dõi, dù Schema không bắt buộc
            estimatedCompletionTime: estimatedCompletion,
        });

        // Liên kết job mới với tài khoản Zalo
        await ZaloAccount.findByIdAndUpdate(zaloAccountId, { $push: { action: newJob._id } });

        const duration = estimatedCompletion.getTime() - new Date().getTime();
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const message = `Đã tạo lịch trình "${newJob.jobName}" thành công! Ước tính hoàn thành trong ${hours} giờ ${minutes} phút.`;

        revalidateData();
        reloadRunningSchedules();
        return { success: true, message: message };
    } catch (err) {
        console.error("Error creating schedule:", err); // Log lỗi để debug
        return { success: false, error: err.message || "Lỗi không xác định từ máy chủ." };
    }
}

export async function cancelScheduleAction(prevState, formData) {
    try {
        const user = await checkAuthToken();
        if (!user || !user.id) throw new Error("Phiên đăng nhập không hợp lệ.");
        if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) throw new Error("Bạn không có quyền thực hiện chức năng này.");
        await connectToDatabase();
        const jobId = formData.get('jobId');
        if (!jobId) throw new Error("Thiếu ID của lịch trình.");
        const jobToDelete = await ScheduledJob.findById(jobId);
        if (!jobToDelete) throw new Error("Không tìm thấy lịch trình để hủy.");
        await ScheduledJob.deleteOne({ _id: jobId });
        await ZaloAccount.updateOne(
            { _id: jobToDelete.zaloAccount },
            { $pull: { action: jobId } }
        );
        revalidateData();
        reloadRunningSchedules();
        return { success: true, message: `Đã hủy thành công lịch trình "${jobToDelete.jobName}".` };
    } catch (err) {
        return { success: false, error: err.message || "Lỗi không xác định từ máy chủ." };
    }
}
