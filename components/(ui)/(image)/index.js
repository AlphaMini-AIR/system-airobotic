'use client'
import React, { useState, useCallback, useRef, useMemo } from 'react';
import styles from './index.module.css';
import { Svg_Pen } from '@/components/(icon)/svg';
// Reusable Button component for cleaner JSX
const ActionButton = ({ icon, text, onClick, className = '' }) => (
    <button className={`${styles.actionButton} ${className}`} onClick={onClick}>
        {icon && <span className={styles.buttonIcon}>{icon}</span>}
        {text}
    </button>
);

const ImageComponent = ({ width, imageInfo }) => {

    let src;
    if (imageInfo.type === 'image') {
        src = `https://lh3.googleusercontent.com/d/${imageInfo.id}`;
    }
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const popupImageRef = useRef(null);

    const handleImageClick = useCallback(() => {
        setIsPopupOpen(true);
    }, []);

    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
    }, []);

    const handleEdit = useCallback(() => {
        alert(`Chỉnh sửa hình ảnh: ${imageInfo.id} (Type: ${imageInfo.type})`);
        // Implement your actual edit logic here (e.g., open another form)
    }, [imageInfo]);

    const handleDelete = useCallback(() => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa hình ảnh này: ${imageInfo.id}?`)) {
            alert(`Xóa hình ảnh: ${imageInfo.id} (Type: ${imageInfo.type})`);
            // Implement your actual delete logic here (e.g., API call)
            handleClosePopup(); // Close popup after delete attempt
        }
    }, [imageInfo, handleClosePopup]);

    const handleDownload = useCallback(() => {
        if (popupImageRef.current) {
            const link = document.createElement('a');
            link.href = popupImageRef.current.src;
            link.download = `image_${imageInfo.id || 'download'}.${src.split('.').pop()}`; // Suggest filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('Không thể tải ảnh. Vui lòng thử lại.');
        }
    }, [imageInfo.id, src]);

    const containerStyle = useMemo(() => {
        // Ensure width is always valid. If width is a number, assume 'px'.
        const parsedWidth = typeof width === 'number' ? `${width}px` : width;
        return {
            width: parsedWidth,
            aspectRatio: '1 / 1',
        };
    }, [width]);

    return (
        <>
            <div className={styles.imageContainer} style={containerStyle} onClick={handleImageClick}>
                <img src={src} alt={`Image ${imageInfo.id}`} className={styles.image} />
            </div>

            {isPopupOpen && (
                <div className={styles.popupOverlay} onClick={handleClosePopup}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        <img ref={popupImageRef} src={src} alt={`Detail ${imageInfo.id}`} className={styles.popupImage} />
                        {/* <div className={styles.popupActions}>
                            <div className={styles.lightboxClose} >
                                <Svg_Pen w={30} h={30} c={'var(--yellow)'} />
                            </div>
                            <div className={styles.lightboxClose} >
                                <Svg_Pen w={30} h={30} c={'var(--yellow)'} />
                            </div>
                            <div className={styles.lightboxClose} >
                                <Svg_Pen w={30} h={30} c={'var(--yellow)'} />
                            </div>
                        </div> */}
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageComponent;