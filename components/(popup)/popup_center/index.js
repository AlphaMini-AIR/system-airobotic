// CenterPopup.jsx
'use client';

import React, { useEffect, useState } from 'react';
import styles from './index.module.css';  // đảm bảo đúng tên file

const ANIMATION_DURATION = 300;

export default function CenterPopup({
    open,
    onClose,
    title = '',
    children,
    size = 'md',
    globalZIndex = 1000
}) {
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
        } else if (mounted) {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), ANIMATION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [open, mounted]);

    if (!mounted) return null;
    console.log(title);
    
    return (
        <div
            className={`${styles.overlay} ${visible ? styles.show : ''}`}
            onMouseDown={onClose}
            style={{ zIndex: globalZIndex }}
        >
            <div
                className={`${styles.popup} ${styles[size]} ${visible ? styles.open : ''}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {title && (
                    <div className={styles.header}>
                        <h3 className={styles.title}>{title}</h3>
                        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                    </div>
                )}
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
