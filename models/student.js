import { Schema, model, models } from 'mongoose'

const Course = new Schema({
  course: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
  tuition: { type: Schema.Types.ObjectId, default: null },
});

const Status = new Schema({
  status: { type: Number, required: true },
  act: { type: String, required: true, enum: ['tạo', 'học', 'chờ', 'nghỉ'] },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
});

const postSchema = new Schema({
  ID: {
    type: String,
    required: true,
  },
  Uid: {
    type: String
  },
  Name: {
    type: String
  },
  BD: {
    type: Date
  },
  School: {
    type: String
  },
  Area: {
    type: Schema.Types.ObjectId,
    ref: 'area',
  },
  Type: {
    type: Boolean
  },
  Address: {
    type: String
  },
  ParentName: {
    type: String
  },
  Phone: {
    type: String
  },
  Email: {
    type: String
  },
  Avt: {
    type: String
  },
  Status: {
    type: [Status],
    default: () => ([{
      status: 2,
      act: 'tạo',
      date: new Date(),
      note: 'Thêm học sinh thành công',
    }])
  },
  Course: {
    type: [Course],
    default: []
  },
  Profile: {
    type: Object
  },
  Leave: { type: Boolean, default: false },
}, { versionKey: false })

const PostStudent = models.student || model('student', postSchema)

export default PostStudent