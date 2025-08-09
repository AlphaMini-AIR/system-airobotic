import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema({
    person: { type: { name: String, phone: String, uid: String }, required: true },
    history: { type: Schema.Types.ObjectId, ref: "logmes" },
    scheduledFor: { type: Date, required: true },
});

const ScheduledJobSchema = new Schema(
    {
        jobName: {
            type: String,
            required: [true, "Vui lòng nhập tên lịch trình."],
            trim: true,
        },
        actionType: {
            type: String,
            enum: ["sendMessage", "addFriend", "findUid"],
            required: true,
        },
        zaloAccount: {
            type: Schema.Types.ObjectId,
            ref: "zaloaccount",
            required: true,
        },

        config: {
            messageTemplate: String,
            actionsPerHour: {
                type: Number,
                required: true,
                min: 1,
            },
        },

        tasks: [TaskSchema],

        statistics: {
            total: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const ScheduledJob =
    models.scheduledjob || model("scheduledjob", ScheduledJobSchema);

export default ScheduledJob;
