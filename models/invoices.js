import { Schema, model, models } from 'mongoose'

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         studentId:
 *           type: string
 *         courseId:
 *           type: string
 *         amountInitial:
 *           type: number
 *         amountPaid:
 *           type: number
 *         paymentMethod:
 *           type: number
 *         discount:
 *           type: number
 *         createBy:
 *           type: string
 */

const postInvoices = new Schema({
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'student' },
    courseId: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
    amountInitial: { type: Number },
    amountPaid: { type: Number },
    paymentMethod: { type: Number, enum: [1, 2, 3], default: 1 },
    discount: { type: Number, default: 0 },
    createBy: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
}, { timestamps: true })

const invoices = models.invoice || model('invoice', postInvoices)

export default invoices