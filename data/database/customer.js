'use server';

import connectDB from "@/config/connectDB";
import Customer from "@/models/customer";
import mongoose from 'mongoose';

export async function getCombinedAndTransformedData(params) {
    try {
        await connectDB();

        // 1. Khởi tạo các tham số cơ bản
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const query = params.query || '';
        const skip = (page - 1) * limit;

        // 2. Xây dựng các điều kiện lọc động
        const filterConditions = [];

        if (query) {
            filterConditions.push({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } },
                    { nameparent: { $regex: query, $options: 'i' } },
                ],
            });
        }

        if (params.type === 'true' || params.type === 'false') {
            filterConditions.push({ type: params.type === 'true' });
        }

        if (params.source) {
            if (params.source === 'null') {
                filterConditions.push({ source: null });
            } else if (mongoose.Types.ObjectId.isValid(params.source)) {
                // Chỉ chuyển đổi khi ID hợp lệ để tránh lỗi
                filterConditions.push({ source: new mongoose.Types.ObjectId(params.source) });
            }
        }

        if (params.area) {
            filterConditions.push({ area: params.area });
        }

        // Tạo giai đoạn $match cuối cùng
        const matchStage = filterConditions.length > 0 ? { $match: { $and: filterConditions } } : { $match: {} };

        // 3. Xây dựng Aggregation Pipeline hoàn chỉnh
        const pipeline = [
            // Giai đoạn 1: Bắt đầu với 'customers', thêm trường 'type'
            { $addFields: { type: false } },

            // Giai đoạn 2: Hợp nhất với 'students' và chuẩn hóa dữ liệu của nó
            {
                $unionWith: {
                    coll: 'students',
                    pipeline: [
                        { $addFields: { type: true } },
                        {
                            $project: {
                                _id: 1,
                                name: "$Name",
                                bd: "$bd",
                                email: "$Email",
                                phone: "$Phone",
                                nameparent: "$NameParent",
                                area: "$Area",
                                uid: "$uid",
                                createAt: "$createAt",
                                type: 1,
                                source: { $literal: null },
                                status: { $literal: null }
                            }
                        }
                    ]
                }
            },

            // Giai đoạn 3: Áp dụng tất cả các bộ lọc đã xây dựng
            matchStage,

            // Giai đoạn 4: Sắp xếp kết quả cuối cùng
            { $sort: { createAt: -1, _id: -1 } },

            // Giai đoạn 5: Dùng $facet để vừa phân trang vừa đếm hiệu quả
            {
                $facet: {
                    paginatedResults: [
                        { $skip: skip },
                        { $limit: limit },
                        { // Dọn dẹp dữ liệu cuối cùng trước khi gửi về client
                            $project: {
                                createAt: 0 // Không cần gửi trường này về client
                            }
                        }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        // 4. Thực thi pipeline
        const results = await Customer.aggregate(pipeline);

        const data = results[0]?.paginatedResults || [];
        const total = results[0]?.totalCount[0]?.count || 0;

        return {
            data: JSON.parse(JSON.stringify(data)),
            total: total,
        };

    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu hợp nhất:', error);
        return { data: [], total: 0, error: 'Không thể lấy dữ liệu.' };
    }
}