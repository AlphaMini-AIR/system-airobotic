'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './index.module.css';
import Loading from '@/components/(loading)/loading';

const ANIMATION_DURATION = 300;

export default function FlexiblePopup({
    // primary popup props
    open,
    onClose,
    fetchData = null,
    data: providedData = null,
    renderItemList = () => null,
    title = 'Danh sách',

    // secondary popup props
    secondaryOpen = false,
    onCloseSecondary = () => { },
    fetchDataSecondary = null,
    dataSecondary: providedDataSecondary = null,
    renderSecondaryList = () => null,
    secondaryTitle = 'Chi tiết',

    globalZIndex = 1000
}) {
    // primary state
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    // secondary state
    const [data2, setData2] = useState([]);
    const [loading2, setLoading2] = useState(false);
    const [error2, setError2] = useState('');
    const [mounted2, setMounted2] = useState(false);
    const [visible2, setVisible2] = useState(false);



    // animate in/out helpers
    const animateIn = useCallback((setMount, setVisible) => {
        setMount(true);
        setTimeout(() => { }, 0); // allow mount
        requestAnimationFrame(() => setVisible(true));
    }, []);
    const animateOut = useCallback((setMount, setVisible) => {
        setVisible(false);
        setTimeout(() => setMount(false), ANIMATION_DURATION);
    }, []);

    // primary effect
    useEffect(() => {
        if (open) {

            animateIn(setMounted, setVisible);
            if (providedData) {
                setData(providedData);
            } else if (fetchData) {
                setLoading(true);
                setError('');
                fetchData()
                    .then(res => setData(res))
                    .catch(err => setError(err.message || 'Lỗi tải dữ liệu'))
                    .finally(() => setLoading(false));
            }
        } else if (mounted) {
            animateOut(setMounted, setVisible);
        }
    }, [open, providedData, fetchData, animateIn, animateOut, mounted]);

    // secondary effect
    useEffect(() => {
        if (secondaryOpen) {

            animateIn(setMounted2, setVisible2);
            if (providedDataSecondary) {
                setData2(providedDataSecondary);
            } else if (fetchDataSecondary) {
                setLoading2(true);
                setError2('');
                fetchDataSecondary()
                    .then(res => setData2(res))
                    .catch(err => setError2(err.message || 'Lỗi tải dữ liệu'))
                    .finally(() => setLoading2(false));
            }
        } else if (mounted2) {
            animateOut(setMounted2, setVisible2);
        }
    }, [secondaryOpen, providedDataSecondary, fetchDataSecondary, animateIn, animateOut, mounted2]);

    if (!mounted) return null;

    return (
        <>
            {/* Primary overlay */}
            <div
                className={`${styles.overlay} ${visible ? styles.show : ''}`}
                style={{ zIndex: globalZIndex }}
                onMouseDown={onClose}
            >
                <div
                    className={`${styles.popup} ${visible ? styles.open : ''} ${mounted2 ? styles.shifted : ''
                        }`}
                    style={{ zIndex: globalZIndex }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <h3>{title}</h3>
                        <button onClick={onClose}>&times;</button>
                    </div>
                    <div className={styles.body}>
                        {loading && <Loading content="Đang tải" />}
                        {error && <p className={styles.error}>{error}</p>}
                        {!loading && !error && renderItemList(data)}
                    </div>
                </div>
            </div>

            {/* Secondary overlay */}
            {mounted2 && (
                <div
                    className={`${styles.overlay} ${visible2 ? styles.show : ''}`}
                    style={{ zIndex: globalZIndex }}
                    onMouseDown={onCloseSecondary}
                >
                    <div
                        className={`${styles.popup2} ${visible2 ? styles.open : ''}`}
                        style={{ zIndex: globalZIndex }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className={styles.header}>
                            <h3>{secondaryTitle}</h3>
                            <button onClick={onCloseSecondary}>&times;</button>
                        </div>
                        <div className={styles.body}>
                            {loading2 && <Loading content="Đang tải" />}
                            {error2 && <p className={styles.error}>{error2}</p>}
                            {!loading2 && !error2 && renderSecondaryList(data2)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
