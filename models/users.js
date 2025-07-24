import { Schema, model, models } from 'mongoose'

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         avt:
 *           type: string
 *         role:
 *           type: array
 *           items:
 *             type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         uid:
 *           type: string
 */

const postUser = new Schema({
  name: {
    type: String,
  },
  address: {
    type: String,
  },
  avt: {
    type: String,
  },
  role: {
    type: Array,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  uid: {
    type: String,
  }
})

const users = models.user || model('user', postUser)

export default users