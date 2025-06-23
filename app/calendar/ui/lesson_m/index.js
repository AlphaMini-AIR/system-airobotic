// Lesson_m.jsx
'use client';

import React, { useState, useEffect } from 'react';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Loading from '@/components/(ui)/(loading)/loading';
import styles from './index.module.css';
import Title from '@/components/(features)/(popup)/title';
import BoxFile from '@/components/(ui)/(box)/file';

export default function Lesson_m({ time, topic, courseID, room, id, type }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);

    const chipClass =
        (room === 'Lab_B304' || room === 'T&A' || room === 'B304') ? styles.chipBienHoa :
            (room === 'AI Robotic') ? styles.chipLongKhanh :
                styles.chipLongThanh;

    const locationName =
        (room === 'Lab_B304' || room === 'T&A' || room === 'B304') ? 'Biên Hòa' :
            (room === 'AI Robotic') ? 'Long Khánh' :
                'Long Thành';

    useEffect(() => {
        if (!open || !id) return;

        setLoading(true);
        setError(null);
        setDetail(null);

        fetch(`/api/calendar/${id}`)
            .then(res => {
                if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (!json.success) throw new Error(json.error || 'Lỗi không xác định');
                setDetail(json.data);
            })
            .catch(err => {
                console.error(err);
                setError('Không tải được dữ liệu chi tiết.');
            })
            .finally(() => setLoading(false));
    }, [open, id]);

    const handleClose = () => setOpen(false);

    return (
        <>
            <div className={styles.hoverShadow} onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
                <div className={styles.time}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="var(--text-primary)">
                        <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                    </svg>
                    {time}
                </div>
                <div className={styles.topicContainer}>
                    <div className={styles.dot} />
                    <span className={styles.topicLabel}>Chủ đề:</span> {topic?.Name || 'Không có chủ đề'} - Lớp: {courseID}
                </div>
                <div className={styles.room}>
                    <p className={`${styles.chip} ${chipClass}`}>{locationName}</p>
                </div>
            </div>

            <CenterPopup open={open} onClose={handleClose} size="md" globalZIndex={1000}>
                {(loading || !detail) && !error && (
                    <div style={{ height: 400 }}>
                        <Title content={'Lớp ...'} click={handleClose} />
                        <Loading content={'Đang tải dữ liệu'} />
                    </div>
                )}
                {error && <div style={{ padding: '1rem', color: 'red' }}>{error}</div>}
                {!loading && detail && (
                    <>
                        <Title content={`Lớp: ${detail.course.ID}`} click={handleClose} />
                        <div className={`Lớp ${styles.popup_container}`}>
                            <p className='text_4'>Thông tin buổi học</p>
                            <div className={styles.popup_box}>
                                <p className='text_6' style={{ padding: 4 }}>Chủ đề: <span style={{ fontWeight: 400 }}>{detail.session.Topic?.Name || '-'}</span></p>
                                <p className='text_6' style={{ padding: 4 }}>Giáo viên: <span style={{ fontWeight: 400 }}>{detail.session.Teacher?.name || '-'}</span></p>
                                <p className='text_6' style={{ padding: 4 }}>Trợ giảng: <span style={{ fontWeight: 400 }}>{detail.session.TeachingAs?.name || '-'}</span></p>
                                <p className='text_6' style={{ padding: 4 }}>Thời gian: <span style={{ fontWeight: 400 }}>{detail.session.Time || '-'}</span></p>
                                <p className='text_6' style={{ padding: 4 }}>Phòng học: <span style={{ fontWeight: 400 }}>{detail.session.Room || '-'}</span></p>
                            </div>

                            <p className='text_4'>Thông tin học sinh (sĩ số: {detail.students.length})</p>
                            <div className={styles.popup_box}>
                                {detail.students.length > 0 ? (
                                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                                        {detail.students.map(student => (
                                            <div key={student._id} className='text_6_400' style={{ padding: '6px 4px', display: 'flex', justifyContent: 'space-between' }}>
                                                <p>{student.Name || student.ID}</p>
                                                <p>
                                                    {student.attendance.Checkin === 1 ? 'Có mặt' :
                                                        student.attendance.Checkin === 2 ? 'Xin nghỉ' :
                                                            type ? 'Chưa điểm danh' : 'Vắng mặt'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className='text_6_400' style={{ padding: '6px 4px' }}>Không có học sinh nào</p>}
                            </div>

                            <p className='text_4' style={{ padding: '8px 0' }}>Tài nguyên buổi học</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {detail.session.image &&
                                    <BoxFile type={'Image'} name='Hình ảnh' href={`https://drive.google.com/drive/folders/${detail.session.image}`} />
                                }
                                {detail.session.Topic?.Slide &&
                                    <div style={{ width: 150 }}>
                                        <BoxFile type={'Ppt'} name='Slide giảng dạy' href={detail.session.Topic.Slide} />
                                    </div>
                                }
                            </div>
                        </div>
                    </>
                )}
            </CenterPopup>
        </>
    );
}