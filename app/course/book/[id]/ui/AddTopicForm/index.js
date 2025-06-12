import React, { useState } from 'react';
import styles from '../../index.module.css'; // Giả định path này đúng
import sharedBtnStyles from '../main/index.module.css'; // Giả định path này đúng

const AddTopicForm = ({ onSave, onCancel, isLoading }) => {
    // Loại bỏ trường 'key' không cần thiết
    const [formData, setFormData] = useState({
        Name: '',
        Period: '',
        Slide: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Chỉ cần kiểm tra Tên chủ đề là đủ
        if (!formData.Name.trim()) {
            alert('Vui lòng nhập Tên chủ đề.');
            return;
        }
        // Truyền dữ liệu form cho hàm onSave của component cha
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label className='text_6_400' htmlFor="Name">Tên chủ đề</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='input' required />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6_400' htmlFor="Period">Thời lượng (số tiết)</label>
                <input id="Period" name="Period" type="number" value={formData.Period} onChange={handleChange} className='input' />
            </div>
            <div className={styles.formGroup}>
                <label className='text_6_400' htmlFor="Slide">Link Google Slide</label>
                <input id="Slide" name="Slide" value={formData.Slide} onChange={handleChange} className='input' />
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={`${sharedBtnStyles.btn} ${styles.cancelBtn}`} disabled={isLoading}>Hủy</button>
                <button type="submit" className={`${sharedBtnStyles.btn} ${styles.submitBtn}`} disabled={isLoading}>
                    {isLoading ? 'Đang lưu...' : 'Thêm chủ đề'}
                </button>
            </div>
        </form>
    );
};

export default AddTopicForm;