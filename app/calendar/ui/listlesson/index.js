// app/calendar/ui/Calendar.jsx
'use client';

import React, { useState, useMemo } from 'react';
import LessonM from '../lesson_m';
import styles from '../month/index.module.css';

function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

const pad = (str) => String(str).padStart(2, '0');

export default function Calendar({ data = [], month, year }) {
    // 1. Tự xác định ngày giờ hiện tại để tăng tính chính xác
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const todayDateObj = new Date(currentYear, currentMonth - 1, currentDay);

    const isCurrentMonth = month === currentMonth && year === currentYear;
    const todayKey = isCurrentMonth ? `${pad(currentDay)}/${pad(month)}/${year}` : null;

    // 2. Sửa lỗi nhóm dữ liệu: Nhóm theo key 'dd/MM/yyyy' thay vì chỉ theo ngày
    const groupedByDay = useMemo(() => {
        const grouped = data.reduce((acc, item) => {
            const dayKey = `${pad(item.day)}/${pad(item.month)}/${item.year}`;
            (acc[dayKey] ??= []).push(item);
            return acc;
        }, {});

        // Đảm bảo "hôm nay" luôn hiển thị dù không có lịch học
        if (isCurrentMonth && todayKey && !grouped[todayKey]) {
            grouped[todayKey] = [];
        }
        return grouped;
    }, [data, todayKey, isCurrentMonth]);

    const sortedDays = useMemo(() => {
        return Object.keys(groupedByDay).sort((a, b) => {
            const [da, ma, ya] = a.split('/').map(Number);
            const [db, mb, yb] = b.split('/').map(Number);
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });
    }, [groupedByDay]);

    const [showAll, setShowAll] = useState(false);

    const visibleDays = useMemo(() => {
        if (showAll || !isCurrentMonth) {
            return sortedDays;
        }
        return sortedDays.filter(dayKey => {
            const [d, m, y] = dayKey.split('/').map(Number);
            const lessonDate = new Date(y, m - 1, d);
            return lessonDate >= todayDateObj;
        });
    }, [showAll, isCurrentMonth, sortedDays, todayDateObj]);

    return (
        <div className={styles.container}>
            {isCurrentMonth && (
                <button className={styles.buttond} onClick={() => setShowAll(s => !s)}>
                    {showAll ? 'Rút gọn lịch' : 'Xem tất cả lịch'}
                </button>
            )}

            {visibleDays.map(dayKey => {
                const lessons = (groupedByDay[dayKey] || []).sort((a, b) => {
                    const startA = a.time.split('-')[0];
                    const startB = b.time.split('-')[0];
                    return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
                });

                const isToday = dayKey === todayKey;

                return (
                    <section key={dayKey} className={styles.dayGroup}>
                        <p className={`${styles.dayTitle} ${isToday ? styles.today : ''} text_4`}>
                            Ngày {dayKey} {isToday && '(Hôm nay)'}
                        </p>

                        {lessons.length > 0 ? (
                            lessons.map(item => {
                                const [d, m, y] = dayKey.split('/').map(Number);
                                const lessonDate = new Date(y, m - 1, d);
                                const isFuture = lessonDate >= todayDateObj;
                                console.log(item);
                                
                                return (
                                    <LessonM
                                        key={item._id}
                                        time={item.time}
                                        topic={item.topic}
                                        courseID={item.courseId}
                                        room={item.room}
                                        id={item._id}
                                        type={isFuture}
                                    />

                                );
                            })
                        ) : isToday ? (
                            <div className={styles.noLessonsInDay}>Hôm nay không có buổi học</div>
                        ) : null}
                    </section>
                );
            })}
        </div>
    );
}