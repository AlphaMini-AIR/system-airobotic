import { Schema, model, models } from 'mongoose'

const postBook = new Schema({
    ID: {
        type: String,
        required: true,
    },
    Name: {
        type: String,
        required: true,
    },
    Address: {
        type: String,
        required: true,
    },
    Price: {
        type: Number
    },
    Progress: {
        type: String
    },
    Quantity: {
        type: Number
    },
    Status: {
        type: Boolean
    },
    Status: {
        type: Boolean
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
    Detail: {
        type: Object
    },
    Image: {
        type: String
    }
})

const PostBook = models.book || model('book', postBook)

export default PostBook