'use client';

import React, { useState, useCallback, useDeferredValue, memo } from 'react';
import styles from './index.module.css';
import Loading from '@/components/(loading)/loading';
import { Re_Client } from '@/data/client';

/**
 * props:
 *   data         – danh sách khách hàng cần gửi
 *   labelOptions – mảng tất cả nhãn đã có (được memo ở cha)
 */
function Senmes({ data = [], labelOptions = [] }) {
    const [open, setOpen] = useState(false);
    const [labels, setLabels] = useState([]);      // mảng nhãn đã chọn
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    /* ---------- helpers ---------- */
    const reset = () => {
        setLabels([]);
        setMessage('');
    };

    const close = useCallback(() => {
        if (loading) return;
        setOpen(false);
        reset();
    }, [loading]);

    /** Thêm 1 nhãn mỗi lần chọn, không trùng lặp */
    const handleAddLabel = useCallback((e) => {
        const val = e.target.value;
        if (!val) return;
        setLabels((prev) =>
            prev.includes(val) ? prev : [...prev, val]
        );
        e.target.value = '';    // reset select về placeholder
    }, []);

    const deferredMessage = useDeferredValue(message);

    const handleSend = useCallback(async () => {
        if (!deferredMessage.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/sendmes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data,
                    mes: deferredMessage,
                    labels,
                }),
            });
            const result = await res.json();
            if (res.ok) {
                Re_Client();
                const ok = result.results.filter((r) => r.status === 'success').length;
                const err = result.results.filter((r) => r.status === 'failed').length;
                alert(`Đã gửi: ${ok} thành công, ${err} thất bại`);
            } else {
                console.error(result.error);
                alert('Gửi thất bại.');
            }
        } catch (e) {
            console.error(e);
            alert('Có lỗi khi gọi API.');
        } finally {
            setLoading(false);
            close();
        }
    }, [data, labels, deferredMessage, close]);

    /* ---------- render ---------- */
    return (
        <>
            {/* nút mở modal */}
            <button
                className="button"
                onClick={() => setOpen(true)}
                style={{
                    padding: '10px 12px',
                    background: 'var(--main_d)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: 'max-content',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="white">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                </svg>
                <p style={{ color: '#fff' }}>Gửi tin nhắn</p>
            </button>

            {open && (
                <div className={styles.overlay}>
                    <div className={styles.background} onClick={close}></div>
                    <div className={styles.modal}>
                        {/* header */}
                        <div className={styles.modalHeader}>
                            <p className="text_4">Gửi tin nhắn</p>
                            <button className={styles.iconBtn} onClick={close}>✕</button>
                        </div>

                        {/* body */}
                        <div className={styles.modalBody}>
                            <label className="text_6" style={{ marginBottom: 8 }}>
                                Chọn nhãn (có thể chọn nhiều lần)
                            </label>

                            {/* select một nhãn/lần */}
                            <select
                                className={styles.selectSingle}
                                onChange={handleAddLabel}
                                defaultValue=""
                                disabled={!labelOptions.length}
                                title={labelOptions.length ? 'Chọn nhãn' : 'Không có nhãn'}
                            >
                                <option value="">
                                    {labelOptions.length ? 'Chọn nhãn' : 'Không có nhãn'}
                                </option>
                                {labelOptions.map((lb) => (
                                    <option key={lb} value={lb}>
                                        {lb}
                                    </option>
                                ))}
                            </select>

                            {/* hiển thị nhãn đã chọn */}
                            {labels.length > 0 && (
                                <div className={styles.selectedWrap}>
                                    {labels.map((lb) => (
                                        <span key={lb} className={styles.chip}>
                                            {lb}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* nội dung */}
                            <label className="text_6" style={{ margin: '8px 0' }}>
                                Nội dung tin nhắn
                            </label>
                            <textarea
                                className={styles.textArea}
                                rows="4"
                                placeholder="Nhập nội dung..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        {/* footer */}
                        <div className={styles.modalFooter}>
                            <button className={styles.btnText} onClick={close}>Hủy</button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleSend}
                                disabled={!deferredMessage.trim() || loading}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {loading && <Loading />}
        </>
    );
}

export default memo(Senmes);
