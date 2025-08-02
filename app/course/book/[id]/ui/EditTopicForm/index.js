'use client';

import React, { useState } from 'react';
import styles from '../../index.module.css';
import sharedBtnStyles from '../main/index.module.css';

const EditTopicForm = ({ initialData, onSave, onCancel }) => {
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
                <label className='text_6' htmlFor="Name">Tên chủ đề</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Period">Thời lượng (tiết)</label>
                <input id="Period" name="Period" type="number" value={formData.Period} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Content">Giới thiệu chủ đề, kỹ năng đạt được</label>
                <textarea id="Content" name="Content" value={formData.Content} onChange={handleChange} className='input'
                    style={{ height: 150, resize: 'none' }} />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6' htmlFor="Slide">Link Google Slide</label>
                <input id="Slide" name="Slide" value={formData.Slide} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={`${sharedBtnStyles.btn} ${styles.cancelBtn}`}>Hủy</button>
                <button type="submit" className={`${sharedBtnStyles.btn} ${styles.submitBtn}`}>
                    Lưu thay đổi
                </button>
            </div>

        </form>
    );
};

export default EditTopicForm;