import Form from '@/models/formclient'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'

async function dataForm() {
    try {
        await connectDB()
        const form = await Form.find().sort({ createdAt: -1 }).populate({ path: 'createdBy', select: 'name' })
        return JSON.parse(JSON.stringify(form))
    } catch (error) {
        console.error('Lỗi trong dataForm:', error)
        throw new Error('Không thể lấy dữ liệu form.')
    }
}

export async function getFormAll() {
    try {
        const cachedFunction = cacheData(() => dataForm(), ['forms'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong getFormAll:', error)
        throw new Error('Không thể lấy dữ liệu form.')
    }
}



