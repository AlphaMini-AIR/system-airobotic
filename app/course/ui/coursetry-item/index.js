import React from 'react';
import Link from 'next/link';
import styles from './index.module.css';

export default function CourseTryItem({ data }) {
    console.log(data);

    return (
        <Link href={`/course/trycourse`} className={styles.wrap}>
            <div>
                <div className={styles.title}>
                    <div className={styles.courseAvt} style={{ background: 'var(--yellow)' }}>
                        HT
                    </div>
                    <div className={styles.titleInfo}>
                        <div className={styles.titleText1}>
                            HỌC THỬ AI ROBOTIC
                        </div>
                        <p className={styles.courseName}>Khóa học thử miễn phí</p>
                    </div>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.label}>Số buổi chưa diễn ra:</span>
                    <span className={styles.value}>
                        {data.totalSessions}
                    </span>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.label}>Học sinh chưa học thử:</span>
                    <span className={styles.value}>
                        {data.totalStudents}
                    </span>
                </div>
            </div>
        </Link>
    );
}