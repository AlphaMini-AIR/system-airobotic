import { Schema, model, models } from 'mongoose'

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         rooms:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *         color:
 *           type: string
 */

const RoomSchema = new Schema(
  { name: { type: String, required: true, trim: true }},
  { _id: true }
)

const AreaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    rooms: { type: [RoomSchema], default: [] },
    color: { type: String, trim: true }
  },
  { timestamps: true }
)

const Area = models.area || model('area', AreaSchema)
export default Area
