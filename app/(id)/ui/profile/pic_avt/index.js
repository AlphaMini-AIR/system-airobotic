'use client'

import React, { useState } from 'react';
import Input from '@/components/(input)/input';
import styles from './index.module.css';

// Dữ liệu mẫu các hình ảnh (bạn có thể thay đổi theo nhu cầu)
const imagesData = [
    { id: 'img1', src: '/images/img1.jpg' },
    { id: 'img2', src: '/images/img2.jpg' },
    { id: 'img3', src: '/images/img3.jpg' },
    // ... thêm hình ảnh nếu cần
];

export default function ImageSelector({ onSaveSelectedImage }) {
    const [inputValue, setInputValue] = useState('');
    const [selectedImageId, setSelectedImageId] = useState(null);

    const handleImageClick = (id) => {
        setSelectedImageId(id);
    };

    const handleSaveClick = () => {
        if (selectedImageId) {
            // Gọi hàm từ component cha với id của hình được chọn
            onSaveSelectedImage(selectedImageId);
        } else {
            console.log("Chưa chọn hình ảnh nào!");
        }
    };

    return (
        <div className={styles.container}>
            <p className='text_4_m' style={{ marginBottom: 8 }}>Tải hình bằng link drive</p>
            <div className={styles.topSection} style={{ borderBottom: 'thin solid var(--border-color)', paddingBottom: 8 }}>
                <Input
                    type="text"
                    name="customInput"
                    placeholder="Nhập nội dung..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    padding="10px 8px"
                />
                <button onClick={handleSaveClick} className={styles.saveButton}>
                    Lưu
                </button>
            </div>

            <p className='text_4_m' style={{ marginBottom: 8 }}>Chọn hình từ khóa học</p>
            <div className={styles.imageList}>
                {imagesData.map((img) => (
                    <div
                        key={img.id}
                        className={`${styles.imageItem} ${selectedImageId === img.id ? styles.selected : ''}`}
                        onClick={() => handleImageClick(img.id)}
                    >
                        <img src={img.src} alt={`Image ${img.id}`} className={styles.image} />
                    </div>
                ))}
            </div>
        </div>
    );
}
