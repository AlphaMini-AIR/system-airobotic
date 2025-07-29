'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './main.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { driveImage } from '@/function';

const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : '';

const ArrowIcon = ({ isOpen }) => (
    <svg className={`${styles.arrowIcon} ${isOpen ? styles.expanded : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const getStatusInfo = (status, type) => {
    const classMap = {
        enrollment: { 2: styles.statusCompleted, 1: styles.statusPaused, 0: styles.statusInProgress },
        checkin: { 1: styles.present, 2: styles.absent, 3: styles.permitted, 0: styles.pending }
    };
    const textMap = {
        enrollment: { 2: 'Đã hoàn thành', 1: 'Bảo lưu', 0: 'Đang học' },
        checkin: { 1: 'Có mặt', 2: 'Vắng', 3: 'Có phép', 0: 'Chưa điểm danh' }
    };
    return { text: textMap[type][status] || '', className: classMap[type][status] || '' };
};

export default function CourseListDisplay({ courses }) {
    const [expandedCourseId, setExpandedCourseId] = useState(courses[0]?._id || null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setIsPopupOpen(true);
    };
    const [imageFilter, setImageFilter] = useState('all');
    const renderLessonDetailPopup = (lesson) => {
        if (!lesson) return null;


        const allImages = lesson.DetailImage || [];
        const personalImages = lesson.ImageStudent || [];
        const imagesToDisplay = imageFilter === 'all' ? allImages : personalImages;
        const statusInfo = getStatusInfo(lesson.Checkin, 'checkin');

        return (
            <div className={styles.popupContainer}>
                <div className={styles.popupHeader}>
                    <h3>{lesson.TopicName || 'Chi tiết buổi học'}</h3>
                    <div className={`${styles.lessonStatus} ${statusInfo.className}`}>{statusInfo.text}</div>
                </div>
                <div className={styles.popupBody}>
                    <div className={styles.commentsSection}>
                        <strong>Nhận xét buổi học:</strong>
                        {lesson.Cmt?.length > 0 && lesson.Cmt.some(c => c) ? (
                            <ul>{lesson.Cmt.map((cmt, i) => cmt && <li key={i}>{cmt}</li>)}</ul>
                        ) : (<p className={styles.noComment}>Chưa có nhận xét.</p>)}
                    </div>
                    <div className={styles.imagesSection}>
                        <div className={styles.imageFilterGroup}>
                            <button onClick={() => setImageFilter('all')} className={imageFilter === 'all' ? styles.active : ''}>Tất cả ({allImages.length})</button>
                            <button onClick={() => setImageFilter('personal')} className={imageFilter === 'personal' ? styles.active : ''}>Cá nhân ({personalImages.length})</button>
                        </div>
                        <div className={styles.imageGrid}>
                            {imagesToDisplay.length > 0 ? (
                                imagesToDisplay.map(img => (
                                    <a key={img.id} href={buildUrl(img.id)} target="_blank" rel="noopener noreferrer" className={styles.imageWrapper}>
                                        <Image src={buildUrl(img.id)} alt="Ảnh buổi học" fill sizes="100px" className={styles.gridImage} />
                                    </a>
                                ))
                            ) : <p className={styles.noComment}>Không có hình ảnh.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={styles.courseList}>
                {courses.map(course => {
                    const isExpanded = expandedCourseId === course._id;
                    const statusInfo = getStatusInfo(course.enrollmentStatus, 'enrollment');
                    const totalLessons = course.Detail.length;
                    const completedLessons = course.Detail.filter(d => d.Checkin === 1 || d.Checkin === 3).length;
                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                    const lessonsWithTopicNames = course.Detail.map(detail => ({ ...detail, TopicName: course.Book?.Topics.find(t => t._id === detail.Topic)?.Name }));

                    return (
                        <div key={course._id} className={styles.courseItem}>
                            <button className={styles.courseHeader} onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}>
                                <div className={styles.courseTitle}>
                                    <Image src={driveImage(course.Book?.Image)} width={60} height={60} alt={course.Book?.Name} className={styles.courseImage} />
                                    <div style={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                        <p className='text_6'>{course.Book?.Name}</p>
                                        <p className='text_6'>Khóa: <span style={{ fontWeight: 400 }}>{course.ID}</span></p>
                                        <p className='text_6'>Trạng thái: <span style={{ fontWeight: 400 }}>{statusInfo.text}</span></p>
                                    </div>
                                </div>
                                <div className={styles.courseProgress}>
                                    <span>{completedLessons}/{totalLessons} buổi</span>
                                    <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }}></div></div>
                                </div>
                                <ArrowIcon isOpen={isExpanded} />
                            </button>
                            <div className={`${styles.courseContent} ${isExpanded ? styles.expandedContent : ''}`}>
                                <div className={styles.lessonList}>
                                    {lessonsWithTopicNames.map((lesson, index) => {
                                        const lessonStatus = getStatusInfo(lesson.Checkin, 'checkin');
                                        return (
                                            <button key={lesson._id} className={styles.lessonItemClickable} onClick={() => handleLessonClick(lesson)}>
                                                <p className={styles.lessonIndex}>Buổi {index + 1}</p>
                                                <div className={styles.lessonInfo}>
                                                    <p className={styles.lessonName}>{lesson.TopicName || `Chủ đề buổi ${index + 1}`}</p>
                                                    <p className={styles.lessonDate}>Thời gian học: {lesson.Time} {new Date(lesson.Day).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <div className={`${styles.lessonStatus} ${lessonStatus.className}`}>{lessonStatus.text}</div>
                                                <p className={styles.arrowIcon}>›</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Chi tiết buổi học"
                data={selectedLesson}
                renderItemList={renderLessonDetailPopup}
                width={700}
            />
        </>
    );
}