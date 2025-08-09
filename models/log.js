import { Schema, model, models } from 'mongoose'

const RoomSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        
    },
    { _id: false, versionKey: false }
)

const logs = new Schema(
    {
        message: { type: String, trim: true },
        status: { type: { RoomSchema }, default: {} },
        type: { type: String, required: true, enum: ["sendMessage", "addFriend", "findUid"] },
        createdAt: { type: Date, default: Date.now },
        createBy: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'customer', required: true },
        student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
        zalo: { type: Schema.Types.ObjectId, ref: 'zaloaccount', required: true },
        schedule: { type: Schema.Types.ObjectId, ref: 'scheduledjob', default: null },
    },
    { timestamps: false, versionKey: false }
)

const Logs = models.logmes || model('logmes', logs)
export default Logs
