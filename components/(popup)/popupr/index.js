'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.module.css';

const ANIMATION_DURATION = 300;

const Popup = React.memo(({
    isOpen,
    title,
    onClose,
    onOpen,
    callApiOnOpen,
    content,
    nestedContent,
}) => {
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const [nestedOpen, setNestedOpen] = useState(false);

    useEffect(() => {
        let openTimer;
        let closeTimer;
        // Khi isOpen = true → mount ngay, rồi ở tick kế tiếp bật class .open
        if (isOpen) {
            setMounted(true);
            onOpen?.();
            callApiOnOpen?.();
            openTimer = setTimeout(() => {
                setActive(true);
            }, 0);
        } else if (mounted) {
            // tắt .open để chạy slide-out, sau 300ms mới unmount
            setActive(false);
            closeTimer = setTimeout(() => {
                setMounted(false);
                setNestedOpen(false);
            }, ANIMATION_DURATION);
        }
        // cleanup: hủy hết timers
        return () => {
            clearTimeout(openTimer);
            clearTimeout(closeTimer);
        };
    }, [isOpen, onOpen, callApiOnOpen, mounted]);

    const close = useCallback(() => onClose?.(), [onClose]);
    const openNested = useCallback(() => setNestedOpen(true), []);
    const closeNested = useCallback(() => setNestedOpen(false), []);

    if (!mounted) return null;

    return (
        <div className={styles.overlay} onClick={close}>
            <div
                className={`${styles.popup} ${active ? styles.open : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <header className={styles.header}>
                    <h2>{title}</h2>
                    <button className={styles.closeBtn} onClick={close}>×</button>
                </header>

                <div className={styles.body}>
                    {typeof content === 'function'
                        ? content({ openNested, closeNested })
                        : content}
                </div>

                {nestedContent && (
                    <div className={`${styles.nested} ${nestedOpen ? styles.open : ''}`}>
                        {typeof nestedContent === 'function'
                            ? nestedContent({ openNested, closeNested })
                            : nestedContent}
                    </div>
                )}
            </div>
        </div>
    );
});

export default Popup;
