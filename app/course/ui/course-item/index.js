import React, { useMemo } from 'react';
import Link from 'next/link';
import styles from './index.module.css';

export default function Course_item({ data }) {
    const today = new Date();
    const currentHour = today.getHours();

    const { lessonsDone, totalLessons, percent } = useMemo(() => {
        let done = 0;
        let total = 0;

        data.Detail.forEach((e) => {
            total += e.Lesson;

            /* Chuỗi e.Day dạng dd/mm/yyyy → tách rồi tạo Date */
            const [dd, mm, yyyy] = e.Day.split('/');
            const lessonDate = new Date(`${yyyy}-${mm}-${dd}`);

            /* Đã qua ngày ⇒ cộng luôn */
            if (today > lessonDate) {
                done += e.Lesson;
            } else if (today.toDateString() === lessonDate.toDateString()) {
                /* Cùng ngày: so sánh giờ bắt đầu buổi học (lấy 2 ký tự giữa, vd: '18' trong '18h00') */
                const hourStart = Number(e.Time.slice(0, 2));
                if (hourStart < currentHour) done += e.Lesson;
            }
        });

        return {
            lessonsDone: done,
            totalLessons: total,
            percent: total ? (done / total) * 100 : 0,
        };
    }, [data.Detail, currentHour, today]);

    /* ---------- GIAO DIỆN ---------- */
    return (
        <Link href={`/course/${data.ID}`} className={styles.wrap}>
            <div className={styles.title}>
                <div className={styles.courseAvt}>{data.ID.slice(2, 5)}</div>

                <div className={styles.titleInfo}>
                    <div className={styles.titleText1}>
                        {data.ID}
                        <span className={styles.chip}>{data.Area}</span>
                    </div>
                    <p className={styles.courseName}>{data.Name}</p>
                </div>
            </div>

            {/* ----- Thời gian học ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Thời gian:</span>
                <span className={styles.value}>
                    {data.TimeEnd} - {data.TimeStart}
                </span>
            </div>

            {/* ----- Sĩ số ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Số lượng học sinh:</span>
                <span className={styles.value}>{data.Student.length} Học sinh</span>
            </div>

            {/* ----- Tiến độ ----- */}
            <div className={styles.infoRow}>
                <span className={styles.label}>Tiến độ học:</span>
                <span className={styles.value}>
                    {lessonsDone}/{totalLessons} Tiết
                </span>
            </div>

            {/* ----- Progress Bar (thay LinearProgress của MUI) ----- */}
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
