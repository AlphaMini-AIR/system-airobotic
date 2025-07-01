import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './index.module.css';
import { calculatePastLessons, formatDate } from '@/function';

export default function CourseItem({ data = {} }) {
    const teacherMap = new Map();
    const teachingAsMap = new Map();

    data.Detail.forEach(item => {
        if (item.Teacher && item.Teacher._id) {
            teacherMap.set(item.Teacher._id, item.Teacher);
        }
        if (item.TeachingAs && item.TeachingAs._id) {
            teachingAsMap.set(item.TeachingAs._id, item.TeachingAs);
        }
    });
    const uniqueTeachers = Array.from(teacherMap.values());
    const uniqueTeachingAs = Array.from(teachingAsMap.values());

    const pastLessonsCount = calculatePastLessons(data);
    const { ID = '', Area = {}, Detail = [], Student = [], Book = { Name: 'Trống' } } = data;
    const allDates = data.Detail.map(item => new Date(item.Day));
    const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    const { lessonsDone, totalLessons, percent } = useMemo(() => {
        const today = new Date();
        const currentHour = today.getHours();

        const stats = Detail.reduce(
            (acc, item) => {
                if (!item || typeof item.Lesson !== 'number' || typeof item.Day !== 'string') {
                    return acc;
                }

                acc.total += item.Lesson;

                const parts = item.Day.split('/');
                if (parts.length !== 3) {
                    return acc;
                }
                const [dd, mm, yyyy] = parts;
                const lessonDate = new Date(`${yyyy}-${mm}-${dd}`);

                const isPastDay = today > lessonDate;
                const isSameDay = today.toDateString() === lessonDate.toDateString();

                if (isPastDay && !isSameDay) {
                    acc.done += item.Lesson;
                } else if (isSameDay) {
                    if (typeof item.Time === 'string' && item.Time.length >= 2) {
                        const hourStart = Number(item.Time.slice(0, 2));
                        if (!isNaN(hourStart) && hourStart < currentHour) {
                            acc.done += item.Lesson;
                        }
                    }
                }

                return acc;
            },
            { done: 0, total: 0 }
        );

        return {
            lessonsDone: stats.done,
            totalLessons: stats.total,
            percent: stats.total > 0 ? (stats.done / stats.total) * 100 : 0,
        };
    }, [Detail]);

    const studentCount = Student.length;

    return (
        <Link href={`/course/${ID}`} className={styles.wrap}>
            <div className={styles.title}>
                <div className={styles.courseAvt}>
                    {ID.length >= 5 ? ID.slice(2, 5) : ''}
                </div>
                <div className={styles.titleInfo}>
                    <div className={styles.titleText1}>
                        {ID}
                        {Area && <span className={`chip text_7_400`} style={{
                            background: Area.color, borderRadius: 16,
                            padding: '4px 16px', color: 'white'
                        }}>{Area.name}</span>}
                    </div>
                    <p className={styles.courseName}>{Book.Name}</p>
                </div>
            </div>

            <div className={styles.infoRow}>
                <span className={styles.label}>Thời gian:</span>
                <span className={styles.value}>
                    {dateRange[0] && dateRange[1] ? `${dateRange[0]} - ${dateRange[1]}` : 'Chưa có thời gian'}
                </span>
            </div>

            <div className={styles.infoRow}>
                <span className={styles.label}>Số lượng học sinh:</span>
                <span className={styles.value}>{studentCount} Học sinh</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>Giáo viên chủ nhiệm:</span>
                <span className={styles.value}>
                    {data.TeacherHR.name}
                </span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>Giáo viên giảng dạy:</span>
                <span className={styles.value}>
                    {uniqueTeachers.length > 0 ? uniqueTeachers.map(teacher => teacher.name).join(', ') : 'Chưa có giáo viên'}
                </span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.label}>Giáo viên trợ giảng:</span>
                <span className={styles.value}>
                    {uniqueTeachingAs.length > 0 ? uniqueTeachingAs.map(ta => ta.name).join(', ') : 'Chưa có giáo viên'}
                </span>
            </div>
            <div className={styles.infoRow} style={{ marginBottom: 8 }}>
                <span className={styles.label}>Tiến độ học:</span>
                <span className={styles.value}>
                    {pastLessonsCount}/{data.Detail.length} Buổi
                </span>
            </div>

            <div className={styles.progressBar} >
                <div
                    className={styles.progress}
                    style={{ width: `${Number(pastLessonsCount) / data.Detail.length * 100}%` }}
                    aria-label="progress"
                />
            </div>
        </Link>
    );
}