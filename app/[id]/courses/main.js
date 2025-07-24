'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './main.module.css';

const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : '';

const ArrowIcon = ({ isOpen }) => (<svg className={`${styles.arrowIcon} ${isOpen ? styles.expanded : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);

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

// Component con cho từng buổi học (Lesson)
const LessonItem = ({ lesson, index, isExpanded, onToggle }) => {
    const [imageFilter, setImageFilter] = useState('all'); // 'all' hoặc 'personal'
    const statusInfo = getStatusInfo(lesson.Checkin, 'checkin');

    const allImages = lesson.DetailImage || [];
    const personalImages = lesson.ImageStudent || [];

    const imagesToDisplay = imageFilter === 'all' ? allImages : personalImages;

    return (
        <div className={styles.lessonItem}>
            <button className={styles.lessonHeader} onClick={onToggle}>
                <span className={styles.lessonIndex}>Buổi {index + 1}</span>
                <div className={styles.lessonInfo}>
                    <span className={styles.lessonName}>{lesson.TopicName || `Chủ đề buổi ${index + 1}`}</span>
                    <span className={styles.lessonDate}>{new Date(lesson.Day).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className={`${styles.lessonStatus} ${statusInfo.className}`}>
                    {statusInfo.text}
                </div>
                <ArrowIcon isOpen={isExpanded} />
            </button>
            <div className={`${styles.lessonContent} ${isExpanded ? styles.expandedContent : ''}`}>
                <div className={styles.lessonDetails}>
                    <div className={styles.commentsSection}>
                        <strong>Nhận xét buổi học:</strong>
                        {lesson.Cmt && lesson.Cmt.length > 0 && lesson.Cmt[0] !== "" ? (
                            <ul>{lesson.Cmt.map((cmt, i) => cmt && <li key={i}>{cmt}</li>)}</ul>
                        ) : (
                            <p className={styles.noComment}>Chưa có nhận xét.</p>
                        )}
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
        </div>
    );
};

// --- Component Chính ---
export default function CourseList({ courses }) {
    const [expandedCourseId, setExpandedCourseId] = useState(courses[0]?._id || null);
    const [expandedLessonId, setExpandedLessonId] = useState(null);

    const summary = useMemo(() => {
        const completed = courses.filter(c => c.enrollmentStatus === 2).length;
        return { completed, inProgress: courses.length - completed };
    }, [courses]);

    return (
        <div className={styles.container}>
            <div className={styles.courseList}>
                {courses.map(course => {
                    const isExpanded = expandedCourseId === course._id;
                    const statusInfo = getStatusInfo(course.enrollmentStatus, 'enrollment');
                    const totalLessons = course.Detail.length;
                    const completedLessons = course.Detail.filter(d => d.Checkin === 1 || d.Checkin === 3).length;
                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    // Gán TopicName vào từng buổi học để dễ hiển thị
                    const lessonsWithTopicNames = course.Detail.map(detail => ({
                        ...detail,
                        TopicName: course.Book?.Topics.find(t => t._id === detail.Topic)?.Name
                    }));

                    return (
                        <div key={course._id} className={styles.courseItem}>
                            <button className={styles.courseHeader} onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}>
                                <div className={styles.courseTitle}>
                                    <Image src={course.Book?.Image} width={50} height={50} alt={course.Book?.Name} className={styles.courseImage} />
                                    <div>
                                        <span className={styles.courseName}>{course.Book?.Name}</span>
                                        <span className={`${styles.statusChip} ${statusInfo.className}`}>{statusInfo.text}</span>
                                    </div>
                                </div>
                                <div className={styles.courseProgress}>
                                    <span>{completedLessons}/{totalLessons} buổi</span>
                                    <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }}></div></div>
                                </div>
                                <ArrowIcon isOpen={isExpanded} />
                            </button>
                            <div className={`${styles.courseContent} ${isExpanded ? styles.expandedContent : ''}`}>
                                {lessonsWithTopicNames.map((lesson, index) => (
                                    <LessonItem
                                        key={lesson._id}
                                        lesson={lesson}
                                        index={index}
                                        isExpanded={expandedLessonId === lesson._id}
                                        onToggle={() => setExpandedLessonId(prev => prev === lesson._id ? null : lesson._id)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}