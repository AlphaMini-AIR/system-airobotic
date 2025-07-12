import connectDB from '@/config/connectDB'
import PostStudent from '@/models/student'
import authenticate from '@/utils/authenticate'
import jsonRes from '@/utils/response'

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request);
        let data
        let message = 'Lấy dữ liệu thành công'
        let status = 200
        const { _id } = body
        if (!_id) return jsonRes(400, { status: false, mes: 'id không tồn tại', data: [] })

        await connectDB()
        data = await PostStudent.findOne({ _id }).lean()
        if (!data) return jsonRes(400, { status: false, mes: 'Không tìm thấy học sinh', data: [] })
        return jsonRes(status, { status: true, mes: message, data })
    } catch (error) {
        console.log(error)
        return jsonRes(error.message === 'Authentication failed' ? 401 : 500, { status: false, mes: error.message, data: null })
    }
}