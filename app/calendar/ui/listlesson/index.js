// app/calendar/ui/Calendar.jsx
'use client';

import React, { useState } from 'react';
import LessonM from '../lesson_m';
import styles from '../month/index.module.css';
import { Re_calendar } from '@/data/course';

function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export default function Calendar({ data = [], month, year, day }) {

    // Xác định có phải tháng hiện tại không
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isCurrentMonth = month === currentMonth && year === currentYear;

    // Chuẩn hóa key “hôm nay”
    const pad = str => String(str).padStart(2, '0');
    const mm = pad(month);
    const dd = pad(day);
    const todayKey = isCurrentMonth ? `${dd}/${mm}/${year}` : null;

    // Nhóm data theo ngày
    const grouped = data.reduce((acc, item) => {
        (acc[item.day] ??= []).push(item);
        return acc;
    }, {});
    if (isCurrentMonth && todayKey && !(todayKey in grouped)) {
        grouped[todayKey] = [];
    }

    // Lấy danh sách ngày đã sort
    const allDays = Object.keys(grouped).sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });

    // State để toggle chỉ khi tháng hiện tại
    const [showAll, setShowAll] = useState(false);
    const visibleDays = showAll || !isCurrentMonth
        ? allDays
        : allDays.filter(dayKey => {
            const [d, m, y] = dayKey.split('/').map(Number);
            return new Date(y, m - 1, d) >= new Date(currentYear, currentMonth - 1, day);
        });

    const todayDate = new Date(currentYear, currentMonth - 1, now.getDate());
    return (
        <div className={styles.container}>
            {/* Chỉ render nút khi ở tháng hiện tại */}
            {isCurrentMonth && (
                <button
                    className={styles.buttond}
                    onClick={() => setShowAll(s => !s)}
                >
                    {showAll ? 'Rút gọn lịch' : 'Xem tất cả lịch'}
                </button>
            )}

            {visibleDays.map(dayKey => {
                const lessons = (grouped[dayKey] || []).sort((a, b) => {
                    const startA = a.time.split('-')[0];
                    const startB = b.time.split('-')[0];
                    return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
                });

                const isToday = isCurrentMonth && dayKey === todayKey;
                return (
                    <section key={dayKey} className={styles.dayGroup}>
                        <p className={`${styles.dayTitle} ${isToday ? styles.today : ''} text_4`}>
                            Ngày {dayKey} {isToday && '(Hôm nay)'}
                        </p>

                        {lessons.length > 0 ? (
                            lessons.map((item, idx) => {
                                const [d, m, y] = dayKey.split('/').map(Number);
                                const lessonDate = new Date(y, m - 1, d);
                                const isFuture = lessonDate > todayDate;
                                return (
                                    <LessonM
                                        key={`${item.courseId}_${idx}`}
                                        time={item.time}
                                        topic={item.topic}
                                        courseID={item.courseId}
                                        room={item.room}
                                        id={item.id}
                                        type={isFuture}
                                    />
                                );
                            })
                        ) : (
                            isToday && (
                                <div className={styles.noLessonsInDay}>
                                    Hôm nay không có buổi học
                                </div>
                            )
                        )}
                    </section>
                );
            })}
        </div>
    );
}
