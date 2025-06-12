import { Schema, isValidObjectId, model, models } from 'mongoose';

const DetailSchema = new Schema({
    ID: { type: String, required: true },
    Day: { type: String, required: true },
    Room: { type: String },
    Time: { type: String },
    Teacher: { type: String },
    TeachingAs: { type: String },
    Image: { type: String },
    DetailImage: { type: Array, default: [] },
    Type: { type: String },
    Note: { type: String },
});

const LearnDetailSchema = new Schema({
    Checkin: { type: Number, default: 0 },
    Cmt: { type: Array, default: [] },
    CmtFn: { type: String, default: '' },
    Note: { type: String, default: '' },
    Lesson: { type: Schema.Types.ObjectId, required: true },
    Image: { type: Array, default: [] },
}, { _id: false });

const StudentSchema = new Schema({
    ID: { type: String, required: true },
    Learn: {
        type: Map,
        of: LearnDetailSchema
    }
});


const postCourseSchema = new Schema({
    ID: {
        type: String,
        required: true,
        unique: true // ID khóa học nên là duy nhất
    },
    Name: {
        type: String,
        required: true
    },
    Room: {
        type: String
    },
    Address: {
        type: String
    },
    Price: {
        type: Number,
        default: 0
    },
    Progress: {
        type: String
    },
    Status: {
        type: Boolean,
        default: false
    },
    TimeEnd: {
        type: String
    },
    TimeStart: {
        type: String
    },
    Type: {
        type: String
    },
    // Sửa lỗi: Đã xóa trường "Name" bị trùng lặp
    Detail: {
        type: [DetailSchema], // Quan trọng: Detail là một MẢNG các đối tượng theo DetailSchema
        default: []
    },
    Area: {
        type: String
    },
    Student: {
        type: [StudentSchema], // Quan trọng: Student là một MẢNG các đối tượng theo StudentSchema
        default: []
    },
    TeacherHR: {
        type: String
    }
}, { versionKey: false });

const PostCourse = models.course || model('course', postCourseSchema);

export default PostCourse;