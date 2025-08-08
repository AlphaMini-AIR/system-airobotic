'use server'

import { getStudentOne, getStudentAll } from '@/data/database/student'
import { getInvoiceOne, getInvoiceAll } from '@/data/database/invoices'
import { getAreaOne, getAreaAll } from '@/data/database/area'
import { getCourseOne, getCourseAll } from '@/data/database/course'
import { getBookOne, getBookAll } from '@/data/database/book'
import { getCourseTry } from '../database/coursetry'
import { getUserAll, getUserOne, getUserReport } from '@/data/database/user'
import { getLabelAll } from '../database/label'
import { getFormAll } from '../database/form'
import { getZaloAll, getZaloOne } from '../database/zalo'

export async function student_data(_id) {
    let data = _id ? await getStudentOne(_id) : await getStudentAll()
    return _id && data ? data[0] || null : data || null
}

export async function invoices_data(_id) {
    let data = _id ? await getInvoiceOne(_id) : await getInvoiceAll()
    return data || null
}

export async function area_data(_id) {
    let data = _id ? await getAreaOne(_id) : await getAreaAll()
    return _id && data ? data[0] || null : data || null
}

export async function course_data(_id) {
    let data = _id ? await getCourseOne(_id) : await getCourseAll()
    return data || null
}

export async function book_data(_id) {
    let data = _id ? await getBookOne(_id) : await getBookAll()
    return data || null
}

export async function zalo_data(_id) {
    let data = _id ? await getZaloOne(_id) : await getZaloAll()
    return data || null
}

export async function coursetry_data() {
    let data = await getCourseTry()
    return data || null
}

export async function user_data({ type = null, _id = null }) {
    if (type === 'report') {
        return await getUserReport()
    } else {
        if (_id) {
            return await getUserOne(_id)
        } else {
            return await getUserAll()
        }
    }
}

export async function label_data() {
    return await getLabelAll()
}

export async function form_data() {
    return await getFormAll()
}