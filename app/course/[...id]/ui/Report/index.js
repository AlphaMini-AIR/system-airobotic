'use client';

import React, { useState, useCallback, useMemo } from 'react';
import FlexiblePopup from '@/components/(popup)/popup_right';
import Noti from '@/components/(noti)/noti';
import styles from './index.module.css';
import { Svg_Chart } from '@/components/svg';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Hằng số và Hàm tiện ích
const ATTENDANCE_STATUS = {
    PRESENT: '1',
    ABSENT_NO_PERMISSION: '2',
    ABSENT_WITH_PERMISSION: '3',
};

const parseDdMmYyyy = (dateString) => {
    if (!dateString) return new Date();
    const parts = dateString.split('/');
    // Tháng trong JavaScript bắt đầu từ 0 (0-11)
    return new Date(+parts[2], parts[1] - 1, +parts[0]);
};

export default function Report({ course, students }) {
    const [isOpen, setIsOpen] = useState(false);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });
    const [selectedMakeupLesson, setSelectedMakeupLesson] = useState(null);
    const resetPopup = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Logic tính toán cho báo cáo
    const { attendanceData, makeupLessonsNeeded } = useMemo(() => {
        if (!isOpen || !course || !course.Detail || !course.Student) {
            return { attendanceData: { labels: [], datasets: [] }, makeupLessonsNeeded: [] };
        }

        const labels = course.Detail.map(lesson => `ID: ${lesson.ID}`);
        const presentData = [];
        const permittedAbsenceData = [];
        const unpermittedAbsenceData = [];
        const notMarkedData = [];

        course.Detail.forEach(lesson => {
            let presentCount = 0;
            let permittedAbsenceCount = 0;
            let unpermittedAbsenceCount = 0;

            course.Student.forEach(studentInCourse => {
                const checkinStatus = studentInCourse.Learn?.[lesson.ID]?.Checkin?.toString();

                switch (checkinStatus) {
                    case ATTENDANCE_STATUS.PRESENT:
                        presentCount++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_NO_PERMISSION:
                        unpermittedAbsenceCount++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION:
                        permittedAbsenceCount++;
                        break;
                    default:
                        break;
                }
            });

            const totalStudents = course.Student.length;
            const notMarkedCount = totalStudents - presentCount - permittedAbsenceCount - unpermittedAbsenceCount;

            presentData.push(presentCount);
            permittedAbsenceData.push(permittedAbsenceCount);
            unpermittedAbsenceData.push(unpermittedAbsenceCount);
            notMarkedData.push(notMarkedCount);
        });

        const chartData = {
            labels,
            datasets: [
                { label: 'Có mặt', data: presentData, backgroundColor: 'rgba(75, 192, 192, 0.7)' },
                { label: 'Vắng có phép', data: permittedAbsenceData, backgroundColor: 'rgba(255, 206, 86, 0.7)' },
                { label: 'Vắng không phép', data: unpermittedAbsenceData, backgroundColor: 'rgba(255, 99, 132, 0.7)' },
                { label: 'Chưa điểm danh', data: notMarkedData, backgroundColor: 'rgba(201, 203, 207, 0.7)' },
            ],
        };

        // 2. Phân tích các buổi cần bù
        const lessonsByTopicId = course.Detail.reduce((acc, lesson) => {
            acc[lesson.ID] = acc[lesson.ID] || [];
            acc[lesson.ID].push(lesson);
            return acc;
        }, {});

        const makeupLessons = [];
        Object.entries(lessonsByTopicId).forEach(([topicId, sessions]) => {
            const studentsNeedingMakeup = [];
            const topicName = sessions[0].Topic;

            course.Student.forEach(studentInCourse => {
                const wasPresent = sessions.some(s => studentInCourse.Learn?.[s.ID]?.Checkin === ATTENDANCE_STATUS.PRESENT);

                if (!wasPresent) {
                    const hadPermittedAbsence = sessions.some(s => studentInCourse.Learn?.[s.ID]?.Checkin === ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION);
                    if (hadPermittedAbsence) {
                        studentsNeedingMakeup.push(studentInCourse);
                    }
                }
            });

            if (studentsNeedingMakeup.length > 0) {
                makeupLessons.push({ topicId, topicName, students: studentsNeedingMakeup });
            }
        });

        return { attendanceData: chartData, makeupLessonsNeeded: makeupLessons };
    }, [course, isOpen]);

    // 3. Kiểm tra điều kiện hoàn thành khóa học
    const canCompleteCourse = useMemo(() => {
        if (!course.TimeEnd) return false;
        const noMakeupNeeded = makeupLessonsNeeded.length === 0;
        const isPastEndDate = new Date() > parseDdMmYyyy(course.TimeEnd);
        return noMakeupNeeded && isPastEndDate;
    }, [makeupLessonsNeeded, course.TimeEnd]);

    const handleCompleteCourse = () => {
        setNoti({ open: true, mes: 'Xác nhận hoàn thành khóa học thành công!', status: true });
        resetPopup();
    };

    const chartOptions = {
        plugins: { title: { display: true, text: `Tình hình điểm danh khóa học: ${course.Name}`, font: { size: 18 } } },
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Sĩ số' } } },
    };
    const handleSelectMakeupLesson = useCallback((lesson) => {
        console.log(lesson);

        setSelectedMakeupLesson(lesson);
    }, []);

    const renderStudentListPopup = () => {
        if (!selectedMakeupLesson) return null;
        return (
            <div className={styles.studentListContainer}>
                {selectedMakeupLesson.students.map((student, index) => (
                    <div key={student.ID} className={styles.studentItem}>
                        <span className={styles.studentIndex}>{index + 1}.</span>
                        <div className={styles.studentInfo}>
                            <span className={styles.studentName}>{student.Name}</span>
                            <span className={styles.studentId}>ID: {student.ID}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    const renderForm = () => {
        return (
            <div className={styles.reportContainer}>
                <div className={styles.chartContainer}>
                    <Bar options={chartOptions} data={attendanceData} />
                    <div style={{ flex: 1 }}>
                        <h2 className='text_4'>Danh sách các buổi học cần bù</h2>
                        {makeupLessonsNeeded.length === 0 ? (
                            <p className={styles.noMakeupMessage}>Không có buổi học nào cần bù. Tất cả học sinh đã hoàn thành các chủ đề.</p>
                        ) : (
                            <ul className={styles.makeupList}>
                                {makeupLessonsNeeded.map(({ topicId, topicName, students: studentsToMakeup }) => (
                                    <li key={topicId} className={styles.makeupItem} onClick={() => handleSelectMakeupLesson({ topicId, topicName, students: studentsToMakeup })}>
                                        <p className='text_6'>Chủ đề: {topicName} (ID: {topicId})</p>
                                        <p className='text_6'>Số lượng học sinh cần bù: {studentsToMakeup.length}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>



                <div className={styles.completionArea}>
                    <div className='btn' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={16} height={16} fill='white'>
                            <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                        </svg>
                        <p className='text_6_400' style={{ color: 'white' }}> Xác nhận hoàn thành</p>
                    </div>
                </div>
            </div >
        );
    };

    return (
        <>
            <div className={styles.trigger} onClick={() => setIsOpen(true)}>
                <Svg_Chart w={18} h={18} c='var(--text-primary)' />
                <p className="text_7">Báo cáo</p>
            </div>

            <FlexiblePopup
                open={isOpen}
                onClose={resetPopup}
                width={1200}
                title={`Tổng quan khóa học ${course?.ID || '-'}`}
                renderItemList={renderForm}
            />
            <FlexiblePopup
                open={!!selectedMakeupLesson}
                onClose={() => setSelectedMakeupLesson(null)}
                width={600}
                title={`Chủ đề: ${selectedMakeupLesson?.topicId}- ${selectedMakeupLesson?.topicName || ''}`}
                renderItemList={renderStudentListPopup}
            />
            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setNoti(n => ({ ...n, open: false }))}>
                        Đã hiểu
                    </button>
                }
            />
        </>
    );
}