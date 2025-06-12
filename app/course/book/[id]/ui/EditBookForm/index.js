'use client';
import React, { useState } from 'react';
import styles from '../../index.module.css';
import sharedBtnStyles from '../main/index.module.css';

const EditBookForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Name">Tên sách/khóa học</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Price">Học phí (VND)</label>
                <input id="Price" name="Price" type="number" value={formData.Price} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Image">Link ảnh bìa</label>
                <input id="Image" name="Image" value={formData.Image} onChange={handleChange} className='input' />
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={`${sharedBtnStyles.btn} ${styles.cancelBtn}`}>Hủy</button>
                <button type="submit" className={`${sharedBtnStyles.btn} ${styles.submitBtn}`}>Lưu thay đổi</button>
            </div>
        </form>
    );
};

export default EditBookForm;