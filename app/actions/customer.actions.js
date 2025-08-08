'use server';
import { unstable_cache as nextCache, revalidateTag } from 'next/cache';
import connectDB from "@/config/connectDB";
import Customer from "@/models/customer";
import Student from "@/models/student";
import mongoose from 'mongoose';
import checkAuthToken from '@/utils/checktoken';
import User from '@/models/users';
import '@/models/zalo'
import ScheduledJob from "@/models/schedule";
import { reloadStudent } from '@/data/actions/reload';
import { ProfileDefault, statusStudent } from '@/data/default';
import { getZaloUid } from '@/function/drive/appscript';

export async function getCombinedData(params) {
    const cachedData = nextCache(
        async (currentParams) => {
            await connectDB();
            const page = Number(currentParams.page) || 1;
            const limit = Number(currentParams.limit) || 10;
            const query = currentParams.query || '';
            const skip = (page - 1) * limit;
            let pipeline = [];
            let modelToUse;
            let shouldPopulate = false;
            if (currentParams.type === 'true') {
                modelToUse = Student;
                const filterConditions = [];
                if (query) {
                    filterConditions.push({ $or: [{ Name: { $regex: query, $options: 'i' } }, { Phone: { $regex: query, $options: 'i' } }, { NameParent: { $regex: query, $options: 'i' } }] });
                }
                if (currentParams.uidStatus === 'true') {
                    filterConditions.push({ uid: { $exists: true, $ne: null, $ne: '', $ne: 'Không có UID' } });
                } else if (currentParams.uidStatus === 'not_searched') {
                    filterConditions.push({ $or: [{ uid: null }, { uid: { $exists: false } }, { uid: '' }] });
                } else if (currentParams.uidStatus === 'not_found') {
                    filterConditions.push({ uid: 'Không có UID' });
                }
                const matchStage = filterConditions.length > 0 ? { $match: { $and: filterConditions } } : { $match: {} };
                pipeline = [
                    matchStage,
                    { $lookup: { from: 'forms', localField: 'Source', foreignField: '_id', as: 'sourceInfo' } },
                    { $unwind: { path: '$sourceInfo', preserveNullAndEmptyArrays: true } },
                    { $project: { _id: 1, name: "$Name", bd: "$bd", email: "$Email", phone: "$Phone", nameparent: "$NameParent", area: "$Area", uid: "$uid", createAt: "$createAt", type: { $literal: true }, source: "$sourceInfo.name", status: { $literal: null }, care: { $literal: [] } } }
                ];
            } else {
                shouldPopulate = true;
                modelToUse = Customer;
                const filterConditions = [];
                filterConditions.push({ 'status': { $ne: 1 } });
                if (query) {
                    filterConditions.push({ $or: [{ name: { $regex: query, $options: 'i' } }, { phone: { $regex: query, $options: 'i' } }, { nameparent: { $regex: query, $options: 'i' } }] });
                }
                if (currentParams.source) {
                    if (currentParams.source === 'null') {
                        filterConditions.push({ $or: [{ source: null }, { source: { $exists: false } }] });
                    } else if (mongoose.Types.ObjectId.isValid(currentParams.source)) {
                        filterConditions.push({ source: new mongoose.Types.ObjectId(currentParams.source) });
                    }
                }
                if (currentParams.area) {
                    filterConditions.push({ area: currentParams.area });
                }
                if (currentParams.careStatus) {
                    filterConditions.push({ status: parseInt(currentParams.careStatus, 10) });
                }
                if (currentParams.uidStatus === 'true') {
                    filterConditions.push({ 'uid.uid': { $exists: true, $ne: 'Không có UID' } });
                } else if (currentParams.uidStatus === 'not_searched') {
                    filterConditions.push({ $or: [{ uid: { $exists: false } }, { uid: null }, { uid: [] }] });
                } else if (currentParams.uidStatus === 'not_found') {
                    filterConditions.push({ 'uid.uid': 'Không có UID' });
                }
                if (currentParams.zaloAccount && mongoose.Types.ObjectId.isValid(currentParams.zaloAccount)) {
                    filterConditions.push({ uid: { $elemMatch: { zalo: new mongoose.Types.ObjectId(currentParams.zaloAccount) } } });
                }
                if (currentParams.label && mongoose.Types.ObjectId.isValid(currentParams.label)) {
                    filterConditions.push({ labels: new mongoose.Types.ObjectId(currentParams.label) });
                }
                const matchStage = filterConditions.length > 0 ? { $match: { $and: filterConditions } } : { $match: {} };
                pipeline = [
                    matchStage,
                    { $addFields: { type: false } },
                    { $lookup: { from: 'forms', localField: 'source', foreignField: '_id', as: 'sourceInfo' } },
                    { $unwind: { path: '$sourceInfo', preserveNullAndEmptyArrays: true } },
                    { $addFields: { source: '$sourceInfo.name' } },
                    { $project: { sourceInfo: 0 } }
                ];
            }
            const commonStages = [
                { $sort: { createAt: -1, _id: -1 } },
                { $facet: { paginatedResults: [{ $skip: skip }, { $limit: limit }], totalCount: [{ $count: 'count' }] } }
            ];
            pipeline.push(...commonStages);
            const results = await modelToUse.aggregate(pipeline).exec();
            let paginatedData = results[0]?.paginatedResults || [];
            if (shouldPopulate && paginatedData.length > 0) {
                const userIds = new Set();
                paginatedData.forEach(customer => {
                    customer.care?.forEach(note => { if (note.createBy) userIds.add(note.createBy.toString()); });
                });
                if (userIds.size > 0) {
                    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name avt').lean();
                    const userMap = new Map(users.map(u => [u._id.toString(), u]));
                    paginatedData.forEach(customer => {
                        customer.care?.forEach(note => { if (note.createBy && userMap.has(note.createBy.toString())) { note.createBy = userMap.get(note.createBy.toString()); } });
                    });
                }
            }
            const phoneNumbers = paginatedData.map(p => p.phone).filter(Boolean);
            if (phoneNumbers.length > 0) {
                const scheduledTasksRaw = await ScheduledJob.aggregate([
                    { $match: { $expr: { $lt: ["$statistics.completed", "$statistics.total"] } } },
                    { $unwind: "$tasks" },
                    { $match: { 'tasks.processedAt': { $exists: false }, 'tasks.person.phone': { $in: phoneNumbers } } },
                    { $sort: { 'tasks.scheduledFor': 1 } },
                    { $group: { _id: "$tasks.person.phone", job: { $first: "$$ROOT" } } },
                    { $lookup: { from: 'zaloaccounts', localField: 'job.zaloAccount', foreignField: '_id', as: 'zaloAccountInfo' } },
                    { $lookup: { from: 'users', localField: 'job.createdBy', foreignField: '_id', as: 'creatorInfo' } },
                    { $unwind: { path: '$zaloAccountInfo', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } },
                    { $project: { _id: 1, statusaction: { jobName: '$job.jobName', actionType: '$job.actionType', zaloAccount: { _id: '$job.zaloAccount', name: '$zaloAccountInfo.name', avt: '$zaloAccountInfo.avt' }, createdBy: { _id: '$job.createdBy', name: '$creatorInfo.name', avt: '$creatorInfo.avt' } } } }
                ]);
                const scheduleMap = new Map(scheduledTasksRaw.map(item => [item._id, item.statusaction]));
                paginatedData.forEach(person => { person.statusaction = scheduleMap.get(person.phone) || null; });
            } else {
                paginatedData.forEach(person => { person.statusaction = null; });
            }
            if (currentParams.campaignStatus) {
                paginatedData = paginatedData.filter(p => currentParams.campaignStatus === 'true' ? p.statusaction !== null : p.statusaction === null);
            }
            if (currentParams.user && mongoose.Types.ObjectId.isValid(currentParams.user)) {
                paginatedData = paginatedData.filter(p => p.statusaction?.createdBy?._id.toString() === currentParams.user);
            }
            const plainData = JSON.parse(JSON.stringify(paginatedData));
            return {
                data: plainData,
                total: results[0]?.totalCount[0]?.count || 0,
            };
        },
        ['data-by-type'],
        { tags: ['combined-data'], revalidate: 3600 }
    );
    return cachedData(params);
}

export async function revalidateData() {
    revalidateTag('combined-data');
}

export async function updateCustomerInfo(previousState, formData) {
    const id = formData.get('_id');
    const isStudent = formData.get('type') === 'true';
    if (!id) return { success: false, error: 'Thiếu ID.' };
    try {
        await connectDB();
        const payload = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            nameparent: formData.get('nameparent'),
            bd: formData.get('bd') ? new Date(formData.get('bd')) : null,
        };
        if (isStudent) {
            const studentPayload = { Name: payload.name, Phone: payload.phone, Email: payload.email, NameParent: payload.nameparent, bd: payload.bd };
            await Student.findByIdAndUpdate(id, studentPayload);
        } else {
            await Customer.findByIdAndUpdate(id, payload);
        }
        revalidateData();
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Lỗi server khi cập nhật.' };
    }
}

export async function addCareNoteAction(previousState, formData) {
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role.includes('Admin') && !user.role.includes('Sale')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    const customerId = formData.get('customerId');
    const content = formData.get('content');
    if (!customerId || !content) return { success: false, error: 'Thiếu thông tin.' };
    try {
        await connectDB();
        const newNote = { content, createBy: user.id, createAt: new Date() };
        await Customer.findByIdAndUpdate(customerId, {
            $push: { care: newNote }
        });
        revalidateData();
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Không thể thêm ghi chú.' };
    }
}

export async function updateCustomerStatusAction(previousState, formData) {
    const customerId = formData.get('customerId');
    const newStatusStr = formData.get('status');
    
    if (!customerId || !newStatusStr) {
        return { success: false, error: 'Thiếu thông tin cần thiết.' };
    }
    const newStatus = parseInt(newStatusStr, 10);
    try {
        await connectDB();
        const customer = await Customer.findById(customerId).select('status').lean();
        if (!customer) {
            return { success: false, error: 'Không tìm thấy khách hàng.' };
        }
        if (customer.status === newStatus) {
            return { success: false, error: 'Khách hàng đã ở trạng thái này.' };
        }
        await Customer.findByIdAndUpdate(customerId, {
            status: newStatus
        });
        revalidateData();
        return { success: true, message: 'Cập nhật trạng thái thành công!' };
    } catch (error) {
        console.log(error);
        
        return { success: false, error: 'Lỗi server khi cập nhật trạng thái.' };
    }
}

export async function convertToStudentAction(previousState, formData) {
    const customerId = formData.get('customerId');
    if (!customerId) {
        return { success: false, error: 'Thiếu ID khách hàng.' };
    }
    try {
        await connectDB();
        const user = await checkAuthToken();
        if (!user || (!user.role.includes('Admin') && !user.role.includes('Sale'))) {
            return { success: false, error: 'Bạn không có quyền thực hiện chức năng này.' };
        }
        const customer = await Customer.findById(customerId).lean();
        if (!customer) { return { success: false, error: 'Không tìm thấy khách hàng.' }; }
        const lastStudent = await Student.findOne({ ID: /^AI\d{4}$/ }).sort({ ID: -1 }).select('ID').lean();
        const nextIdNumber = lastStudent ? parseInt(lastStudent.ID.slice(2), 10) + 1 : 1;
        const newStudentId = 'AI' + String(nextIdNumber).padStart(4, '0');
        const newStudent = new Student({
            ID: newStudentId,
            Name: customer.name,
            BD: customer.bd,
            ParentName: customer.nameparent,
            Phone: customer.phone,
            Email: customer.email,
            Profile: ProfileDefault(customer.name),
            Status: [statusStudent({})],
        });
        const savedStudent = await newStudent.save();
        await Customer.findByIdAndUpdate(customerId, { status: 1 });
        let finalMessage = 'Chuyển đổi khách hàng thành học sinh thành công!';
        if (customer.phone) {
            const zaloResult = await getZaloUid(customer.phone);
            if (zaloResult.uid) {
                await Student.findByIdAndUpdate(savedStudent._id, { $set: { Uid: zaloResult.uid } });
            } else {
                finalMessage = `Chuyển đổi thành công. Lấy Zalo UID thất bại: ${zaloResult.message}`;
            }
        }
        reloadStudent();
        return { success: true, message: finalMessage };
    } catch (error) {
        console.error('Lỗi khi chuyển đổi khách hàng:', error);
        return { success: false, error: 'Không thể chuyển đổi khách hàng. Lỗi server.' };
    }
}