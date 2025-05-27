'use client';

import React, { memo, useState, useCallback, useDeferredValue, useEffect } from 'react';
import styles from './index.module.css';
import Loading from '@/components/(loading)/loading';
import { Re_Client, Re_History, Re_History_User } from '@/data/client';
import Noti from '@/components/noti';
import Button from '@/components/(button)/button';

function Senmes({ data = [], labelOptions = [], label }) {
    const [open, setOpen] = useState(false);
    const [selectedPhones, setSelectedPhones] = useState(new Set());
    const [labels, setLabels] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // notification state
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMes, setNotiMes] = useState('');

    useEffect(() => {
        if (open) {
            setSelectedPhones(new Set(data.map(p => p.phone)));
        }
    }, [open, data]);

    const reset = useCallback(() => {
        setLabels([]);
        setMessage('');
    }, []);

    const close = useCallback(() => {
        if (loading) return;
        setOpen(false);
        reset();
    }, [loading, reset]);

    const handleTogglePerson = useCallback(phone => {
        setSelectedPhones(prev => {
            const next = new Set(prev);
            if (next.has(phone)) next.delete(phone);
            else next.add(phone);
            return next;
        });
    }, []);

    const handleAddLabel = useCallback(e => {
        const val = e.target.value;
        if (!val) return;
        setLabels(prev => {
            if (prev.includes(val)) return prev;
            const next = [...prev, val];
            if (prev.length === 0) {
                const found = label.find(opt => opt.title === val);
                if (found?.content) setMessage(found.content);
            }
            return next;
        });
        e.target.value = '';
    }, [label]);

    const deferredMessage = useDeferredValue(message);

    const handleSend = useCallback(async () => {
        if (selectedPhones.size === 0) {
            setNotiStatus(false);
            setNotiMes('Vui lòng chọn ít nhất một người để gửi tin');
            setNotiOpen(true);
            return;
        }
        if (!deferredMessage.trim()) return;
        setLoading(true);

        const recipients = data.filter(p => selectedPhones.has(p.phone));

        let okCount = 0;
        let errCount = 0;
        let apiResult;

        try {
            const res = await fetch('/api/sendmes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: recipients, mes: deferredMessage, labels }),
            });
            apiResult = await res.json();

            if (res.ok && Array.isArray(apiResult.data)) {
                okCount = apiResult.data.filter(r => r.status === 'success').length;
                errCount = apiResult.data.filter(r => r.status === 'failed').length;
                setNotiStatus(apiResult.status === 2);
                setNotiMes(`Đã gửi: ${okCount} thành công, ${errCount} thất bại`);
            } else {
                setNotiStatus(false);
                setNotiMes('Gửi thất bại.');
            }

            Re_Client();
            Re_History();
            recipients.forEach(person => {
                Re_History_User(person.phone);
            })
        } catch (e) {
            setNotiStatus(false);
            setNotiMes('Có lỗi khi gọi API.');
        } finally {
            setLoading(false);
            close();
            setNotiOpen(true);
            if (apiResult?.data) {
                fetch('/api/hissmes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mes: deferredMessage,
                        labels,
                        results: apiResult.data,
                        source: 0
                    }),
                }).catch(err => {
                    console.error('Lưu lịch sử thất bại', err);
                });
                Re_History()
            }
        }
    }, [data, selectedPhones, labels, deferredMessage, close]);

    return (
        <>
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
                <p style={{ color: '#fff' }}>Gửi tin nhắn ({data.length})</p>
            </button>

            {open && (
                <div className={styles.overlay}>
                    <div className={styles.background} onClick={close} />

                    <div className={styles.wrap}>
                        <div className={styles.person}>
                            <div className={styles.modalHeader}>
                                <p className="text_4">
                                    Danh sách người gửi tin ({selectedPhones.size})
                                </p>
                            </div>
                            <div className={styles.personListWrap}>
                                {data.map(person => (
                                    <div key={person.phone} className={styles.personItem}>
                                        <div className={styles.wrapchecked}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPhones.has(person.phone)}
                                                onChange={() => handleTogglePerson(person.phone)}
                                                className={styles.checked}
                                            />
                                        </div>
                                        <span className="text_6" style={{ flex: 1 }}>
                                            {person.nameParent}
                                        </span>
                                        <span className="text_6" style={{ flex: 1 }}>
                                            {person.phone}
                                        </span>
                                    </div>
                                ))}
                                {selectedPhones.size === 0 && (
                                    <div
                                        style={{
                                            background: '#fff8ce',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: 8,
                                            padding: 12,
                                            borderBottom: 'thin solid var(--border-color)',
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 512 512"
                                            width={16}
                                            height={16}
                                            fill="#e4b511"
                                        >
                                            <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
                                        </svg>
                                        <p className="text_6">
                                            Bạn cần chọn ít nhất 1 người để gửi tin
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <p className="text_4">Gửi tin nhắn</p>
                                <button className={styles.iconBtn} onClick={close}>
                                    ✕
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <label className="text_6" style={{ marginBottom: 8 }}>
                                    Chọn nhãn (có thể chọn nhiều)
                                </label>
                                <select
                                    className={styles.selectSingle}
                                    onChange={handleAddLabel}
                                    defaultValue=""
                                    disabled={!labelOptions.length}
                                >
                                    <option value="">
                                        {labelOptions.length ? 'Chọn nhãn' : 'Không có nhãn'}
                                    </option>
                                    {labelOptions.map((opt, i) => (
                                        <option key={i} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                {labels.length > 0 && (
                                    <div className={styles.selectedWrap}>
                                        {labels.map(lb => (
                                            <span key={lb} className={styles.chip}>
                                                {lb}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <label className="text_6" style={{ margin: '8px 0' }}>
                                    Nội dung tin nhắn
                                </label>
                                <textarea
                                    className={styles.textArea}
                                    rows={4}
                                    placeholder="Nhập nội dung..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    className={styles.btnText}
                                    onClick={close}
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={styles.btnPrimary}
                                    onClick={handleSend}
                                    disabled={
                                        !deferredMessage.trim() || loading || selectedPhones.size === 0
                                    }
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading &&
                <div style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                    <Loading />
                </div>}

            <Noti
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
                status={notiStatus}
                mes={notiMes}
                button={
                    <button className={styles.button} onClick={() => setNotiOpen(false)} disabled={loading}>
                        Đóng
                    </button>
                }
            />
        </>
    );
}

export default memo(Senmes);
