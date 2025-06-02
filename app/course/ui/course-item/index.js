import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './index.module.css';

export default function CourseItem({ data }) {
    const course = data || {};

    // Lấy ngày hiện tại và giờ hiện tại
    const today = new Date();
    const currentHour = today.getHours();

    // 2. Tính toán lessonsDone, totalLessons, percent một cách an toàn
    const { lessonsDone, totalLessons, percent } = useMemo(() => {
        let done = 0;
        let total = 0;

        // Kiểm tra data.Detail có phải mảng không, nếu không thì dùng mảng rỗng
        const details = Array.isArray(course.Detail) ? course.Detail : [];

        details.forEach((e) => {
            // Nếu e không hợp lệ hoặc không có trường Lesson, Day, Time thì bỏ qua
            if (!e || typeof e.Lesson !== 'number' || typeof e.Day !== 'string') return;

            total += e.Lesson;

            // Tách dd/mm/yyyy → yyyy-mm-dd để tạo Date
            const parts = e.Day.split('/');
            if (parts.length !== 3) {
                // Nếu định dạng không đúng, bỏ qua phần tử này
                return;
            }
            const [dd, mm, yyyy] = parts;
            // Tạo Date theo chuẩn "yyyy-mm-dd"
            const lessonDate = new Date(`${yyyy}-${mm}-${dd}`);

            if (today > lessonDate) {
                // Nếu đã qua ngày học
                done += e.Lesson;
            } else if (today.toDateString() === lessonDate.toDateString()) {
                // Nếu học cùng ngày: kiểm tra giờ bắt đầu
                if (typeof e.Time === 'string' && e.Time.length >= 2) {
                    const hourStart = Number(e.Time.slice(0, 2));
                    if (!isNaN(hourStart) && hourStart < currentHour) {
                        done += e.Lesson;
                    }
                }
            }
        });

        return {
            lessonsDone: done,
            totalLessons: total,
            percent: total > 0 ? (done / total) * 100 : 0,
        };
    }, [course.Detail, currentHour, today]);

    // 3. Lấy số lượng học sinh một cách an toàn
    const studentCount =
        Array.isArray(course.Student) && course.Student.length > 0
            ? course.Student.length
            : 0;

    // 4. Lấy các trường hiển thị (ID, Name, Area, TimeStart, TimeEnd) an toàn
    const courseID = typeof course.ID === 'string' ? course.ID : '';
    const courseName = typeof course.Name === 'string' ? course.Name : '';
    const courseArea = typeof course.Area === 'string' ? course.Area : '';
    const timeStart = typeof course.TimeStart === 'string' ? course.TimeStart : '';
    const timeEnd = typeof course.TimeEnd === 'string' ? course.TimeEnd : '';

    return (
        <Link href={`/course/${courseID}`} className={styles.wrap}>
            <div className={styles.title}>
                {/* 4.a. Nếu courseID có độ dài đủ để slice, ngược lại hiển thị chuỗi rỗng */}
                <div className={styles.courseAvt}>
                    {courseID.length >= 5 ? courseID.slice(2, 5) : ''}
                </div>

                <div className={styles.titleInfo}>
                    <div className={styles.titleText1}>
                        {courseID}
                        {courseArea && <span className={styles.chip}>{courseArea}</span>}
                    </div>
                    <p className={styles.courseName}>{courseName}</p>
                </div>
            </div>

            {/* ----- Thời gian học ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Thời gian:</span>
                <span className={styles.value}>
                    {timeEnd} - {timeStart}
                </span>
            </div>

            {/* ----- Sĩ số ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Số lượng học sinh:</span>
                <span className={styles.value}>{studentCount} Học sinh</span>
            </div>

            {/* ----- Tiến độ ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Tiến độ học:</span>
                <span className={styles.value}>
                    {lessonsDone}/{totalLessons} Tiết
                </span>
            </div>

            {/* ----- Progress Bar ----- */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progress}
                    style={{ width: `${percent}%` }}
                    aria-label="progress"
                />
            </div>
        </Link>
    );
}
