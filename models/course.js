import { Schema, model, models } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseDetail:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         Topic:
 *           type: string
 *           description: ID của chủ đề buổi học.
 *         Day:
 *           type: string
 *           format: date-time
 *           description: Ngày diễn ra buổi học.
 *         Room:
 *           type: string
 *           description: ID của phòng học.
 *         Time:
 *           type: string
 *           description: Thời gian buổi học (VD: '18:00 - 20:00').
 *         Teacher:
 *           type: string
 *           description: ObjectId của giáo viên.
 *         TeachingAs:
 *           type: string
 *           description: ObjectId của trợ giảng.
 *         Image:
 *           type: string
 *           format: uri
 *           description: URL hình ảnh của buổi học.
 *         DetailImage:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *               create:
 *                 type: string
 *                 format: date-time
 *         Type:
 *           type: string
 *         Note:
 *           type: string
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         ID:
 *           type: string
 *           description: Mã định danh duy nhất của khoá học (VD: 25ROBOT001).
 *         Book:
 *           type: string
 *         Status:
 *           type: boolean
 *         Type:
 *           type: string
 *         Detail:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CourseDetail'
 *         Area:
 *           type: string
 *         Student:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               ID:
 *                 type: string
 *               Learn:
 *                 type: array
 *                 items:
 *                   type: object
 *         TeacherHR:
 *           type: string
 *         Version:
 *           type: number
 */

const DetailSchema = new Schema({
    Topic: { type: Schema.Types.ObjectId, required: true },
    Day: { type: Date, required: true },
    Room: { type: Schema.Types.ObjectId },
    Time: { type: String },
    Teacher: { type: Schema.Types.ObjectId, ref: 'user' },
    TeachingAs: { type: Schema.Types.ObjectId, ref: 'user' },
    Image: { type: String },
    DetailImage: {
        type: [{
            id: { type: String, required: true, unique: true },
            type: { type: String },
            create: { type: Date, default: Date.now }
        }],
        default: []
    },
    Type: { type: String },
    Note: { type: String },
});

const LearnDetailSchema = new Schema({
    Checkin: { type: Number, default: 0 },
    Cmt: { type: Array, default: [] },
    CmtFn: { type: String, default: '' },
    Note: { type: String, default: '' },
    Lesson: { type: Schema.Types.ObjectId, required: true },
    Image: {
        type: [{
            id: { type: String, required: true, unique: true },
            type: { type: String },
            create: { type: Date, default: Date.now }
        }],
        default: []
    },
}, { _id: false });

const StudentSchema = new Schema({
    ID: { type: String, required: true },
    Learn: { type: [LearnDetailSchema], default: [] },
});

const postCourseSchema = new Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    Book: { type: Schema.Types.ObjectId, ref: 'book' },
    Status: {
        type: Boolean,
        default: false
    },
    Type: { type: String },
    Detail: {
        type: [DetailSchema],
        default: []
    },
    Area: {
        type: Schema.Types.ObjectId, ref: 'area'
    },
    Student: {
        type: [StudentSchema],
        default: []
    },
    TeacherHR: {
        type: Schema.Types.ObjectId, ref: 'user'
    },
    Version: {
        type: Number
    }
}, { versionKey: false });

const PostCourse = models.course || model('course', postCourseSchema);

export default PostCourse;