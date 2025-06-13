'use client';

import React, { useState, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import styles from './index.module.css';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { Svg_Canlendar, Svg_Profile, Svg_Student } from '@/components/(icon)/svg';
import { Re_user } from '@/data/users';

const toArr = (v) =>
    Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];

const SummaryBox = ({ title, data }) => (
    <div className={styles.summaryBox}>
        <p className='text_6' style={{ padding: '8px 16px', borderBottom: 'thin solid var(--border-color)' }}>{title}</p>
        <div className={styles.summaryContent}>
            {data.map(item => (
                <div key={item.label} className={styles.summaryItem}>
                    <span className='text_2'>{item.value}</span>
                    <span className='text_7_400'>{item.label}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function DetailStudent({ data: student, course, c, users, studentsx }) {
    Object.assign(student, studentsx.find(i => i.ID === student.ID) || {})
    let TeacherHR = users.find(t => t.name === c.TeacherHR);
    if (!TeacherHR) {
        TeacherHR = users.find(t => t._id === c.TeacherHR);
    }

    const [openMain, setOpenMain] = useState(false);
    const [commentPop, setCommentPop] = useState({ open: false, lessonId: '', comments: [] });
    const [imagePop, setImagePop] = useState({ open: false, lessonId: '', imageId: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, status: false, mes: '', link: '' });

    /* ───────── HELPERS ───────── */
    const parseDMY = useCallback(dmy => {
        if (typeof dmy !== 'string' || !dmy.includes('/')) return null;
        const parts = dmy.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
        return new Date(y, m - 1, d);
    }, []);

    const mapCheckin = useCallback(val => {
        switch (String(val)) {
            case '1': return 'Có mặt';
            case '2': return 'Vắng mặt';
            case '3': return 'Có phép';
            default: return 'Chưa điểm danh';
        }
    }, []);

    /* ───────── DATA PROCESSING ───────── */
    const { rows, summaryStats } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày

        const studentLearnData = student.Learn || {};
        const allLessonsInCourse = toArr(c?.Detail);

        let attendedOfficial = 0, absentExcused = 0, absentUnexcused = 0;
        let attendedMakeup = 0, missedMakeup = 0;
        const topicsToMakeUp = new Set();

        const officialLessons = allLessonsInCourse.filter(les => les.Type !== 'Học bù');

        officialLessons.forEach(officialLesson => {
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === officialLesson._id);
            if (officialLesson.Type === 'Báo nghỉ') {
                topicsToMakeUp.add(officialLesson.Topic);
                return;
            }
            if (learnRecord) {
                if (learnRecord.Checkin === '1') {
                    attendedOfficial++;
                } else if (learnRecord.Checkin === '2') {
                    absentUnexcused++;
                    topicsToMakeUp.add(officialLesson.Topic);
                } else if (learnRecord.Checkin === '3') {
                    absentExcused++;
                    topicsToMakeUp.add(officialLesson.Topic);
                }
            }
        });

        const studentMakeupLessons = course.filter(les => les.Type === 'Học bù');
        studentMakeupLessons.forEach(makeupLesson => {
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === makeupLesson._id);
            if (learnRecord) {
                if (learnRecord.Checkin === '1') {
                    attendedMakeup++;
                } else {
                    missedMakeup++;
                }
            }
        });

        const processedRows = course.map((les, idx) => {
            const lessonDate = parseDMY(les.Day);
            const Status = lessonDate && lessonDate <= today ? 'Đã diễn ra' : 'Chưa diễn ra';
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === les._id) || { Checkin: 0, Cmt: [] };

            return {
                ...les,
                index: idx + 1,
                Status,
                attendance: mapCheckin(learnRecord.Checkin),
                comments: learnRecord.Cmt,
                imagestudent: learnRecord.Image,
                Date: `${les.Time} - ${les.Day}`,
            };
        });

        return {
            rows: processedRows,
            summaryStats: {
                official: {
                    total: officialLessons.length,
                    attended: attendedOfficial,
                    excused: absentExcused,
                    unexcused: absentUnexcused,
                },
                makeupNeeded: {
                    count: topicsToMakeUp.size,
                },
                makeupTaken: {
                    total: studentMakeupLessons.length,
                    attended: attendedMakeup,
                    missed: missedMakeup,
                },
            }
        };
    }, [course, student.Learn, c, parseDMY, mapCheckin]);

    /* ───────── EXPORT EXCEL ───────── */
    const handleExport = async () => {
        try {
            setLoading(true);
            const lessonsPayload = rows.map((r, i) => ({
                Index: i + 1,
                Topic: r.Topic,
                Teacher: r.Teacher,
                Status: r.Status,
                Day: r.Day,
                Time: r.Time,
                Attendance: r.attendance,
                Comments: Array.isArray(r.comments) ? r.comments.join(' | ') : '',
            }));

            const res = await fetch('/api/exportx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherHR: TeacherHR,
                    lessons: lessonsPayload,
                    course: c,
                    student
                }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setToast({ open: true, status: true, mes: 'Xuất Excel thành công!', link: url });
            } else {
                const msg = await res.text();
                setToast({ open: true, status: false, mes: msg || 'Xuất thất bại', link: '' });
            }
        } catch (err) {
            console.error(err);
            setToast({ open: true, status: false, mes: 'Có lỗi khi gọi API', link: '' });
        } finally {
            setLoading(false);
        }
    };

    /* ───────── CELL UI ───────── */
    const Cell = ({ flex, align, header = false, children }) => (
        <div
            style={{ flex, justifyContent: align, fontWeight: header ? 500 : undefined }}
            className={`${styles.cell} text_6_400`}
        >
            {children}
        </div>
    );

    /* ───────── LEGEND ───────── */
    const LegendBlock = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
                ['#e3ffe3', 'var(--green)', 'Có mặt'],
                ['#ffebeb', 'var(--red)', 'Vắng mặt'],
                ['#fffadd', 'var(--yellow)', 'Có phép'],
            ].map(([bg, border, label]) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 16, height: 16, background: bg, border: `thin solid ${border}` }} />
                    <p className="text_6_400">{label}</p>
                </div>
            ))}
        </div>
    );

    /* ───────── ICONS ───────── */
    const MoreIcons = ({ onShowImg, onShowCmt }) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <div className="wrapicon" style={{ background: 'var(--main_d)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onShowImg}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><title>photo_album_fill</title><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M5 3a3 3 0 0 0-3 3v10a2 2 0 0 0 2 2V6a1 1 0 0 1 1-1h14a2 2 0 0 0-2-2zm0 5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11.333a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm15 0H7v7.848L10.848 12a1.25 1.25 0 0 1 1.768 0l3.241 3.24.884-.883a1.25 1.25 0 0 1 1.768 0L20 15.848zm-2 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" /></g></svg>
            </div>
            <div className="wrapicon" style={{ background: 'var(--main_d)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onShowCmt}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><title>chat_1_line</title><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10H4a2 2 0 0 1-2-2v-8C2 6.477 6.477 2 12 2m0 2a8 8 0 0 0-8 8v8h8a8 8 0 1 0 0-16m0 10a1 1 0 0 1 .117 1.993L12 16H9a1 1 0 0 1-.117-1.993L9 14zm3-4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z" /></g></svg>
            </div>
        </div>
    );

    /* ───────── TABLE INSIDE POPUP ───────── */
    const renderItemList = () => (
        <>
            <div style={{ display: 'flex', margin: 16, gap: 16, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className='text_4'>Thông tin khóa học</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                            <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" /></svg>
                        <span className='text_6'>Tên khóa học :</span>
                        <span className="text_6_400">{c.ID}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                        <span className='text_6'>Thời gian học :</span>
                        <span className="text_6_400">{c.TimeStart} - {c.TimeEnd}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                        <span className='text_6'>Chủ nhiệm :</span>
                        <span className="text_6_400">{c.TeacherHR}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                        <span className='text_6'>Số điện thoại :</span>
                        <span className="text_6_400">{users.filter(t => t.name == c.TeacherHR)[0]?.phone}</span>
                    </div>
                </div>
                <div className={styles.summaryContainer}>
                    <SummaryBox
                        title="Buổi học chính thức"
                        data={[
                            { value: summaryStats.official.total, label: 'Tổng buổi' },
                            { value: summaryStats.official.attended, label: 'Đã học' },
                            { value: summaryStats.official.excused, label: 'Vắng (P)' },
                            { value: summaryStats.official.unexcused, label: 'Vắng (K)' },
                        ]}
                    />
                    <SummaryBox
                        title="Chủ đề cần bù"
                        data={[{ value: summaryStats.makeupNeeded.count, label: 'Chủ đề' }]}
                    />
                    <SummaryBox
                        title="Thống kê học bù"
                        data={[
                            { value: summaryStats.makeupTaken.total, label: 'Tổng buổi' },
                            { value: summaryStats.makeupTaken.attended, label: 'Có mặt' },
                            { value: summaryStats.makeupTaken.missed, label: 'Vắng' },
                        ]}
                    />
                </div>
            </div>
            <div className={styles.top}>
                <LegendBlock />
                <div style={{ display: 'flex', gap: 8 }}>
                    <div className={styles.button} style={{ background: 'var(--green)', opacity: loading ? 0.6 : 1 }} onClick={loading ? undefined : handleExport}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M15 5.5a3.5 3.5 0 1 1 .994 2.443L11.67 10.21c.213.555.33 1.16.33 1.79a4.99 4.99 0 0 1-.33 1.79l4.324 2.267a3.5 3.5 0 1 1-.93 1.771l-4.475-2.346a5 5 0 1 1 0-6.963l4.475-2.347A3.524 3.524 0 0 1 15 5.5" /></g></svg>
                        <p className="text_6_400" style={{ color: '#fff' }}>{loading ? 'Đang xuất...' : 'Xuất Excel'}</p>
                    </div>
                </div>
            </div>
            <div className={styles.detailContainer}>
                <div style={{ display: 'flex', background: 'var(--border-color)', padding: '8px 0' }}>
                    {columns.map(col => {
                        const { key: colKey, ...colProps } = col;
                        return (<Cell key={colKey} {...colProps} header>{col.label}</Cell>);
                    })}
                </div>
                {rows.map((row, rowIdx) => {
                    console.log(row);

                    return (
                        <div
                            key={rowIdx}
                            style={{ display: 'flex', borderTop: '1px solid var(--border-color)', alignItems: 'center', background: row.attendance === 'Có mặt' ? '#e3ffe3' : row.attendance === 'Vắng mặt' ? '#ffebeb' : row.attendance === 'Có phép' ? '#fffadd' : 'none' }}
                        >
                            {columns.map(col => {
                                const { key: colKey, ...colProps } = col;
                                if (colKey === 'more') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            <MoreIcons
                                                onShowImg={() => setImagePop({ open: true, lessonId: row.ID, imageId: row.imagestudent })}
                                                onShowCmt={() => setCommentPop({ open: true, lessonId: row.ID, comments: row.comments })}
                                            />
                                        </Cell>
                                    );
                                }
                                if (colKey === 'Topic') {
                                    return (
                                        <div key={colKey} style={{ flex: col.flex }} className={styles.topic}>
                                            <p>{row.Topic}</p>
                                        </div>
                                    );
                                }
                                if (colKey === 'Status') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            <span className={styles.chip} style={{ background: row.Status === 'Đã diễn ra' ? 'var(--green)' : 'var(--red)' }}>
                                                {row.Status}
                                            </span>
                                        </Cell>
                                    );
                                }
                                return (<Cell key={colKey} {...colProps}>{row[colKey]}</Cell>);
                            })}
                        </div>
                    )
                })}
            </div>
        </>
    );
    return (
        <>
            <WrapIcon
                icon={<svg viewBox="0 0 512 512" width="16" height="16" fill="white"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64h-24c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-80c-13.3 0-24-10.7-24-24s10.7-24 24-24Zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64Z" /></svg>}
                content={'Chi tiết'}
                placement={'bottom'}
                style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                click={() => setOpenMain(true)}
            />
            <FlexiblePopup
                open={openMain}
                onClose={() => setOpenMain(false)}
                providedData={[student]}
                renderItemList={renderItemList}
                title={`Học sinh: ${studentsx?.filter(stu => stu.ID === student.ID)[0]?.Name}`}
                width={1300}
            />
            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <Loading content="Đang xuất Excel..." />
                </div>
            )}
            <Noti
                open={toast.open}
                status={toast.status}
                mes={toast.mes}
                onClose={() => setToast({ ...toast, open: false })}
                button={
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                        <button className={styles.button} style={{ marginRight: 8, border: 'none' }} onClick={() => setToast({ ...toast, open: false })}>Thoát</button>
                        <button
                            className={styles.button}
                            style={{ border: 'none', background: 'var(--green)', opacity: toast.link ? 1 : 0.6, cursor: toast.link ? 'pointer' : 'not-allowed' }}
                            disabled={!toast.link}
                            onClick={() => {
                                if (toast.link) window.open(toast.link, '_blank');
                                setToast({ ...toast, open: false });
                            }}
                        > Tải Excel </button>
                    </div>
                }
            />
            <CenterPopup open={commentPop.open} size="lg" onClose={() => setCommentPop({ ...commentPop, open: false })}>
                <Title content={<p>Nhận xét buổi học</p>} click={() => setCommentPop({ ...commentPop, open: false })} />
                <div style={{ padding: 16 }}>
                    {commentPop.comments.length
                        ? commentPop.comments.map((c, i) => <p key={i} className="text_6_400">• {c}</p>)
                        : <p className="text_6_400">Chưa có nhận xét</p>}
                </div>
            </CenterPopup>
            <CenterPopup open={imagePop.open} size="lg" onClose={() => setImagePop({ ...imagePop, open: false })}>
                <Title content={<p>Hình ảnh buổi học</p>} click={() => setImagePop({ ...imagePop, open: false })} />
                <div style={{ padding: 16, textAlign: 'center' }}>
                    {imagePop.imageId
                        ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {imagePop.imageId.map((img, i) => (
                                <img key={i} src={`https://lh3.googleusercontent.com/d/${img.id}`} alt={`Hình ảnh buổi học ${i + 1}`} style={{ width: 'calc(25% - 3/4*8px)', aspectRatio: 1, objectFit: 'cover' }} />
                            ))}
                        </div>
                        : <p className="text_6_400">Chưa có hình ảnh</p>}
                </div>
            </CenterPopup>
        </>
    );
}

const columns = [
    { key: 'Topic', label: 'Tên chủ đề', flex: 2, align: 'start' },
    { key: 'Status', label: 'Trạng thái', flex: 1, align: 'center' },
    { key: 'Teacher', label: 'Giáo viên', flex: 1.5, align: 'start' },
    { key: 'Date', label: 'Thời gian', flex: 1.5, align: 'start' },
    { key: 'attendance', label: 'Điểm danh', flex: .8, align: 'center' },
    { key: 'more', label: 'Thêm', flex: 1, align: 'center' },
];