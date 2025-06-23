'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Re_lesson } from '@/data/course';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import CommentForm from '../formcmt';
import BoxFile from '@/components/(ui)/(box)/file';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';

import styles from './index.module.css';
import ImageUploader from '../formimage';
import StudentCourseImageManager from '../formimages';
import { Svg_Course, Svg_Detail } from '@/components/(icon)/svg';
import Link from 'next/link';
import { set } from 'mongoose';

const updateAttendance = async (courseId, sessionId, attendanceData) => {
    const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, sessionId, attendanceData })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
};

export default function Main({ data }) {
    const { course, session, students } = data;
    const [showComment, setShowComment] = useState(false);
    const [selStu, setSelStu] = useState(null);
    const [att, setAtt] = useState({});
    const [cmts, setCmts] = useState({});

    const [saving, setSaving] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiOK, setNotiOK] = useState(false);
    const [notiMsg, setNotiMsg] = useState('');

    const router = useRouter();

    const roll = (students || []).map(stu => {
        return {
            ID: stu.ID,
            Name: stu.Name,
            Image: stu.attendance?.Image ?? [],
            Checkin: stu.attendance?.Checkin,
            originalComment: stu.attendance?.Cmt ?? [],
        };
    });

    const cur = s => (att[s.ID] !== undefined ? att[s.ID] : s.Checkin);


    const cm = roll.filter(s => cur(s) == '1').length;
    const vk = roll.filter(s => cur(s) == '2').length;
    const vc = roll.filter(s => cur(s) == '3').length;

    /* handler */
    const changeAtt = (id, v) => setAtt(prev => ({ ...prev, [id]: v }));

    const saveComment = arr => {
        if (selStu) setCmts(p => ({ ...p, [selStu.ID]: arr }));
        setShowComment(false);
        setSelStu(null);
    };

    const buildPayload = () => {
        const arr = [];
        Object.keys(att).forEach(id =>
            arr.push({ studentId: id, checkin: att[id], comment: cmts[id] })
        );
        Object.keys(cmts).forEach(id => {
            if (!arr.find(i => i.studentId === id)) {
                const stu = roll.find(s => s.ID === id);
                if (stu) arr.push({ studentId: id, checkin: stu.Checkin, comment: cmts[id] });
            }
        });
        return arr;
    };

    const saveAll = async () => {
        const payload = buildPayload();
        if (!payload.length) {
            setNotiOK(false); setNotiMsg('Không có thay đổi nào để lưu!'); setNotiOpen(true); return;
        }

        setSaving(true);
        try {
            const res = await updateAttendance(course._id, session._id, payload);
            setNotiOK(res.status === 2);
            setNotiMsg(res.mes || (res.status === 2 ? 'Lưu thành công!' : 'Lưu thất bại!'));

            if (res.status === 2) {
                setAtt({}); setCmts({});
                await Re_lesson(session._id);
                router.refresh();
            }
        } catch {
            setNotiOK(false); setNotiMsg('Có lỗi xảy ra khi gọi API!');
        } finally {
            setSaving(false); setNotiOpen(true);
        }
    };

    const notiBtn = (
        <button
            onClick={() => setNotiOpen(false)}
            style={{
                alignSelf: 'flex-start', padding: '10px 26px', border: 'none', borderRadius: 6,
                background: 'var(--main_d)', color: '#fff', fontWeight: 500, cursor: 'pointer',
                transition: 'opacity .25s', width: '100%'
            }}
        >
            Tắt thông báo
        </button>
    );

    const reloadData = async () => {
        setSaving(true);
        await Re_lesson(data.session._id);
        router.refresh();
        setSaving(false);
    }


    return (
        <>
            {saving && (
                <div className={styles.loading}>
                    <Loading content="Đang lưu điểm danh…" />
                </div>
            )}

            <Noti open={notiOpen} onClose={() => setNotiOpen(false)}
                status={notiOK} mes={notiMsg} button={notiBtn} />

            <div className={styles.root}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <p className="text_3" style={{ color: '#fff' }}>
                            {course.ID ?? '-'} – Chủ đề: {session.Topic.Name ?? '-'}
                        </p>
                        <Link href={`/course/${course.ID}`} className='btn' style={{ background: 'white', margin: '0' }}>
                            <Svg_Detail w={16} h={16} c={'var(--main_d)'} />
                            <p className='text_6_400'>Chi tiết khóa học</p>
                        </Link>
                    </div>
                    <div className={styles.statsContainer}>

                        <div className={`${styles.statBox} ${styles.present}`}>Có mặt: {cm}</div>
                        <div className={`${styles.statBox} ${styles.absent}`}>Vắng không phép: {vk}</div>
                        <div className={`${styles.statBox} ${styles.excused}`}>Vắng có phép: {vc}</div>
                    </div>
                </header>

                {/* Body */}
                <div className={styles.content}>
                    <aside className={styles.sidebar}>
                        <p className="text_4">Tài liệu buổi học</p>
                        {course.Version == 0 ? <>
                            <BoxFile type="Image" name="Hình ảnh buổi học" href={`https://drive.google.com/drive/folders/${session.Image}`} />
                        </> : <ImageUploader session={session} courseId={course.ID} />}
                        {session.Topic?.Slide && <BoxFile type="Ppt" name="Slide giảng dạy" href={session.Topic.Slide} />}
                    </aside>

                    <main className={styles.main}>
                        <p className="text_4" style={{ marginBottom: 16 }}>Thông tin buổi học</p>

                        <section className={styles.infoSection}>
                            <div className={styles.infoHeader}>
                                <div>Thời gian: <span className={styles.infoValue}>{session.Time}</span></div>
                                <div>Giáo viên: <span className={styles.infoValue}>{session.Teacher.name}</span></div>
                                <div>Trợ giảng: <span className={styles.infoValue}>{session.TeachingAs?.name || '–'}</span></div>
                            </div>

                            <div className={styles.divider} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <p className="text_4">Sổ điểm danh</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={reloadData}
                                        disabled={saving}
                                        className="text_6_400"
                                        style={{
                                            padding: '8px 16px',
                                            background: saving ? 'var(--text-disabled)' : 'var(--green)',
                                            color: '#fff', border: 'none', borderRadius: 5,
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        {saving && <span className={styles.spinner} />}
                                        {saving ? 'Đang tải lại…' : 'Tải lại dữ liệu '}
                                    </button>
                                    <button
                                        onClick={saveAll}
                                        disabled={saving}
                                        className="text_6_400"
                                        style={{
                                            padding: '8px 16px',
                                            background: saving ? 'var(--text-disabled)' : 'var(--green)',
                                            color: '#fff', border: 'none', borderRadius: 5,
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8
                                        }}
                                    >
                                        {saving && <span className={styles.spinner} />}
                                        {saving ? 'Đang lưu…' : 'Lưu tất cả thay đổi'}
                                    </button>
                                </div>
                            </div>

                            {roll.length ? (
                                <>
                                    <div className={`${styles.row} ${styles.headerRow}`}>
                                        {['ID', 'Học sinh', 'Có mặt', 'Vắng mặt', 'Có phép', 'Nhận xét'].map((t, i) => (
                                            <div key={t} className="text_6_400"
                                                style={{
                                                    flex: i === 1 ? 3 : 1, color: '#fff',
                                                    padding: i <= 1 ? 8 : '8px 0',
                                                    textAlign: i <= 1 ? 'left' : 'center'
                                                }}>
                                                {t}
                                            </div>
                                        ))}
                                        {course.Version != 0 && (
                                            <div className="text_6_400"
                                                style={{
                                                    flex: 1,
                                                    color: '#fff',
                                                    padding: '8px 0',
                                                    textAlign: 'center'
                                                }}>
                                                Hình ảnh
                                            </div>
                                        )}
                                    </div>

                                    {roll.map(stu => {
                                        if (stu.Checkin == '-1') return null;
                                        const c = cur(stu);
                                        console.log(c);

                                        return (
                                            <div key={stu.ID} className={styles.row}
                                                style={{ borderBottom: '1px solid #e9ecef', background: '#fff' }}>
                                                <div className="text_6_400" style={{ flex: 1, padding: '12px 8px', fontWeight: 500 }}>{stu.ID}</div>
                                                <div className="text_6_400" style={{ flex: 3, padding: '12px 8px', fontWeight: 500 }}>{stu.Name}</div>

                                                <div style={{ flex: 3, display: 'flex', alignItems: 'center' }}>
                                                    {['1', '2', '3'].map(v => (
                                                        <label key={v} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '16px 0', cursor: 'pointer' }}>
                                                            <input type="radio" name={`att_${stu.ID}`} value={v}
                                                                checked={c == v}
                                                                onChange={() => changeAtt(stu.ID, v)}
                                                                style={{ transform: 'scale(1.1)', cursor: 'pointer' }} />
                                                        </label>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => { setSelStu(stu); setShowComment(true); }}
                                                    style={{
                                                        flex: 1, display: 'flex', justifyContent: 'center', padding: 0,
                                                        alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer'
                                                    }}>
                                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--text-primary)">
                                                        <path d="M14 11c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h9c.55 0 1-.45 1 1M3 7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1m7 8c0-.55-.45 1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1m8.01-2.13.71-.71c.39-.39 1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71-5.16 5.16c-.09.09-.14.21-.14.35v1.41c0 .28.22.5.5.5h1.41c.13 0 .26-.05.35-.15l5.16-5.16z" />
                                                    </svg>
                                                </button>

                                                {course.Version != 0 && (
                                                    <StudentCourseImageManager courseInfo={data.session} studentInfo={stu} course={data.course} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className={styles.noData}><p>Không có học sinh tham gia khóa học</p></div>
                            )}
                        </section>
                    </main>
                </div>

                <CenterPopup
                    open={showComment}
                    onClose={() => setShowComment(false)}
                    size="lg"
                >
                    <CommentForm
                        student={selStu}
                        initialComment={selStu ? cmts[selStu.ID] || selStu.originalComment : []}
                        onSave={saveComment}
                        onCancel={() => setShowComment(false)}
                    />
                </CenterPopup>
            </div>
        </>
    );
}
