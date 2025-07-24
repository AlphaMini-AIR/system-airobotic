import { Schema, model, models } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Label:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         desc:
 *           type: string
 *         content:
 *           type: string
 */

const labelSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        desc: { type: String, default: '' },
        content: { type: String, default: '' }
    },
    { timestamps: true },
);

const Label = models.label || model('label', labelSchema);
export default Label;