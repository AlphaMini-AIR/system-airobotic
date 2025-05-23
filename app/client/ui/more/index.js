'use client';

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    memo,
} from 'react';
import styles from './index.module.css';

export default function SidePanel({ open, row, labels = [], onClose, onSave }) {
    const backdropRef = useRef(null);
    const firstInputRef = useRef(null);
    const [inputs, setInputs] = useState({ care: '', studyTry: '', study: '' });
    const [saving, setSaving] = useState(false);

    /* ====== Close when click-outside ====== */
    const handleBackdropClick = useCallback(
        (e) => {
            if (open && e.target === backdropRef.current) onClose();
        },
        [open, onClose],
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleBackdropClick);
        return () => document.removeEventListener('mousedown', handleBackdropClick);
    }, [handleBackdropClick]);

    /* ====== Close on ESC ====== */
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    /* ====== Sync data when row changes ====== */
    useEffect(() => {
        if (row) {
            setInputs({
                care: row.care ?? '',
                studyTry: row.studyTry ?? '',
                study: row.study ?? '',
            });
            // autofocus
            setTimeout(() => firstInputRef.current?.focus(), 0);
        }
    }, [row]);

    /* ====== Controlled inputs ====== */
    const handleChange = (key) => (e) =>
        setInputs((prev) => ({ ...prev, [key]: e.target.value }));

    /* ====== Save ====== */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);

        try {
            /* gọi API cập nhật Google Sheet */
            const res = await fetch('/api/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: row.phone,        // cột B trong Sheet
                    care: inputs.care,
                    studyTry: inputs.studyTry,
                    study: inputs.study,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            /* callback cho cha để đồng bộ UI */
            onSave(inputs);
        } catch (err) {
            console.error(err);
            alert('Cập nhật Google Sheet thất bại!');
        } finally {
            setSaving(false);
        }
    };

    /* ====== Render nothing nếu đóng ====== */
    if (!open || !row) return null;

    return (
        <div
            className={styles.backdrop}
            ref={backdropRef}
            aria-modal="true"
            role="dialog"
        >
            <aside className={styles.panel}>
                {/* ===== Header ===== */}
                <header className={styles.header}>
                    <h2 className={styles.title}>Chi tiết khách hàng</h2>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </header>

                {/* ===== Info ===== */}
                <section className={styles.info}>
                    <InfoRow label="Source" value={row.source} />
                    <InfoRow label="Care" value={row.care} />
                    <InfoRow label="Học thử" value={row.studyTry} />
                    <InfoRow label="Nhập học" value={row.study} />
                </section>

                {/* ===== Labels ===== */}
                {!!labels.length && (
                    <section className={styles.labelsBox}>
                        <p className="text_6">Nhãn</p>
                        <div className={styles.labelsWrap}>
                            {labels.map((l) => (
                                <span key={l} className={styles.labelChip}>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* ===== Form ===== */}
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
            </aside>
        </div>
    );
}

/* ==== Pure component tránh re-render thừa ==== */
const InfoRow = memo(function InfoRow({ label, value }) {
    return (
        <p className="text_6" style={{ margin: '4px 0' }}>
            {label}:{' '}
            <span style={{ fontWeight: 400 }}>
                {value || '—'}
            </span>
        </p>
    );
});
