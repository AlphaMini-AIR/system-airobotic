// SidePanel.jsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import FlexiblePopup from '@/components/(popup)/popup_right';
import styles from './index.module.css';

export default function SidePanel({ open, row, labels = [], onClose, onSave }) {
    const firstInputRef = useRef(null);
    const [inputs, setInputs] = useState({ care: '', studyTry: '', study: '' });
    const [saving, setSaving] = useState(false);

    // state for secondary popup
    const [secondaryOpen, setSecondaryOpen] = useState(false);

    /* Close on ESC */
    useEffect(() => {
        const handleEsc = e => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    /* Sync data */
    useEffect(() => {
        if (row) {
            setInputs({
                care: row.care ?? '',
                studyTry: row.studyTry ?? '',
                study: row.study ?? '',
            });
        }
    }, [row]);

    /* Focus first input */
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => firstInputRef.current?.focus(), 300);
            return () => clearTimeout(t);
        }
    }, [open]);

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
                body: JSON.stringify({
                    phone: row.phone,
                    care: inputs.care,
                    studyTry: inputs.studyTry,
                    study: inputs.study,
                }),
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
                <InfoRow label="Source" value={row?.source} />
                <InfoRow label="Care" value={row?.care} />
                <InfoRow label="Học thử" value={row?.studyTry} />
                <InfoRow label="Nhập học" value={row?.study} />
            </section>

            {labels.length > 0 && (
                <section className={styles.labelsBox}>
                    <p className="text_6">Nhãn</p>
                    <div className={styles.labelsWrap}>
                        {labels.map(l => (
                            <span key={l} className="chip">{l}</span>
                        ))}
                    </div>
                </section>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
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

            {/* Button to open secondary popup */}
            <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setSecondaryOpen(true)}
            >
                Xem thêm thông tin
            </button>
        </>
    );

    return (
        <FlexiblePopup
            // ▶ Popup 1
            open={open}
            key={row?.phone ?? 'no-row'}
            onClose={onClose}
            title="Chi tiết khách hàng"
            size="md"
            renderItemList={() => (row ? renderContent() : <p>Đang tải dữ liệu…</p>)}

            // ▶ Popup 2 (secondary)
            secondaryOpen={secondaryOpen}
            onCloseSecondary={() => setSecondaryOpen(false)}
            dataSecondary={row?.moreDetails || {}}
            renderSecondaryList={details => (
                <div className={styles.moreInfo}>
                    <h4>Thông tin bổ sung</h4>
                    <pre>{JSON.stringify(details, null, 2)}</pre>
                </div>
            )}
            secondaryTitle="Thông tin bổ sung"
        />
    );
}

/* Pure component avoids extra rerenders */
const InfoRow = React.memo(function InfoRow({ label, value }) {
    return (
        <p className="text_6" style={{ margin: '4px 0' }}>
            {label}:{' '}
            <span style={{ fontWeight: 400 }}>
                {value || '—'}
            </span>
        </p>
    );
});
