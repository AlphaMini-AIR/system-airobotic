import { Schema, model, models } from 'mongoose'

// Data quy định dữ liệu khách hàng cần chăm sóc
const FormSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        bd: { type: Date, default: Date.now },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        nameparent: { type: String, trim: true },
        area: { type: String, trim: true },
        source: { type: Schema.Types.ObjectId, ref: 'form', required: true },
        uid: {
            type: [{
                zalo: { type: Schema.Types.ObjectId, ref: 'user' },
                uid: { type: String },
            }]
        },
        createAt: { type: Date, default: Date.now },
        care: {
            type: [{
                content: { type: String, trim: true },
                createBy: { type: Schema.Types.ObjectId, ref: 'user', required: true },
                createAt: { type: Date, default: Date.now }
            }], default: []
        },
        status: { type: Number, default: 0 }, // 0: chưa có kết quả, 1: nhập học, 2: Không quan tâm, 3: Tạm thời không quan tâm
    },
    { timestamps: false, versionKey: false }
)

const Customer = models.customer || model('customer', FormSchema)
export default Customer
