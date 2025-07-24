import { Schema, model, models } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     SendHistory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *         sentBy:
 *           type: string
 *         message:
 *           type: string
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *         type:
 *           type: string
 *         recipients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *               error:
 *                 type: string
 */

const recipientStatusSchema = new Schema({
    phone: { type: String, required: true },
    status: { type: String, required: true, enum: ['success', 'failed', 'skipped'] },
    error: { type: String, default: '' },
}, { _id: false });

const sendHistorySchema = new Schema({
    sentAt: { type: Date, required: true, default: Date.now },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    labels: { type: [String], default: [] },
    type: { type: String, default: 'Khách hàng' },
    recipients: { type: [recipientStatusSchema], default: [] },
}, {
    timestamps: true
});

sendHistorySchema.index({ 'recipients.phone': 1 });
sendHistorySchema.index({ sentBy: 1, sentAt: -1 });

const SendHistory = models.SendHistory || model('SendHistory', sendHistorySchema);
export default SendHistory;