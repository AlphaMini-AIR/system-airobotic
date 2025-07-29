'use client';
import React, { useState } from 'react';
import styles from '../../index.module.css'; // Giả sử path đúng
import sharedBtnStyles from '../main/index.module.css'; // Giả sử path đúng
import { Svg_Save } from '@/components/(icon)/svg';

// Các hàm helper có thể đặt bên ngoài hoặc import
const getFileName = (file) => {
    if (file instanceof File) return file.name;
    if (typeof file === 'string' && file) return file.substring(file.lastIndexOf('/') + 1);
    return null;
};

const truncateString = (str, start, end) => {
    if (!str) return null;
    return str.length > start + end ? `${str.slice(0, start)}...${str.slice(-end)}` : str;
};

const EditBookForm = ({ initialData, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        Name: initialData?.Name || '',
        Price: initialData?.Price || 0,
        Describe: initialData?.Describe || '',
        Image: initialData?.Image || null,
        Badge: initialData?.Badge || null,
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.Name) {
            setError('Vui lòng nhập tên chương trình.');
            return;
        }
        setError('');

        const dataToSubmit = new FormData();
        dataToSubmit.append('Name', formData.Name);
        dataToSubmit.append('Price', Number(formData.Price) || 0);
        dataToSubmit.append('Describe', formData.Describe || '');
        dataToSubmit.append('ID', initialData?._id || '');
        if (formData.Image && formData.Image instanceof File) {
            dataToSubmit.append('Image', formData.Image);
        }
        if (formData.Badge && formData.Badge instanceof File) {
            dataToSubmit.append('Badge', formData.Badge);
        }

        onSave(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Name">Tên sách/khóa học</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='input' required />
            </div>

            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Price">Học phí (VND)</label>
                <input id="Price" name="Price" type="number" value={formData.Price} onChange={handleChange} className='input' />
            </div>

            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Describe">Mô tả ngắn</label>
                <textarea id="Describe" name="Describe" value={formData.Describe} onChange={handleChange} className='input' placeholder='Mô tả ngắn gọn' style={{ height: 100, resize: 'none' }} />
            </div>

            <div className={styles.fileUploader}>
                <input type="file" id="cover-image-upload" name="Image" className={styles.hiddenInput} onChange={handleFileChange} accept="image/*" />
                <label htmlFor="cover-image-upload" className={styles.customButton}>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text_6_400' style={{ color: 'white' }}>Tải ảnh bìa</p>
                </label>
                <span className={styles.fileName}>{truncateString(getFileName(formData.Image), 20, 10) || "Chưa có tệp nào được chọn"}</span>
            </div>

            <div className={styles.fileUploader}>
                <input type="file" id="badge-image-upload" name="Badge" className={styles.hiddenInput} onChange={handleFileChange} accept="image/*" />
                <label htmlFor="badge-image-upload" className={styles.customButton}>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text_6_400' style={{ color: 'white' }}>Tải ảnh huy hiệu</p>
                </label>
                <span className={styles.fileName}>{truncateString(getFileName(formData.Badge), 20, 10) || "Chưa có tệp nào được chọn"}</span>
            </div>

            {error && <p className={styles.error} style={{ marginTop: 8 }}>{error}</p>}

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={`${sharedBtnStyles.btn} ${styles.cancelBtn}`}>Hủy</button>
                <button type="submit" className={`${sharedBtnStyles.btn} ${styles.submitBtn}`} disabled={isLoading}>
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
};

export default EditBookForm;