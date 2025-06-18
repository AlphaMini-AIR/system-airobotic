'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import { Svg_Chart } from '@/components/(icon)/svg';
import styles from './index.module.css';

// --- Đăng ký Chart.js ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Hằng số ---
const ATTENDANCE_STATUS = {
    PRESENT: 1,
    ABSENT_NO_PERMISSION: 2,
    ABSENT_WITH_PERMISSION: 3,
};

// --- Custom Hook: Tách toàn bộ logic tính toán ra khỏi component ---
const useCourseAnalytics = (course) => {
    return useMemo(() => {
        if (!course || !course.Detail || !course.Student) {
            return { attendanceData: { labels: [], datasets: [] }, makeupLessonsNeeded: [], canCompleteCourse: false };
        }

        // Tối ưu: Tạo một map để tra cứu trạng thái điểm danh của học sinh nhanh hơn
        const studentLearnMap = new Map(
            course.Student.map(student => [
                student.ID,
                new Map(student.Learn.map(learnItem => [learnItem.Lesson, learnItem.Checkin]))
            ])
        );

        // 1. Tính toán dữ liệu điểm danh cho biểu đồ
        const labels = course.Detail.map((lesson, index) => `Chủ đề ${index + 1}`);
        const attendanceCounts = course.Detail.map(lesson => {
            const counts = { present: 0, permitted: 0, unpermitted: 0 };
            course.Student.forEach(student => {
                const checkinStatus = studentLearnMap.get(student.ID)?.get(lesson._id);
                switch (checkinStatus) {
                    case ATTENDANCE_STATUS.PRESENT:
                        counts.present++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION:
                        counts.permitted++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_NO_PERMISSION:
                        counts.unpermitted++;
                        break;
                    default:
                        break;
                }
            });
            return counts;
        });

        const totalStudents = course.Student.length;
        const attendanceData = {
            labels,
            datasets: [
                { label: 'Có mặt', data: attendanceCounts.map(c => c.present), backgroundColor: 'rgba(75, 192, 192, 0.7)' },
                { label: 'Vắng có phép', data: attendanceCounts.map(c => c.permitted), backgroundColor: 'rgba(255, 206, 86, 0.7)' },
                { label: 'Vắng không phép', data: attendanceCounts.map(c => c.unpermitted), backgroundColor: 'rgba(255, 99, 132, 0.7)' },
                { label: 'Chưa điểm danh', data: attendanceCounts.map(c => totalStudents - c.present - c.permitted - c.unpermitted), backgroundColor: 'rgba(201, 203, 207, 0.7)' },
            ],
        };

        // 2. Phân tích các buổi cần bù
        const lessonsByTopic = course.Detail.reduce((acc, lesson) => {
            if (!acc[lesson.Topic]) {
                acc[lesson.Topic] = { topicName: lesson.LessonDetails?.Name, sessions: [] };
            }
            acc[lesson.Topic].sessions.push(lesson);
            return acc;
        }, {});

        const makeupLessonsNeeded = Object.entries(lessonsByTopic).map(([topicId, { topicName, sessions }]) => {
            const studentsNeedingMakeup = course.Student.filter(student => {
                const learnMap = studentLearnMap.get(student.ID);
                if (!learnMap) return false;

                const wasPresent = sessions.some(s => learnMap.get(s._id) === ATTENDANCE_STATUS.PRESENT);
                if (wasPresent) return false;

                const hadPermittedAbsence = sessions.some(s => learnMap.get(s._id) === ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION);
                return hadPermittedAbsence;
            });

            return { topicId, topicName, students: studentsNeedingMakeup };
        }).filter(item => item.students.length > 0);

        const allDates = course.Detail.map(item => new Date(item.Day));
        const dateRange = [new Date(Math.min(...allDates)), new Date(Math.max(...allDates))];
        const isPastEndDate = new Date(dateRange[1]) ? new Date() > new Date(dateRange[1]) : false;
        const canCompleteCourse = makeupLessonsNeeded.length === 0 && isPastEndDate;

        return { attendanceData, makeupLessonsNeeded, canCompleteCourse };
    }, [course]);
};


// --- Các Component con để làm sạch phần render ---

const ReportTrigger = ({ onClick }) => (
    <div className={styles.trigger} onClick={onClick}>
        <Svg_Chart w={18} h={18} c='var(--text-primary)' />
        <p className="text_7">Báo cáo</p>
    </div>
);

const MakeupSection = ({ lessons, onSelect }) => (
    <div className={styles.makeupContainer}>
        <h2 className='text_4'>Danh sách chủ đề cần bù</h2>
        {lessons.length === 0 ? (
            <p className={`${styles.noMakeupMessage}`} style={{ fontSize: 14 }}>Không có buổi học nào cần bù.</p>
        ) : (
            <ul className={styles.makeupList}>
                {lessons.map(({ topicId, topicName, students }) => (
                    <li key={topicId} className={styles.makeupItem} onClick={() => onSelect({ topicId, topicName, students })}>
                        <p className='text_6'>Chủ đề: {topicName} (ID: {topicId})</p>
                        <p className='text_6_400'>Số lượng học sinh cần bù: {students.length}</p>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

const StudentListPopup = ({ lesson, onClose }) => {
    if (!lesson) return null;
    return (
        <FlexiblePopup
            open={!!lesson}
            onClose={onClose}
            width={600}
            title={`Học sinh cần bù | Chủ đề: ${lesson.topicName}`}
            renderItemList={() => (
                <div className={styles.studentListContainer}>
                    {lesson.students.map((student, index) => (
                        <div key={student.ID} className={styles.studentItem}>
                            <span className={styles.studentIndex}>{index + 1}.</span>
                            <div className={styles.studentInfo}>
                                <span className={styles.studentName}>{student.Name}</span>
                                <span className={styles.studentId}>ID: {student.ID}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        />
    );
};

const CompletionButton = ({ onClick, disabled }) => (
    <div className={styles.completionArea}>
        <button className="btn" onClick={onClick} disabled={disabled} style={{ background: disabled ? 'var(--gray_3)' : 'var(--main_d)' }}>
            <p className='text_6_400' style={{ color: 'white' }}>Xác nhận hoàn thành</p>
        </button>
        {disabled && <p className={styles.completionNote}>Khóa học chưa thể hoàn thành do vẫn còn học sinh cần bù hoặc chưa tới ngày kết thúc.</p>}
    </div>
);


// --- Component Chính ---
export default function Report({ course }) {
    const [isOpen, setIsOpen] = useState(false);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });
    const [selectedMakeupLesson, setSelectedMakeupLesson] = useState(null);

    const { attendanceData, makeupLessonsNeeded, canCompleteCourse } = useCourseAnalytics(course);

    const resetPopup = useCallback(() => setIsOpen(false), []);
    const handleCompleteCourse = useCallback(() => {
        setNoti({ open: true, mes: 'Xác nhận hoàn thành khóa học thành công!', status: true });
        resetPopup();
    }, [resetPopup]);

    const chartOptions = {
        plugins: { title: { display: true, text: `Tình hình điểm danh: ${course?.Name || course?.ID}`, font: { size: 18 } } },
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Sĩ số' } } },
    };

    const renderMainReport = () => (
        <div className={styles.reportContainer}>
            <div className={styles.mainContentRow}>
                <div className={styles.chartWrapper}>
                    <Bar options={chartOptions} data={attendanceData} />
                </div>
                <MakeupSection lessons={makeupLessonsNeeded} onSelect={setSelectedMakeupLesson} />
            </div>

            {/* Nút hoàn thành được đặt bên ngoài hàng trên, do đó nó sẽ nằm ở dưới cùng */}
            <CompletionButton onClick={handleCompleteCourse} disabled={!canCompleteCourse} />
        </div>
    );

    return (
        <>
            <ReportTrigger onClick={() => setIsOpen(true)} />

            <FlexiblePopup
                open={isOpen}
                onClose={resetPopup}
                width={1200}
                title={`Tổng quan khóa học ${course?.ID || '-'}`}
                renderItemList={renderMainReport}
            />

            <StudentListPopup
                lesson={selectedMakeupLesson}
                onClose={() => setSelectedMakeupLesson(null)}
            />

            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
            />
        </>
    );
}