'use server'
import { revalidateTag } from 'next/cache'

// Cập nhập dữ liệu học sinh (tag: students/student:{_id})
export async function reloadStudent(_id) {
    if (_id) { revalidateTag(`student:${_id}`) }
    revalidateTag('students')
}

// Cập nhập dữ liệu hóa đơn (tag: invoices/invoice:{_id})
export async function reloadInvoice(_id) {
    if (_id) { revalidateTag(`invoice:${_id}`) }
    revalidateTag('invoices')
}

// Cập nhập dữ liệu khu vực (tag: areas/area:{_id})
export async function reloadArea(_id) {
    if (_id) { revalidateTag(`area:${_id}`) }
    revalidateTag('areas')
}

// Cập nhập dữ liệu khóa học (tag: courses/course:{_id})
export async function reloadCourse(_id) {
    if (_id) { revalidateTag(`course:${_id}`) }
    revalidateTag('courses')
}

// Cập nhập dữ liệu sách (tag: books/book:{_id})
export async function reloadBook(_id) {
    if (_id) { revalidateTag(`book:${_id}`) }
    revalidateTag('books')
}

// Cập nhập dữ liệu sách (tag: books/book:{_id})
export async function reloadCoursetry() {
    revalidateTag('coursetry')
}

// Cập nhập dữ liệu người dùng (tag: users/user:{_id}/users:report)
export async function reloadUser(type) {
    if (type === 'report') {
        revalidateTag('users:report')
    } else {
        revalidateTag('users')
    }
}