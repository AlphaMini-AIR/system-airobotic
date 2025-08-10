import { NextResponse } from 'next/server';
import ScheduledJob from "@/models/schedule";
import ZaloAccount from "@/models/zalo";
import Customer from "@/models/customer";
import Student from "@/models/student";
import Variant from "@/models/variant";
import Logs from "@/models/log";
import dbConnect from "@/config/connectDB";
import { actionZalo } from '@/function/drive/appscript';
import { revalidateData } from '@/app/actions/customer.actions';
import { reloadRunningSchedules } from '@/data/actions/reload';

async function formatMessage(template, targetDoc, zaloAccountDoc) {
    if (!template) return "";
    let message = template;

    message = message.replace(/{name}/g, targetDoc.name || "");
    message = message.replace(/{nameparent}/g, targetDoc.nameparent || "");
    message = message.replace(/{namezalo}/g, targetDoc.zaloname || "");

    const variantPlaceholders = message.match(/{[^{}]+}/g) || [];
    for (const placeholder of variantPlaceholders) {
        const variantName = placeholder.slice(1, -1);
        const variant = await Variant.findOne({ name: variantName }).lean();
        if (variant && variant.phrases && variant.phrases.length > 0) {
            const randomPhrase = variant.phrases[Math.floor(Math.random() * variant.phrases.length)];
            message = message.replace(placeholder, randomPhrase);
        }
    }
    return message;
}

async function processSingleTask(taskDetail) {
    const { task, job, zaloAccount } = taskDetail;

    try {
        const isStudent = task.person.type === true;
        const TargetModel = isStudent ? Student : Customer;
        const targetId = task.person._id;
        const logTargetField = isStudent ? { student: targetId, customer: null } : { customer: targetId, student: null };

        const targetDoc = await TargetModel.findById(targetId).lean();

        if (!targetDoc) {
            throw new Error(`Target document not found in ${isStudent ? 'Student' : 'Customer'} with _id: ${targetId}`);
        }

        let apiResponse;
        let errorMessageForLog = null;
        const actionType = job.actionType;
        let uidPerson = null;
        if (isStudent) {
            uidPerson = targetDoc.Uid || null;
        } else {
            if (actionType === 'addFriend' || actionType === 'sendMessage') {
                const uidEntry = targetDoc.uid?.find(u => u.zalo?.toString() === zaloAccount._id.toString());
                if (!uidEntry || !uidEntry.uid) {
                    errorMessageForLog = "Không tìm thấy UID của khách hàng tương ứng với tài khoản Zalo thực hiện.";
                    apiResponse = { status: false, message: errorMessageForLog, content: { error_code: -1, error_message: errorMessageForLog, data: {} } };
                } else {
                    uidPerson = uidEntry.uid;
                }
            }
        }


        let finalMessage = "";
        if (!errorMessageForLog) {
            finalMessage = await formatMessage(job.config.messageTemplate, targetDoc, zaloAccount);
            apiResponse = await actionZalo({
                phone: targetDoc.phone,
                uidPerson: uidPerson,
                actionType: actionType,
                message: finalMessage,
                uid: zaloAccount.uid,
            });
        }
        const logPayload = {
            message: finalMessage || errorMessageForLog,
            status: {
                status: apiResponse.status,
                message: apiResponse.message,
                data: {
                    error_code: apiResponse.content?.error_code,
                    error_message: apiResponse.content?.error_message,
                }
            },
            type: actionType,
            createBy: job.createdBy,
            ...logTargetField,
            zalo: job.zaloAccount,
            schedule: job._id,
        };
        const newLog = await Logs.create(logPayload);

        const errorCode = apiResponse.content?.error_code;
        if (actionType === 'findUid') {
            const updateData = {};
            let uidToPush = null;

            if (errorCode === 0) {
                updateData.zaloavt = apiResponse.content.data.avatar;
                updateData.zaloname = apiResponse.content.data.zalo_name;
                uidToPush = { zalo: zaloAccount._id, uid: apiResponse.content.data.uid };
            } else if ([216, 212, 219].includes(errorCode)) {
                uidToPush = { zalo: zaloAccount._id, uid: null };
            }

            if (Object.keys(updateData).length > 0) {
                await TargetModel.findByIdAndUpdate(targetId, updateData);
            }
            if (uidToPush) {
                await TargetModel.findByIdAndUpdate(targetId, { $push: { uid: uidToPush } });
            }
        }

        await ScheduledJob.updateOne(
            { _id: job._id, 'tasks._id': task._id },
            { $set: { 'tasks.$.history': newLog._id } }
        );

        const statsUpdateField = apiResponse.status ? 'statistics.completed' : 'statistics.failed';
        await ScheduledJob.findByIdAndUpdate(job._id, { $inc: { [statsUpdateField]: 1 } });
    } catch (error) {
        console.error(`[Scheduler] Error processing task ${task._id} from job ${job._id}:`, error);
        await ScheduledJob.findByIdAndUpdate(job._id, { $inc: { 'statistics.failed': 1 } });
    }
}

export async function GET(request) {
    try {
        await dbConnect();
        const now = new Date();
        const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
        const dueTasksDetails = await ScheduledJob.aggregate([
            { $match: { 'tasks.status': false, 'tasks.scheduledFor': { $lte: oneMinuteLater } } },
            { $unwind: '$tasks' },
            { $match: { 'tasks.status': false, 'tasks.scheduledFor': { $lte: oneMinuteLater } } },
            {
                $lookup: {
                    from: 'zaloaccounts',
                    localField: 'zaloAccount',
                    foreignField: '_id',
                    as: 'zaloAccountInfo'
                }
            },
            { $match: { 'zaloAccountInfo': { $ne: [] } } },
            { $sort: { 'tasks.scheduledFor': 1 } },
            {
                $project: {
                    _id: 0,
                    job: { _id: '$_id', jobName: '$jobName', actionType: '$actionType', zaloAccount: '$zaloAccount', config: '$config', createdBy: '$createdBy' },
                    task: '$tasks',
                    zaloAccount: { $arrayElemAt: ['$zaloAccountInfo', 0] }
                }
            }
        ]);

        if (dueTasksDetails.length === 0) {
            return NextResponse.json({ message: 'No due tasks to process.' }, { status: 200 });
        }

        const taskUpdateOperations = dueTasksDetails.map(detail => ({
            updateOne: {
                filter: { _id: detail.job._id, 'tasks._id': detail.task._id },
                update: { $set: { 'tasks.$.status': true } }
            }
        }));
        await ScheduledJob.bulkWrite(taskUpdateOperations);

        for (const taskDetail of dueTasksDetails) {
            processSingleTask(taskDetail);
        }

        return NextResponse.json({
            message: `Scheduler triggered. Processing ${dueTasksDetails.length} tasks in the background.`
        }, { status: 202 });

    } catch (error) {
        console.error('[Scheduler API Error]', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}