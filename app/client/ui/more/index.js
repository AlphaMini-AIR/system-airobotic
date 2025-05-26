// SidePanel.jsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import FlexiblePopup from '@/components/(popup)/popup_right';
import CenterPopup from '@/components/(popup)/popup_center';
import Loading from '@/components/(loading)/loading';
import { Data_History_User } from '@/data/client';
import styles from './index.module.css';
import Title from '@/components/(popup)/title';

export default function SidePanel({ open, row, labels = [], onClose, onSave }) {
    const firstInputRef = useRef(null);
    const [inputs, setInputs] = useState({ care: '', studyTry: '', study: '' });
    const [saving, setSaving] = useState(false);
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(true);

    // State cho popup chi tiết lịch sử
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    /* Close on ESC */
    useEffect(() => {
        const handleEsc = e => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    /* Sync inputs khi row thay đổi */
    useEffect(() => {
        if (row) {
            setInputs({
                care: row.care ?? '',
                studyTry: row.studyTry ?? '',
                study: row.study ?? '',
            });
        }
    }, [row]);

    /* Focus first textarea khi form mở */
    useEffect(() => {
        if (open && formOpen) {
            const t = setTimeout(() => firstInputRef.current?.focus(), 300);
            return () => clearTimeout(t);
        }
    }, [open, formOpen]);

    const handleChange = key => e =>
        setInputs(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            const res = await fetch('/api/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: row.phone, ...inputs }),
            });
            if (!res.ok) throw new Error(await res.text());
            onSave(inputs);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Cập nhật Google Sheet thất bại!');
        } finally {
            setSaving(false);
        }
    };

    const renderContent = () => (
        <>
            <section className={styles.info}>
                <p className="text_4" style={{ marginBottom: 8 }}>Thông tin khách hàng</p>
                <InfoRow label="Họ và tên" value={row?.name} />
                <InfoRow label="Số điện thoại" value={row?.phone} />
                <InfoRow label="Email" value={row?.email} />
                <InfoRow label="Tên học sinh" value={row?.nameStudent} />
                <InfoRow label="Khu vực" value={row?.area} />
                <InfoRow label="Nguồn data" value={row?.source} />
            </section>

            {labels.length > 0 && (
                <section className={styles.labelsBox}>
                    <p className="text_4" style={{ marginBottom: 8 }}>Nhãn</p>
                    <div className={styles.labelsWrap}>
                        {labels.map(l => <span key={l} className="chip">{l}</span>)}
                    </div>
                </section>
            )}

            <section className={styles.info}>
                <p className="text_4" style={{ marginBottom: 8 }}>Lịch sử chăm sóc</p>
                <InfoRow label="Số lần chăm sóc" value={12} />
                <InfoRow label="Giai đoạn chăm sóc" value={row?.source} />
                <button
                    type="button"
                    className={styles.saveBtn}
                    style={{ marginTop: 8 }}
                    onClick={() => setSecondaryOpen(true)}
                >
                    Chi tiết chăm sóc
                </button>
            </section>

            <section className={styles.info}>
                <p className="text_4" style={{ marginBottom: 8 }}>Cập nhật giai đoạn chăm sóc</p>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setFormOpen(o => !o)}
                >
                    {formOpen ? 'Thu gọn cập nhật' : 'Hiển thị cập nhật'}
                </button>
                {formOpen && (
                    <form onSubmit={handleSubmit} className={styles.form} style={{ padding: '12px 0' }}>
                        {[
                            { key: 'care', label: 'Care', ref: firstInputRef },
                            { key: 'studyTry', label: 'Học thử' },
                            { key: 'study', label: 'Nhập học' },
                        ].map(({ key, label, ref }) => (
                            <label key={key} className={styles.formGroup}>
                                {label}
                                <textarea
                                    ref={ref}
                                    rows={2}
                                    value={inputs[key]}
                                    onChange={handleChange(key)}
                                    disabled={saving}
                                />
                            </label>
                        ))}
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </form>
                )}
            </section>
        </>
    );

    const renderCareHistory = useCallback(histories => {
        if (!histories.length) {
            return (
                <div className={styles.emptyHistory}>
                    Chưa có lịch sử chăm sóc
                </div>
            );
        }
        return (
            <div className={styles.moreInfo}>
                <ul className={styles.historyList}>
                    {histories.map(h => (
                        <li key={h._id} style={{ listStyle: 'none' }}>
                            <div
                                style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    padding: 16,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setSelectedHistory(h);
                                    setDetailOpen(true);
                                }}
                            >
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <div className='text_6_400' style={{ padding: '4px 8px', backgroundColor: '#e4ddff', borderRadius: 4 }}>
                                        {new Date(h.sentAt).toLocaleString()}
                                    </div>
                                    <div className='text_6_400' style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                                        {h.labels.join(', ') || '—'}
                                    </div>
                                </div>
                                <div className='text_6_400' style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                                    Thành công
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: 4,
                                    paddingTop: 8,
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: 8
                                }}>
                                    <p className='text_6'>Nội dung:</p>
                                    <p style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        margin: 0,
                                        flex: 1
                                    }} className='text_6_400'>
                                        {h.message}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }, []);

    return (
        <>
            <FlexiblePopup
                open={open}
                key={row?.phone ?? 'no-row'}
                onClose={onClose}
                title="Chi tiết khách hàng"
                size="md"
                renderItemList={() => row ? renderContent() : <Loading content="Đang tải chi tiết…" />}
                secondaryOpen={secondaryOpen}
                onCloseSecondary={() => setSecondaryOpen(false)}
                fetchDataSecondary={() =>
                    Data_History_User(row.phone).then(res => res.data)
                }
                renderSecondaryList={renderCareHistory}
                secondaryTitle="Lịch sử chăm sóc"
            />
            <CenterPopup
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                globalZIndex={1001}
            >
                {selectedHistory ? (
                    <>
                        <Title
                            content={
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <p>Chi tiết gửi tin</p>
                                    <div className='text_6_400' style={{ padding: '4px 8px', backgroundColor: '#e4ddff', borderRadius: 4 }}>
                                        {new Date(selectedHistory.sentAt).toLocaleString()}
                                    </div>
                                    <div className='text_6_400' style={{
                                        padding: '4px 8px', backgroundColor: '#e4ddff', borderRadius: 4,
                                        background: selectedHistory.recipients[0].status === 'success' ? 'var(--green)' : 'var(--red)', color: 'white'
                                    }}>
                                        {selectedHistory.recipients[0].status === 'success' ? 'Thành công' : 'Thất bại'}
                                    </div>

                                </div>
                            }
                            click={() => setCenterOpen(false)}
                        />
                        <div style={{ padding: 16 }}>
                            <p className='text_6' style={{
                                paddingBottom: 8
                            }}>Nhãn gán tin nhắn:</p>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div className='text_6_400' style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                                        {selectedHistory.labels.join(', ') || '—'}
                                    </div>
                                </div>
                            </div>
                            <p className='text_6' style={{
                                borderTop: 'thin solid var(--border-color)',
                                padding: '8px 0'
                            }}>Nội dung gửi đi:</p>
                            <p className='text_6_400'
                                style={{
                                    margin: 0,
                                    flex: 1,
                                    marginBottom: 16
                                }}>
                                {selectedHistory.message}
                            </p>
                        </div>
                    </>
                ) : (
                    <Loading content="Đang tải chi tiết…" />
                )}
            </CenterPopup>
        </>
    );
}

const InfoRow = React.memo(function InfoRow({ label, value }) {
    return (
        <p className="text_6" style={{ margin: '4px 0' }}>
            {label}:&nbsp;
            <span style={{ fontWeight: 400 }}>
                {value || '—'}
            </span>
        </p>
    );
});
