// components/ui/HistoryPopup.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Popup from '@/components/(popup)/popupr';                // ← Popup generic bạn đã tạo
import styles from './index.module.css';    // chỉ còn mỗi CSS cho nội dung bên trong

export default function HistoryPopup({ open, onClose }) {
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // khi open chuyển sang true thì fetch
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError('');
        fetch('/api/hissmes')
            .then(async res => {
                const json = await res.json();
                if (res.ok && json.status === 2) {
                    setHistories(json.data);
                } else {
                    throw new Error(json.mes || 'Không tải được lịch sử');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [open]);

    // gói nội dung vào hàm render để truyền thành prop
    const renderContent = useCallback(() => (
        <div className={styles.content}>
            {loading && <p>Đang tải...</p>}
            {error && <p className={styles.error}>{error}</p>}

            {!loading && !error && histories.length === 0 && (
                <p>Chưa có lịch sử gửi nào.</p>
            )}

            {!loading && histories.map(h => (
                <div key={h._id} className={styles.item}>
                    <div>
                        <strong>Thời gian:</strong>{' '}
                        {new Date(h.sentAt).toLocaleString()}
                    </div>
                    <div><strong>Nội dung:</strong> {h.message}</div>
                    <div>
                        <strong>Nhãn:</strong>{' '}
                        {h.labels.join(', ') || '—'}
                    </div>
                    <div>
                        <strong>Người nhận:</strong>
                        <ul>
                            {h.recipients.map(r => (
                                <li key={r.phone}>
                                    {r.phone} — {r.status}
                                    {r.error && ` (${r.error})`}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    ), [loading, error, histories]);

    return (
        <Popup
            isOpen={open}
            title="Lịch sử gửi tin nhắn"
            onClose={onClose}
            content={renderContent}
        />
    );
}
