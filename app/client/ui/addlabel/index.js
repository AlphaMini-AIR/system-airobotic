'use client';

import React, { useState } from 'react';
import styles from './index.module.css';
import Loading from '@/components/(loading)/loading';        

export default function AddLabelButton({ onCreated }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);  // ⬅️ trạng thái loading
    const [form, setForm] = useState({ title: '', time: '', desc: '' });

    /* ---------------- handlers ---------------- */
    const handleChange = (key) => (e) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);                         
        try {
            await fetch('/api/label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),     
            });

            alert('Đã thêm nhãn!');
            setOpen(false);
            setForm({ title: '', time: '', desc: '' });
            onCreated?.();                        
        } catch (err) {
            console.error(err);
            alert('Thêm nhãn thất bại!');
        } finally {
            setLoading(false);                    
        }
    };

    return (
        <>
            {/* ===== Nút chip ===== */}
            <button
                className={`${styles.chip} ${styles.addChip}`}
                onClick={() => setOpen(true)}
                title="Thêm nhãn mới"
            >
                + Nhãn
            </button>

            {/* ===== Modal ===== */}
            {open && (
                <div className={styles.backdrop} onClick={() => setOpen(false)}>
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: 16,
                                borderBottom: 'thin solid var(--border-color)',
                            }}
                        >
                            <p className="text_4">Thêm nhãn mới</p>
                        </div>

                        {/* overlay spinner */}
                        {loading && (
                            <div className={styles.loadingOverlay}>
                                <Loading />
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSave}>
                            <label className={styles.group}>
                                Tiêu đề
                                <input
                                    required
                                    value={form.title}
                                    onChange={handleChange('title')}
                                    placeholder="Tiêu đề nhãn"
                                    className={styles.input}
                                    disabled={loading}
                                />
                            </label>

                            <label className={styles.group}>
                                Thời gian
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.time}
                                    onChange={handleChange('time')}
                                    className={styles.input}
                                    disabled={loading}
                                />
                            </label>

                            <label className={styles.group}>
                                Miêu tả
                                <textarea
                                    rows={3}
                                    value={form.desc}
                                    onChange={handleChange('desc')}
                                    placeholder="Mô tả ngắn (tuỳ chọn)…"
                                    className={styles.input}
                                    disabled={loading}
                                />
                            </label>

                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.btnCancel}
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    className={styles.btnSave}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang lưu…' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
