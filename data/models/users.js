import { Schema, model, models } from 'mongoose'

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
    type: Object,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  }
})

const PostUser = models.user || model('user', postUser)

export default PostUser