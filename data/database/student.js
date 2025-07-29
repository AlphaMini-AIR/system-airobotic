import Student from '@/models/student'
import connectDB from '@/config/connectDB'
import '@/models/area'
import '@/models/course'
import '@/models/book'
import { cacheData } from '@/lib/cache'
import { CheckProfileDone } from '@/function/server'

async function dataStudent(_id) {
    try {
        await connectDB()
        const query = _id ? { _id } : {}
        let studentQuery = Student.find(query).populate({ path: 'Area' })
        if (_id) {
            studentQuery.populate({ path: 'Course.course', model: 'course', populate: { path: 'Book', model: 'book', select: 'ID Name Price Topics Image' } })
        }
        const students = await studentQuery.lean()
        console.log(students);
         
        if (_id && students.length === 0) return null
        const processedStudents = students.map((student) => {
            if (_id && student.Course?.length) {
                const studentBusinessId = student.ID
                student.Course = student.Course.map(enrollment => {
                    if (!enrollment.course) return null
                    const { course } = enrollment
                    const studentInCourse = course.Student?.find(s => s.ID === studentBusinessId)
                    let mergedDetails = course.Detail
                    if (studentInCourse?.Learn?.length) {
                        const learnDataMap = new Map(studentInCourse.Learn.map(item => [String(item.Lesson), item]))
                        mergedDetails = course.Detail.map(detail => {
                            const learnRecord = learnDataMap.get(String(detail._id))
                            if (learnRecord) {
                                const { Image: studentImage, Lesson, ...restOfLearn } = learnRecord
                                return { ...detail, ...restOfLearn, ImageStudent: studentImage }
                            }
                            return detail
                        })
                    }
                    return { _id: course._id, ID: course.ID, Book: course.Book, Detail: mergedDetails, enrollmentStatus: enrollment.status, tuition: enrollment.tuition }
                }).filter(Boolean)
            }
            return { ...student, statusProfile: CheckProfileDone(student) }
        })
        return JSON.parse(JSON.stringify(processedStudents))
    } catch (error) {
        console.error('Lỗi trong dataStudent:', error)
        return null
    }
}

export async function getStudentAll() {
    try {
        const cachedFunction = cacheData(() => dataStudent(), ['students'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong StudentAll:', error)
        return null
    }
}

export async function getStudentOne(_id) {
    try {
        const cachedFunction = cacheData(() => dataStudent({ _id }), [`student:${_id}`])
        return cachedFunction()
    } catch (error) {
        console.error('Lỗi trong StudentOne:', error)
        return null
    }
}

