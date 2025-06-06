'use client';

import React, { useState, useEffect } from 'react';
import FlexiblePopup from '@/components/(popup)/popup_right';
import { Read_Area } from '@/data/area';
import WrapIcon from '@/components/(button)/hoveIcon';
import Noti from '@/components/(noti)/noti';
import Menu from '@/components/(button)/menu';
import Loading from '@/components/(loading)/loading';
import { Data_user } from '@/data/users';
import styles from './index.module.css';
import { useRouter } from 'next/navigation';
import { Data_Course_One, Re_course_one } from '@/data/course';
import TextNoti from '@/components/(noti)/textnoti';

export default function Calendar({ course }) {
    const router = useRouter();

    /* giữ khóa học trong state để có thể cập nhật */
    const [curCourse, setCurCourse] = useState(course);

    const [open, setOpen] = useState(false);
    const [editPop, setEditPop] = useState({ open: false, lesson: null });
    const [cancelPop, setCancelPop] = useState({ open: false, lesson: null });
    const [toast, setToast] = useState({ open: false, status: false, mes: '' });

    /* ---------------- Bảng lịch chính ---------------- */
    const renderSchedule = () => (
        <>
            {/* thanh công cụ nhỏ */}
            <div className={styles.top}>
                <button className={'btn'} style={{ background: 'var(--green)' }}>
                    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='white' viewBox='0 0 24 24'><title>calendar_add_fill</title><g id="calendar_add_fill" fill='none'><path d='M24 0v24H0V0zM12.594 23.258l-.012.002-.071.035-.02.004-.014-.004-.071-.036c-.01-.003-.019 0-.024.006l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113-.014.002-.184.093-.01.01-.003.011.018.43.005.012.008.008.201.092c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.003-.011.018-.43-.003-.012-.01-.01z' /><path fill='white' d='M7 4a1 1 0 0 1 2 0v1h6V4a1 1 0 1 1 2 0v1h2a2 2 0 0 1 2 2v3H3V7a2 2 0 0 1 2-2h2zm11 10a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2h-2a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1m0-2a3.001 3.001 0 0 0-2.836 2.018 1.9 1.9 0 0 1-1.146 1.146 3.001 3.001 0 0 0-.174 5.605l.174.067c.12.041.236.097.346.164H5a2 2 0 0 1-2-2v-7z' /></g>
                    </svg>
                    Thêm buổi học
                </button>
            </div>

            {/* bảng */}
            <div className={styles.detailContainer}>
                <div className={styles.rowHead}>
                    {cols.map((c, i) => { const { key, ...rest } = c; return <Cell key={i} {...rest} header>{c.label}</Cell>; })}
                </div>

                {curCourse.Detail.map((row, idx) => (
                    <div key={idx} className={styles.row}>
                        {cols.map(({ key, ...rest }) =>
                            key === 'more' ? (
                                <Cell key="more" {...rest}>
                                    <MoreIcons
                                        onEdit={() => setEditPop({ open: true, lesson: row })}
                                        onDelete={() => setCancelPop({ open: true, lesson: row })}
                                    />
                                </Cell>
                            ) : (
                                <Cell key={key} {...rest}>{row[key]}</Cell>
                            )
                        )}
                    </div>
                ))}
            </div>
        </>
    );

    /* ---------------- JSX ---------------- */
    return (
        <>
            {/* nút mở popup lịch */}
            <div className={styles.trigger} onClick={() => setOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18">
                    <path fill="currentColor" d="M96 32v32H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48h-48V32a32 32 0 1 0-64 0v32H160V32a32 32 0 1 0-64 0zM448 192H0v272c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192z" />
                </svg>
                <p className="text_7">Lịch học</p>
            </div>

            {/* popup lịch */}
            <FlexiblePopup
                open={open}
                onClose={() => setOpen(false)}
                title={`Lịch học - ${curCourse.ID}`}
                width={1200}
                renderItemList={renderSchedule}
                providedData={[curCourse]}
            />

            {/* popup chỉnh sửa */}
            <FlexiblePopup
                open={editPop.open}
                onClose={() => setEditPop({ open: false, lesson: null })}
                title="Chỉnh sửa buổi học"
                width={600}
                renderItemList={() =>
                    editPop.lesson && (
                        <EditLessonForm
                            course={curCourse}
                            lesson={editPop.lesson}
                            onDone={async (updatedForm, ok, mes) => {
                                await Re_course_one(course.ID);
                                const freshCourse = await Data_Course_One(course.ID);
                                if (freshCourse) setCurCourse(freshCourse);
                                router.refresh();
                                setToast({ open: true, status: ok, mes });
                                setEditPop({ open: false, lesson: null });
                            }}
                            onCancel={() => setEditPop({ open: false, lesson: null })}
                        />
                    )
                }
            />

            {/* popup báo nghỉ */}
            <FlexiblePopup
                open={cancelPop.open}
                onClose={() => setCancelPop({ open: false, lesson: null })}
                title="Báo nghỉ buổi học"
                width={420}
                renderItemList={() =>
                    cancelPop.lesson && (
                        <CancelLessonForm
                            lesson={cancelPop.lesson}
                            onCancel={() => setCancelPop({ open: false, lesson: null })}
                            onConfirm={reason => {
                                setToast({ open: true, status: true, mes: `Đã báo nghỉ: ${reason || 'Không lý do'}` });
                                setCancelPop({ open: false, lesson: null });
                            }}
                        />
                    )
                }
            />

            {/* toast */}
            <Noti
                open={toast.open}
                status={toast.status}
                mes={toast.mes}
                onClose={() => setToast({ ...toast, open: false })}
                button={
                    <button
                        className="btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setToast({ ...toast, open: false })}
                    >
                        Tắt thông báo
                    </button>
                }
            />
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Table utilities                                                   */
/* ─────────────────────────────────────────────────────────────────── */
const cols = [
    { key: 'Day', label: 'Ngày', flex: .6, align: 'left' },
    { key: 'Time', label: 'Giờ', flex: .6, align: 'left' },
    { key: 'Topic', label: 'Chủ đề', flex: 2, align: 'left' },
    { key: 'Room', label: 'Phòng', flex: .7, align: 'left' },
    { key: 'Teacher', label: 'Giáo viên', flex: 1.2, align: 'left' },
    { key: 'more', label: 'H.động', flex: 1, align: 'center' },
];

const Cell = ({ flex, align, header, children }) => (
    <div
        style={{ flex, justifyContent: align, fontWeight: header ? 600 : 400 }}
        className={`${styles.cell} text_6_400`}
    >
        {children}
    </div>
);

const MoreIcons = ({ onEdit, onDelete }) => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <WrapIcon
            icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>}
            content="Sửa lịch học"
            placement="bottom"
            style={{ background: 'var(--yellow)' }}
            click={onEdit}
        />
        <WrapIcon
            icon={<svg viewBox="0 0 448 512" width="14" height="14" fill="#fff"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 280 0H168a24 24 0 0 0-22.6 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h16l21.2 339a48 48 0 0 0 47.9 45h243.6a48 48 0 0 0 47.9-45L416 96h16a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" /></svg>}
            content="Báo nghỉ"
            placement="bottom"
            style={{ background: 'var(--red)' }}
            click={onDelete}
        />
    </div>
);

function EditLessonForm({ lesson, course, onDone, onCancel }) {
    const [form, setForm] = useState({ ...lesson });

    /* ------ states chọn GV / phòng ------ */
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [loadingT, setLoadingT] = useState(true);
    const [loadingR, setLoadingR] = useState(true);

    const [openTeacher, setOpenTeacher] = useState(false);
    const [openAssist, setOpenAssist] = useState(false);
    const [openRoom, setOpenRoom] = useState(false);

    /* ------ loading khi gọi API ------ */
    const [saving, setSaving] = useState(false);

    /* fetch */
    useEffect(() => {
        let mounted = true;

        Data_user()
            .then(res => {
                const list = Array.isArray(res) ? res : res.data || [];
                mounted && setTeachers(list.map(u => u.name));
            })
            .finally(() => mounted && setLoadingT(false));

        Read_Area()
            .then(res => {
                const list = Array.isArray(res) ? res : res.data || [];
                const area = list.find(a => a.name === course.Area);
                mounted && setRooms(area ? area.room : []);
            })
            .finally(() => mounted && setLoadingR(false));

        return () => { mounted = false; };
    }, []);

    /* ---------- menu definitions ---------- */
    const teacherMenu = loadingT ? (
        <div className={styles.list_menuwrap}><Loading content="đang tải..." /></div>
    ) : teachers.length === 0 ? (
        <div className={styles.list_menuwrap}><div style={{ padding: 12 }}>Chưa có GV</div></div>
    ) : (
        <div className={styles.list_menuwrap}>
            {teachers.map((t, i) => (
                <p key={i} className="text_6_400" onClick={() => {
                    setForm({ ...form, Teacher: t });
                    setOpenTeacher(false);
                }}>{t}</p>
            ))}
        </div>
    );

    const assistMenu = loadingT ? (
        <div className={styles.list_menuwrap}><Loading content="đang tải..." /></div>
    ) : (
        <div className={styles.list_menuwrap}>
            <p className="text_6_400" onClick={() => {
                setForm({ ...form, TeachingAs: '' });
                setOpenAssist(false);
            }}>— Không chọn —</p>
            {teachers.map((t, i) => (
                <p key={i} className="text_6_400" onClick={() => {
                    setForm({ ...form, TeachingAs: t });
                    setOpenAssist(false);
                }}>{t}</p>
            ))}
        </div>
    );

    const roomMenu = loadingR ? (
        <div className={styles.list_menuwrap}><Loading content="đang tải..." /></div>
    ) : rooms.length === 0 ? (
        <div className={styles.list_menuwrap}><div style={{ padding: 12 }}>Chưa có phòng</div></div>
    ) : (
        <div className={styles.list_menuwrap}>
            {rooms.map((r, i) => (
                <p key={i} className="text_6_400" onClick={() => {
                    setForm({ ...form, Room: r });
                    setOpenRoom(false);
                }}>{r}</p>
            ))}
        </div>
    );

    /* ---------- gọi API ---------- */
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course._id,
                    detailId: lesson.ID,
                    data: {
                        Teacher: form.Teacher,
                        TeachingAs: form.TeachingAs,
                        Room: form.Room,
                    },
                }),
            });

            const json = await res.json();
            if (res.ok && json.status === 2) {
                onDone(form, true, json.mes || 'Đã lưu thay đổi');
            } else {
                onDone(form, false, json.mes || 'Lưu thất bại');
            }
        } catch (err) {
            onDone(form, false, 'Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    };

    /* ---------- JSX ---------- */
    return (
        <>
            {/* overlay loading khi gọi API */}
            {saving && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2500 }}>
                    <Loading content="Đang cập nhật..." />
                </div>
            )}

            <div className={styles.editForm}>
                <p className="text_6_400"><strong>Chủ đề</strong>: {form.Topic}</p>
                <p className="text_6_400"><strong>Thời gian</strong>: {form.Time} – {form.Day}</p>

                {/* GV chính */}
                <p className="text_6">Giáo viên giảng dạy</p>
                <Menu
                    menuItems={teacherMenu}
                    menuPosition="bottom"
                    isOpen={openTeacher}
                    onOpenChange={setOpenTeacher}
                    customButton={
                        <button className={styles.selectBtn} style={{ textAlign: 'start' }}>
                            <p className="text_6_400">
                                {form.Teacher || lesson.Teacher || 'Chọn GV'}
                            </p>
                        </button>
                    }
                />

                {/* Trợ giảng */}
                <p className="text_6" style={{ marginTop: 8 }}>Trợ giảng</p>
                <Menu
                    menuItems={assistMenu}
                    menuPosition="bottom"
                    isOpen={openAssist}
                    onOpenChange={setOpenAssist}
                    customButton={
                        <button className={styles.selectBtn} style={{ textAlign: 'start' }}>
                            <p className="text_6_400">
                                {(form.TeachingAs || lesson.TeachingAs || '').trim() || 'Không có giáo viên trợ giảng'}
                            </p>
                        </button>
                    }
                />

                {/* Phòng */}
                <p className="text_6" style={{ marginTop: 8 }}>Phòng học</p>
                <Menu
                    menuItems={roomMenu}
                    menuPosition="bottom"
                    isOpen={openRoom}
                    onOpenChange={setOpenRoom}
                    customButton={
                        <button className={styles.selectBtn} style={{ textAlign: 'start' }}>
                            <p className="text_6_400">
                                {form.Room || lesson.Room || 'Chọn phòng'}
                            </p>
                        </button>
                    }
                />
            </div>

            <div className={styles.btnRow}>
                <button onClick={onCancel} className="btn" style={{ borderRadius: 5, background: 'var(--border-color)' }}>
                    <p className="text_6_400">Huỷ bỏ</p>
                </button>
                <button onClick={handleSave} className="btn" style={{ borderRadius: 5, background: 'var(--green)' }}>
                    <p className="text_6_400" style={{ color: '#fff' }}>Lưu thông tin</p>
                </button>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  CancelLessonForm                                                  */
/* ─────────────────────────────────────────────────────────────────── */
function CancelLessonForm({ lesson, onCancel, onConfirm }) {
    const [reason, setReason] = useState('');
    return (
        <div className={styles.cancelBox}>
            <TextNoti mes='Báo nghỉ lớp học sẽ cần lý do để thông báo cho phụ huynh và buổi học sẽ được bù vào một thời gian khác.' title='Báo nghỉ lớp học' color='blue' />
            <textarea
                className={styles.textarea}
                placeholder="Lý do (tuỳ chọn)"
                value={reason}
                onChange={e => setReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginTop: 12 }}>
                <button onClick={() => onConfirm(reason)} className='btn' style={{ gap: 4, background: 'var(--green)' }}>
                    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'><title>send_fill</title><g id="send_fill" fill='none'><path d='M24 0v24H0V0zM12.594 23.258l-.012.002-.071.035-.02.004-.014-.004-.071-.036c-.01-.003-.019 0-.024.006l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113-.014.002-.184.093-.01.01-.003.011.018.43.005.012.008.008.201.092c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.003-.011.018-.43-.003-.012-.01-.01z' /><path fill='white' d='M20.235 5.686c.432-1.195-.726-2.353-1.921-1.92L3.709 9.048c-1.199.434-1.344 2.07-.241 2.709l4.662 2.699 4.163-4.163a1 1 0 0 1 1.414 1.414L9.544 15.87l2.7 4.662c.638 1.103 2.274.957 2.708-.241z' /></g>
                    </svg>
                    Gửi thông báo
                </button>
                <button onClick={() => onConfirm(reason)} className='btn' style={{ gap: 4, background: 'var(--red)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={15} height={15} fill='white'><path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zM305 305c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47z" /></svg>
                    Báo nghỉ
                </button>
            </div>
        </div>
    );
}
