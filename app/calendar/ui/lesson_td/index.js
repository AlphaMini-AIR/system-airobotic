'user sever';

import React from 'react';
import styles from './index.module.css';
import Link from 'next/link';

const CalendarCourse = ({ data = {} }) => {

    return (
        <Link href={`/calendar/${data.id}`} className={styles.calendarCourse} >
            <div className={styles.dot} />
            <div className={styles.content}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="var(--text-primary)" >
                        <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                    </svg>
                    {data.time}
                </div>
                <div><span style={{ fontWeight: 500 }}>Chủ đề:</span> {data.topic} </div>
                <div><span style={{ fontWeight: 500 }}>Giáo viên:</span> {data.teacher} </div>
                <div><span style={{ fontWeight: 500 }}>Trợ giảng:</span> {data.teachingAs ? data.teachingAs : '-'} </div>
            </div>
            <div className={styles.contentH}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={16} height={16} fill="var(--text-primary)" className={styles.icon}>
                    <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
                </svg>
                {data.room}
            </div>
        </Link >
    );
};

export default CalendarCourse;
