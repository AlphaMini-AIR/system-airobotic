'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import styles from './index.module.css'; // File CSS bạn cung cấp

// Helper để lấy thông tin trạng thái khóa học
const getStatusInfo = (status) => {
    switch (status) {
        case 2: return { text: 'Đã hoàn thành', className: styles.statusCompleted };
        case 1: return { text: 'Bảo lưu', className: styles.statusPaused };
        default: return { text: 'Đang học', className: styles.statusInProgress };
    }
};

// Icon mũi tên
const ArrowIcon = ({ isOpen }) => (
    <span className={`${styles.arrowIcon} ${isOpen ? styles.expanded : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={14} height={14} fill="currentColor">
            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L64 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
        </svg>
    </span>
);

// Component con cho một mục Accordion
const CourseAccordionItem = memo(function CourseAccordionItem({ course, onMediaClick, selectionMode, selectedMedia, initialFilter }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [personalFilter, setPersonalFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState(initialFilter);

    const mediaItems = useMemo(() => {
        const source = personalFilter === 'all'
            ? course.Detail?.flatMap(d => d.DetailImage || []) || []
            : course.Detail?.flatMap(d => d.ImageStudent || []) || [];

        if (typeFilter === 'all') return source;
        return source.filter(item => item.type === typeFilter);
    }, [course.Detail, personalFilter, typeFilter]);

    const statusInfo = getStatusInfo(course.enrollmentStatus);

    return (
        <div className={styles.accordionItem}>
            <button className={styles.accordionHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.courseInfo}>
                    <p className={styles.courseName}>{course.Book?.Name || course.ID}</p>
                    <span className={`${styles.statusChip} ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
                <ArrowIcon isOpen={isExpanded} />
            </button>
            <div className={`${styles.accordionContent} ${isExpanded ? styles.expandedContent : ''}`}>
                <div className={styles.contentWrapper}>
                    <div className={styles.filterGroup}>
                        {initialFilter === 'all' && (
                            <>
                                <button onClick={() => setTypeFilter('all')} className={`${styles.filterButton} ${typeFilter === 'all' ? styles.active : ''}`}>Tất cả</button>
                                <button onClick={() => setTypeFilter('image')} className={`${styles.filterButton} ${typeFilter === 'image' ? styles.active : ''}`}>Ảnh</button>
                                <button onClick={() => setTypeFilter('video')} className={`${styles.filterButton} ${typeFilter === 'video' ? styles.active : ''}`}>Video</button>
                                <span className={styles.separator}></span>
                            </>
                        )}
                        <button onClick={() => setPersonalFilter('all')} className={`${styles.filterButton} ${personalFilter === 'all' ? styles.active : ''}`}>Khoá học</button>
                        <button onClick={() => setPersonalFilter('personal')} className={`${styles.filterButton} ${personalFilter === 'personal' ? styles.active : ''}`}>Cá nhân</button>
                    </div>
                    <div className={styles.imageGrid}>
                        {mediaItems.length > 0 ? (
                            mediaItems.map((media) => {
                                const mediaUrl = media.type === 'video' ? `https://drive.google.com/thumbnail?id=${media.id}` : `https://lh3.googleusercontent.com/d/${media.id}`;
                                const isSelected = selectionMode === 'single' ? selectedMedia === media.id : Array.isArray(selectedMedia) && selectedMedia.includes(media.id);
                                
                                return (
                                    <div key={media.id} className={`${styles.imageWrapper} ${isSelected ? styles.selected : ''}`} onClick={() => onMediaClick(media.id)}>
                                        {media.type === 'video'
                                            ? <Image src={mediaUrl} alt="Media" fill sizes="150px" className={styles.gridImage} loading="lazy" />
                                            : <Image src={mediaUrl} alt="Media" fill sizes="150px" className={styles.gridImage} loading="lazy" />
                                        }
                                    </div>
                                );
                            })
                        ) : (<p className={styles.noImageText}>Không có file phù hợp.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function CourseAndImageSelection({ studentData, selectionMode, selected, onSelectionChange, filterType = 'all' }) {
    // SỬA LỖI 3: Handler giờ đây nhận vào và xử lý mediaId
    const handleMediaClick = useCallback((mediaId) => {
        if (!onSelectionChange) return;
        if (selectionMode === 'single') {
            onSelectionChange(mediaId);
        } else {
            const currentSelection = Array.isArray(selected) ? selected : [];
            const newSelection = currentSelection.includes(mediaId) ? currentSelection.filter(id => id !== mediaId) : [...currentSelection, mediaId];
            onSelectionChange(newSelection);
        }
    }, [selectionMode, selected, onSelectionChange]);

    if (!studentData?.Course?.length) return <p>Học sinh chưa đăng ký khóa học nào.</p>;

    return (
        <div className={styles.container}>
            {studentData.Course.map(enrollment => (<CourseAccordionItem key={enrollment._id} course={enrollment} onMediaClick={handleMediaClick} selectionMode={selectionMode} selectedMedia={selected} initialFilter={filterType} />))}
        </div>
    );
}