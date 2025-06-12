'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'; // <-- Đường dẫn đến component popup
import Loading from '@/components/(ui)/(loading)/loading';         // <-- Đường dẫn đến component loading
import Noti from '@/components/(features)/(noti)/noti';                  // <-- Đường dẫn đến component Noti
import styles from './index.module.css';
import { useRouter } from 'next/navigation';
import { Re_course_one, Re_lesson } from '@/data/course';               // <-- File CSS Module


const getDriveImageUrl = (id, size = 200) => `https://lh3.googleusercontent.com/d/${id}=w${size}`;

const areSetsEqual = (setA, setB) => {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
};

export default function StudentImageSelectionManager({ studentInfo, courseInfo, course }) {
    const router = useRouter();
    const [isPrimaryOpen, setPrimaryOpen] = useState(false);
    const [isSecondaryOpen, setSecondaryOpen] = useState(false);

    // Tách riêng state loading cho 2 popup
    const [isLoadingPrimary, setIsLoadingPrimary] = useState(false);
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);

    // State quản lý thông báo Noti
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });

    const [originalImageIds, setOriginalImageIds] = useState(new Set());
    const [selectedImageIds, setSelectedImageIds] = useState(new Set());
    const [tempSelection, setTempSelection] = useState(new Set());

    useEffect(() => {
        const initialIds = new Set(studentInfo?.Image?.map(img => img.id) || []);
        setOriginalImageIds(initialIds);
        setSelectedImageIds(initialIds);
    }, [studentInfo]);

    const allCourseImages = courseInfo?.detailImage || [];

    const selectedImageObjects = useMemo(() =>
        allCourseImages.filter(img => selectedImageIds.has(img.id)),
        [selectedImageIds, allCourseImages]
    );

    const handleOpenSecondaryPopup = () => {
        setTempSelection(new Set(selectedImageIds));
        setSecondaryOpen(true);
    };

    const handleRemoveFromPrimary = (imageId) => {
        const newSelectedIds = new Set(selectedImageIds);
        newSelectedIds.delete(imageId);
        setSelectedImageIds(newSelectedIds);
    };

    const handleToggleInSecondary = (imageId) => {
        const newTempIds = new Set(tempSelection);
        if (newTempIds.has(imageId)) {
            newTempIds.delete(imageId);
        } else {
            newTempIds.add(imageId);
        }
        setTempSelection(newTempIds);
    };

    const hasChangedOnPrimary = !areSetsEqual(originalImageIds, selectedImageIds);

    const handleSaveChangesOnPrimary = async () => {
        if (!hasChangedOnPrimary) return;
        setIsLoadingPrimary(true);
        try {
            const idsToSave = Array.from(selectedImageIds);
            await saveStudentImagesAPI(studentInfo.ID, courseInfo.id, idsToSave);
            setOriginalImageIds(selectedImageIds);
            setNotification({ open: true, status: true, mes: 'Cập nhật danh sách ảnh thành công!' });
            setPrimaryOpen(false);
        } catch (error) {
            setNotification({ open: true, status: false, mes: error.message || 'Lưu thay đổi thất bại.' });
        } finally {
            setIsLoadingPrimary(false);
        }
    };

    // HÀM MỚI: Xử lý lưu từ Popup 2
    const handleSaveFromSecondary = async () => {
        setIsLoadingSecondary(true);
        try {
            // Lấy ID của buổi học từ courseInfo (được truyền vào component)
            const lessonImageId = courseInfo?.image;
            if (!lessonImageId) {
                throw new Error("Không tìm thấy mã định danh của buổi học (courseInfo.Image).");
            }

            // Chuyển Set ID thành mảng các object {id, type} đúng cấu trúc
            const imagesToSave = allCourseImages
                .filter(img => tempSelection.has(img.id))
                .map(img => ({ id: img.id, type: img.type }));

            // Gọi API route với phương thức POST
            const response = await fetch('/api/updateimagestudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: lessonImageId,         // ID của buổi học để tìm kiếm
                    studentId: studentInfo.ID,
                    newImages: imagesToSave       // Mảng object ảnh mới
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Lỗi từ server');
            }
            await Re_course_one(course.ID);
            await Re_lesson(courseInfo.image);
            router.refresh();

            // Cập nhật state chính sau khi API thành công
            setSelectedImageIds(tempSelection);
            setOriginalImageIds(tempSelection);

            setNotification({ open: true, status: true, mes: result.message || 'Lưu lựa chọn thành công!' });
            setSecondaryOpen(false); // Đóng popup 2
        } catch (error) {
            console.error("Lỗi khi lưu từ popup 2:", error);
            setNotification({ open: true, status: false, mes: error.message || 'Có lỗi xảy ra, không thể lưu.' });
        } finally {
            setIsLoadingSecondary(false);
        }
    };
    const closeNotification = () => setNotification({ open: false, status: false, mes: '' });

    // Render nội dung cho Popup 1
    const renderPrimaryContent = () => (
        <div className={styles.popupContentWrapper}>
            {isLoadingPrimary && (
                <div className={styles.loadingOverlay}>
                    <Loading size={50} content={<p>Đang lưu...</p>} />
                </div>
            )}
            <div className={styles.sectionHeader}>
                <p className='text_4'>Ảnh đã chọn ({selectedImageObjects.length})</p>
                <button className='btn' onClick={handleOpenSecondaryPopup}>+ Thêm ảnh</button>
            </div>

            {selectedImageObjects.length > 0 ?
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <div className={`${styles.imageGrid} ${styles.studentGrid}`}>{
                        selectedImageObjects.map(image => (
                            <button key={image.id} className={styles.imageItem}>
                                <img src={getDriveImageUrl(image.id)} alt={`Ảnh của ${studentInfo.ID}`} />
                            </button>
                        ))
                    }
                    </div>
                </div> : (
                    <div className={styles.emptyPlaceholder}>
                        <p>Chưa có ảnh nào được chọn.</p>
                    </div>
                )}

        </div>
    );

    // Render nội dung cho Popup 2
    const renderSecondaryContent = () => (
        <div className={styles.popupContentWrapper}>
            {isLoadingSecondary && ( // Sử dụng state loading riêng
                <div className={styles.loadingOverlay}>
                    <Loading size={50} content={<p>Đang lưu lựa chọn...</p>} />
                </div>
            )}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div className={`${styles.imageGrid}`}>
                    {allCourseImages.map(image => (
                        <button
                            key={image.id}
                            className={`${styles.imageItem} ${tempSelection.has(image.id) ? styles.selectedInClass : ''}`}
                            onClick={() => handleToggleInSecondary(image.id)}
                        >
                            <img src={getDriveImageUrl(image.id)} alt={`Ảnh lớp ${image.id}`} loading="lazy" />
                            {tempSelection.has(image.id) && <div className={styles.checkOverlay}>✓</div>}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.actions}>
                <button className="btn" onClick={handleSaveFromSecondary} disabled={isLoadingSecondary}>
                    {isLoadingSecondary ? 'Đang lưu...' : 'Lưu lựa chọn'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Noti
                open={notification.open}
                onClose={closeNotification}
                status={notification.status}
                mes={notification.mes}
            />

            <div className={styles.container} onClick={() => setPrimaryOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='var(--text-primary)'>
                    <path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" /></svg>
            </div>

            <FlexiblePopup
                open={isPrimaryOpen}
                onClose={() => setPrimaryOpen(false)}
                title={`Ảnh của học sinh: ${studentInfo.ID}`}
                renderItemList={renderPrimaryContent}
                width={600}
                footer={
                    <div className={styles.actions}>
                        <button className="btn" onClick={handleSaveChangesOnPrimary} disabled={!hasChangedOnPrimary || isLoadingPrimary}>
                            {isLoadingPrimary ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }

                secondaryOpen={isSecondaryOpen}
                onCloseSecondary={() => setSecondaryOpen(false)}
                secondaryTitle={`Chọn ảnh từ thư viện lớp`}
                renderSecondaryList={renderSecondaryContent}
            />
        </>
    );
}