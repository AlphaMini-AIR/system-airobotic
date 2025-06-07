'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(popup)/popup_right';
import { Read_Area } from '@/data/area';
import { Data_user, Re_user } from '@/data/users';
import { Data_book } from '@/data/book';
import { Data_Course_One, Re_course_one } from '@/data/course';
import WrapIcon from '@/components/(button)/hoveIcon';
import Noti from '@/components/(noti)/noti';
import Menu from '@/components/(button)/menu';
import Loading from '@/components/(loading)/loading';
import TextNoti from '@/components/(noti)/textnoti';
import { useRouter } from 'next/navigation';
import styles from './index.module.css';

const toArr = v =>
    Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];

const Cell = React.memo(({ flex, align, header, children }) => (
    <div style={{ flex, justifyContent: align, fontWeight: header ? 600 : 400 }} className={`${styles.cell} text_6_400`}>
        {children}
    </div>
));

const MoreIcons = React.memo(({ onEdit, onDelete, onDetail, isCancelled, onCreateMakeup }) => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <WrapIcon
            icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>}
            content="Sửa lịch học"
            placement="bottom"
            style={{ background: 'var(--yellow)' }}
            click={onEdit}
        />
        {isCancelled ? (
            <WrapIcon
                icon={<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'><path fill='#FFFFFFFF' d='M16 3a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v5.528A6 6 0 0 0 12.528 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V4a1 1 0 0 1 2 0v1h6V4a1 1 0 0 1 1-1m1 10a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 1.5a1 1 0 0 0-.993.883L16 15.5V17a1 1 0 0 0 .883.993L17 18h1a1 1 0 0 0 .117-1.993L18 16v-.5a1 1 0 0 0-1-1M8.5 14H8a1 1 0 1 0 0 2h.5a1 1 0 1 0 0-2m2.5-4H8a1 1 0 0 0-.117 1.993L8 12h3a1 1 0 0 0 .117-1.993z' /></svg>}
                content="Tạo buổi bù"
                placement="bottom"
                style={{ background: 'var(--green)' }}
                click={onCreateMakeup}
            />
        ) : (
            <WrapIcon
                icon={<svg viewBox="0 0 448 512" width="14" height="14" fill="#fff"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 280 0H168a24 24 0 0 0-22.6 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h16l21.2 339a48 48 0 0 0 47.9 45h243.6a48 48 0 0 0 47.9-45L416 96h16a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" /></svg>}
                content="Báo nghỉ"
                placement="bottom"
                style={{ background: 'var(--red)' }}
                click={onDelete}
            />
        )}
        <WrapIcon
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="#fff"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>}
            content="Chi tiết học sinh"
            placement="bottom"
            style={{ background: 'var(--main_d)' }}
            click={onDetail}
        />
    </div>
));

const StudentListForLesson = React.memo(({ lesson, allStudentsInCourse }) => {
    const studentIdsInLesson = useMemo(() => toArr(lesson.Students), [lesson.Students]);
    const studentsToShow = useMemo(() => {
        if (!studentIdsInLesson.length) return [];
        return allStudentsInCourse.filter(student => studentIdsInLesson.includes(student.ID));
    }, [studentIdsInLesson, allStudentsInCourse]);
    if (studentsToShow.length === 0) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Không có học sinh nào trong buổi học này.</div>;
    }
    return (
        <div style={{ padding: '8px' }}>
            {studentsToShow.map(student => (
                <div key={student.ID} className={styles.studentRow}>
                    <p className='text_6_400'>{student.ID}</p>
                    <p className='text_6_400'>{student.Name}</p>
                </div>
            ))}
        </div>
    );
});

const ListMenu = React.memo(({ arr, loading, empty, onPick }) => {
    const body = useMemo(() => {
        if (loading) return <Loading content="đang tải..." />;
        const data = toArr(arr);
        if (data.length === 0) return <div style={{ padding: 12 }}>{empty}</div>;
        return data.map((v, i) => (
            <p key={i} className="text_6_400" onClick={() => onPick(v)}>{v}</p>
        ));
    }, [arr, loading, empty, onPick]);
    return <div className={styles.list_menuwrap}>{body}</div>;
});

const cols = [
    { key: 'Day', label: 'Ngày', flex: 0.6, align: 'left' },
    { key: 'Time', label: 'Giờ', flex: 0.6, align: 'left' },
    { key: 'Topic', label: 'Chủ đề', flex: 2, align: 'left' },
    { key: 'Room', label: 'Phòng', flex: 0.7, align: 'left' },
    { key: 'Teacher', label: 'Giáo viên', flex: 1.2, align: 'left' },
    { key: 'Type', label: 'Trạng thái', flex: 0.8, align: 'center' },
    { key: 'Students', label: 'Sỉ số', flex: 0.8, align: 'center' },
    { key: 'more', label: 'Hành động', flex: 1, align: 'center' }
];

const ScheduleTable = React.memo(({ course, onEdit, onDelete, onShowStudents, onCreateMakeup }) => (
    <div className={styles.detailContainer}>
        <div className={styles.rowHead}>
            {cols.map(({ key, ...rest }, i) => (
                <Cell key={i} {...rest} header>{rest.label}</Cell>
            ))}
        </div>
        {toArr(course.Detail).map((row) => (
            <div
                key={row._id}
                className={styles.row}
                style={{ background: row.Type === 'Học bù' ? '#fffadd' : row.Type === 'Báo nghỉ' ? '#ffe6e6' : 'transparent' }}
            >
                {cols.map(({ key, ...rest }) => {
                    switch (key) {
                        case 'more':
                            return (
                                <Cell key="more" {...rest}>
                                    <MoreIcons
                                        onEdit={() => onEdit(row)}
                                        onDelete={() => onDelete(row)}
                                        onDetail={() => onShowStudents(row)}
                                        onCreateMakeup={() => onCreateMakeup(row)}
                                        isCancelled={row.Type === 'Báo nghỉ'}
                                    />
                                </Cell>
                            );
                        case 'Type':
                            return (
                                <Cell key={key} {...rest}>
                                    <span className='text_7' style={{
                                        padding: '4px 16px', borderRadius: '12px',
                                        background: row.Type === 'Học bù' ? 'var(--yellow)' : row.Type === 'Báo nghỉ' ? 'var(--red)' : 'var(--green)', color: 'white'
                                    }}>
                                        {row.Type || 'Chính thức'}
                                    </span>
                                </Cell>
                            );
                        case 'Students':
                            return (
                                <Cell key={key} {...rest}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span>{toArr(row.Students).length} Học sinh</span>
                                    </div>
                                </Cell>
                            );
                        default:
                            return <Cell key={key} {...rest}>{row[key]}</Cell>;
                    }
                })}
            </div>
        ))}
    </div>
));

const MakeupLessonForm = React.memo(({ course, onDone, initialStudents = [] }) => {
    const [form, setForm] = useState({ Topic: '', Day: '', Start: '', Lesson: 1, Time: '', Teacher: '', TeachingAs: '', Room: '', Students: initialStudents });
    const [topics, setTopics] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loadingTopic, setLoadingTopic] = useState(true);
    const [loadingT, setLoadingT] = useState(true);
    const [loadingR, setLoadingR] = useState(true);
    const [openTopic, setOpenTopic] = useState(false);
    const [openTeacher, setOpenTeacher] = useState(false);
    const [openAssist, setOpenAssist] = useState(false);
    const [openRoom, setOpenRoom] = useState(false);
    const [saving, setSaving] = useState(false);

    const isStudentListLocked = useMemo(() => initialStudents && initialStudents.length > 0, [initialStudents]);

    useEffect(() => {
        let mounted = true;
        Data_book().then(res => { if (!mounted) return; const prog = toArr(res?.data ?? res).find(p => p.Name === course.Name); setTopics(prog?.Topic); }).finally(() => mounted && setLoadingTopic(false));
        Data_user().then(res => { if (mounted) setTeachers(toArr(res?.data ?? res).map(u => u.name)); }).finally(() => mounted && setLoadingT(false));
        Read_Area().then(res => { if (!mounted) return; const area = toArr(res?.data ?? res).find(a => a.name === course.Area); setRooms(toArr(area?.room)); }).finally(() => mounted && setLoadingR(false));
        return () => { mounted = false; };
    }, [course.Name, course.Area]);

    const handleFormChange = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);
    const toggleStu = useCallback(id => { setForm(f => ({ ...f, Students: f.Students.includes(id) ? f.Students.filter(x => x !== id) : [...f.Students, id] })); }, []);

    const save = useCallback(async () => {
        if (!form.Topic || !form.Day || !form.Start) { onDone(false, 'Vui lòng nhập đầy đủ thông tin khi lưu'); return; }
        const topicEntry = Object.entries(topics).find(([, value]) => value.Name === form.Topic);
        const lessonId = topicEntry ? topicEntry[0] : '';
        const [h, m] = form.Start.split(':').map(Number);
        const totalMin = h * 60 + m + form.Lesson * 45;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const endM = String(totalMin % 60).padStart(2, '0');
        const payload = { courseId: course._id, data: { ...form, ID: lessonId, Time: `${form.Start}-${endH}:${endM}` }, student: form.Students, type: 'Học bù' };
        setSaving(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            onDone(res.ok && json.status === 2, json.mes || (res.ok ? 'Tạo thành công' : 'Tạo thất bại'));
        } catch { onDone(false, 'Lỗi kết nối máy chủ'); } finally { setSaving(false); }
    }, [form, course._id, onDone, topics]);

    const handleTopicPick = useCallback(v => { handleFormChange('Topic', v); setOpenTopic(false); }, [handleFormChange]);
    const handleTeacherPick = useCallback(v => { handleFormChange('Teacher', v); setOpenTeacher(false); }, [handleFormChange]);
    const handleAssistPick = useCallback(v => { handleFormChange('TeachingAs', v === '— Không chọn —' ? '' : v); setOpenAssist(false); }, [handleFormChange]);
    const handleRoomPick = useCallback(v => { handleFormChange('Room', v); setOpenRoom(false); }, [handleFormChange]);

    const availableTeachers = useMemo(() => teachers.filter(t => t !== form.TeachingAs), [teachers, form.TeachingAs]);
    const availableAssistants = useMemo(() => ['— Không chọn —', ...teachers.filter(t => t !== form.Teacher)], [teachers, form.Teacher]);

    const topicMenu = useMemo(() => <ListMenu arr={toArr(topics).map(t => t.Name)} loading={loadingTopic} empty="Chưa có chủ đề" onPick={handleTopicPick} />, [topics, loadingTopic, handleTopicPick]);
    const teacherMenu = useMemo(() => <ListMenu arr={availableTeachers} loading={loadingT} empty="Chưa có GV" onPick={handleTeacherPick} />, [availableTeachers, loadingT, handleTeacherPick]);
    const assistMenu = useMemo(() => <ListMenu arr={availableAssistants} loading={loadingT} empty="" onPick={handleAssistPick} />, [availableAssistants, loadingT, handleAssistPick]);
    const roomMenu = useMemo(() => <ListMenu arr={rooms} loading={loadingR} empty="Chưa có phòng" onPick={handleRoomPick} />, [rooms, loadingR, handleRoomPick]);

    const lockedStudentDetails = useMemo(() => {
        if (!isStudentListLocked) return [];
        const allCourseStudents = toArr(course.Student);
        return initialStudents.map(id => allCourseStudents.find(s => s.ID === id)).filter(Boolean);
    }, [isStudentListLocked, initialStudents, course.Student]);

    return (
        <>
            {saving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 2500 }}><Loading content="Đang lưu..." /></div>}
            <div className={styles.editForm}>
                <p className="text_6">Chủ đề buổi bù</p>
                <Menu menuItems={topicMenu} menuPosition="bottom" isOpen={openTopic} onOpenChange={setOpenTopic} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.Topic || 'Chọn chủ đề'}</p></button>} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input type="date" className={styles.selectBtn} style={{ flex: 1 }} value={form.Day} onChange={e => handleFormChange('Day', e.target.value)} />
                    <input type="time" className={styles.selectBtn} style={{ flex: 1 }} value={form.Start} onChange={e => handleFormChange('Start', e.target.value)} />
                    <input type="number" min="1" className={styles.selectBtn} style={{ width: 90 }} value={form.Lesson} onChange={e => handleFormChange('Lesson', Math.max(1, Number(e.target.value)))} />
                </div>
                <p className="text_6" style={{ marginTop: 8 }}>Giáo viên</p>
                <Menu menuItems={teacherMenu} menuPosition="bottom" isOpen={openTeacher} onOpenChange={setOpenTeacher} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.Teacher || 'Chọn GV'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Trợ giảng</p>
                <Menu menuItems={assistMenu} menuPosition="bottom" isOpen={openAssist} onOpenChange={setOpenAssist} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.TeachingAs || 'Không có'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Phòng học</p>
                <Menu menuItems={roomMenu} menuPosition="bottom" isOpen={openRoom} onOpenChange={setOpenRoom} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.Room || 'Chọn phòng'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>{isStudentListLocked ? 'Học sinh tham gia (cố định)' : 'Chọn học sinh tham gia'}</p>
                <div className={styles.stuWrap}>
                    {isStudentListLocked ? (
                        lockedStudentDetails.map(s => (
                            <div key={s.ID} className="text_6_400" style={{ padding: '10px 16px', borderRadius: 4, background: 'var(--green)', color: '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 14 }}>{s.ID} – {s.Name}</p></div>
                        ))
                    ) : (
                        toArr(course.Student).map(s => {
                            const selected = form.Students.includes(s.ID);
                            return (
                                <div key={s.ID} className="text_6_400" onClick={() => toggleStu(s.ID)} style={{ padding: '10px 16px', borderRadius: 4, cursor: 'pointer', background: selected ? 'var(--green)' : 'var(--border-color)', color: selected ? '#fff' : 'var(--text-primary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                                    <p style={{ fontSize: 14 }}>{s.ID} – {s.Name}</p><p style={{ fontSize: 14 }}>{selected ? 'Chọn' : 'Không chọn'}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <div className={styles.btnRow}>
                <button className="btn" style={{ borderRadius: 5, background: 'var(--border-color)' }} onClick={() => onDone(false, '')}>Huỷ bỏ</button>
                <button className="btn" style={{ borderRadius: 5, background: 'var(--green)' }} onClick={save}>Lưu buổi bù</button>
            </div>
        </>
    );
});

const EditLessonForm = React.memo(({ lesson, course, onDone, onCancel }) => {
    const [form, setForm] = useState({ ...lesson });
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loadingT, setLoadingT] = useState(true);
    const [loadingR, setLoadingR] = useState(true);
    const [openTeacher, setOpenTeacher] = useState(false);
    const [openAssist, setOpenAssist] = useState(false);
    const [openRoom, setOpenRoom] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        Data_user().then(res => mounted && setTeachers(toArr(res?.data ?? res).map(u => u.name))).finally(() => mounted && setLoadingT(false));
        Read_Area().then(res => { if (!mounted) return; const area = toArr(res?.data ?? res).find(a => a.name === course.Area); setRooms(toArr(area?.room)); }).finally(() => mounted && setLoadingR(false));
        return () => { mounted = false; };
    }, [course.Area]);

    const handleFormChange = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course._id,
                    detailId: lesson._id,
                    data: { Day: form.Day, Topic: form.Topic, Teacher: form.Teacher, TeachingAs: form.TeachingAs, Room: form.Room }
                })
            });
            const json = await res.json();
            onDone(form, res.ok && json.status === 2, json.mes || (res.ok ? 'Đã lưu thay đổi' : 'Lưu thất bại'));
        } catch {
            onDone(form, false, 'Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    }, [form, course._id, lesson._id, onDone]);

    const handleTeacherPick = useCallback(v => { handleFormChange('Teacher', v); setOpenTeacher(false); }, [handleFormChange]);
    const handleAssistPick = useCallback(v => { handleFormChange('TeachingAs', v === '— Không chọn —' ? '' : v); setOpenAssist(false); }, [handleFormChange]);
    const handleRoomPick = useCallback(v => { handleFormChange('Room', v); setOpenRoom(false); }, [handleFormChange]);

    const availableTeachers = useMemo(() => teachers.filter(t => t !== form.TeachingAs), [teachers, form.TeachingAs]);
    const availableAssistants = useMemo(() => ['— Không chọn —', ...teachers.filter(t => t !== form.Teacher)], [teachers, form.Teacher]);

    const teacherMenu = useMemo(() => <ListMenu arr={availableTeachers} loading={loadingT} empty="Chưa có GV" onPick={handleTeacherPick} />, [availableTeachers, loadingT, handleTeacherPick]);
    const assistMenu = useMemo(() => <ListMenu arr={availableAssistants} loading={loadingT} empty="" onPick={handleAssistPick} />, [availableAssistants, loadingT, handleAssistPick]);
    const roomMenu = useMemo(() => <ListMenu arr={rooms} loading={loadingR} empty="Chưa có phòng" onPick={handleRoomPick} />, [rooms, loadingR, handleRoomPick]);

    return (
        <>
            {saving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2500 }}><Loading content="Đang cập nhật..." /></div>}
            <div className={styles.editForm}>
                <p className="text_6_400"><strong>Chủ đề</strong>: {form.Topic}</p>
                <p className="text_6_400"><strong>Thời gian</strong>: {form.Time} – {form.Day}</p>
                <p className="text_6">Giáo viên giảng dạy</p>
                <Menu menuItems={teacherMenu} menuPosition="bottom" isOpen={openTeacher} onOpenChange={setOpenTeacher} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.Teacher || 'Chọn GV'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Trợ giảng</p>
                <Menu menuItems={assistMenu} menuPosition="bottom" isOpen={openAssist} onOpenChange={setOpenAssist} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.TeachingAs || 'Không có'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Phòng học</p>
                <Menu menuItems={roomMenu} menuPosition="bottom" isOpen={openRoom} onOpenChange={setOpenRoom} customButton={<button className={styles.selectBtn} style={{ textAlign: 'start' }}><p className="text_6_400">{form.Room || 'Chọn phòng'}</p></button>} />
            </div>
            <div className={styles.btnRow}>
                <button onClick={onCancel} className="btn" style={{ borderRadius: 5, background: 'var(--border-color)' }}>Huỷ bỏ</button>
                <button onClick={handleSave} className="btn" style={{ borderRadius: 5, background: 'var(--green)' }}><p className="text_6_400" style={{ color: '#fff' }}>Lưu thông tin</p></button>
            </div>
        </>
    );
});

// THAY ĐỔI 2: Cập nhật component `CancelLessonForm`
const CancelLessonForm = React.memo(({ onCancel, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <div className={styles.cancelBox}>
            <TextNoti mes="Báo nghỉ lớp học sẽ cần lý do để thông báo cho phụ huynh và buổi học sẽ được bù vào một thời gian khác." title="Báo nghỉ lớp học" color="blue" />
            <textarea className={styles.textarea} placeholder="Lý do (tuỳ chọn)" value={reason} onChange={e => setReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={onCancel} className="btn" style={{ background: 'var(--border-color)' }}>Hủy</button>
                <button onClick={() => onConfirm(reason)} className="btn" style={{ background: 'var(--red)' }}>Xác nhận Báo nghỉ</button>
            </div>
        </div>
    );
});


export default function Calendar({ course }) {
    const router = useRouter();
    const [curCourse, setCurCourse] = useState(course);
    const [open, setOpen] = useState(false);
    const [editPop, setEditPop] = useState({ open: false, lesson: null });
    const [cancelPop, setCancelPop] = useState({ open: false, lesson: null });
    const [makeupPop, setMakeupPop] = useState({ open: false, initialStudents: [] });
    const [studentListPop, setStudentListPop] = useState({ open: false, lesson: null });
    const [toast, setToast] = useState({ open: false, status: false, mes: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdateCourse = useCallback(async () => {
        await Re_course_one(course.ID);
        const freshData = await Data_Course_One(course.ID);
        if (freshData) setCurCourse(freshData);
        router.refresh();
    }, [course.ID, router]);

    const handleDone = useCallback(async (ok, mes, closePopup) => {
        setToast({ open: true, status: ok, mes });
        if (ok) {
            await handleUpdateCourse();
            closePopup();
        }
    }, [handleUpdateCourse]);

    // THAY ĐỔI 3: Cập nhật hàm mở popup chỉnh sửa
    const openEditPopup = useCallback((lesson) => {
        if (lesson.Type === 'Báo nghỉ') {
            setToast({
                open: true,
                status: false,
                mes: 'Không thể chỉnh sửa buổi học đã báo nghỉ.'
            });
            return;
        }
        setEditPop({ open: true, lesson });
    }, []);

    const openCancelPopup = useCallback((lesson) => setCancelPop({ open: true, lesson }), []);
    const openStudentListPopup = useCallback((lesson) => setStudentListPop({ open: true, lesson }), []);
    const openMakeupForCancelled = useCallback((lesson) => {
        setMakeupPop({ open: true, initialStudents: toArr(lesson.Students) });
    }, []);

    const scheduleRender = useMemo(() => (
        <>
            <div className={styles.top}>
                <button className="btn" style={{ background: 'var(--green)' }} onClick={() => setMakeupPop({ open: true, initialStudents: [] })}>Tạo buổi bù</button>
            </div>
            <ScheduleTable

                course={curCourse}
                onEdit={openEditPopup}
                onDelete={openCancelPopup}
                onShowStudents={openStudentListPopup}
                onCreateMakeup={openMakeupForCancelled}
            />
        </>
    ), [curCourse, openEditPopup, openCancelPopup, openStudentListPopup, openMakeupForCancelled]);

    return (
        <>
            {isSaving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 2500 }}><Loading content="Đang xử lý..." /></div>}

            <div className={styles.trigger} onClick={() => setOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18"><path fill="currentColor" d="M96 32v32H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48h-48V32a32 32 0 1 0-64 0v32H160V32a32 32 0 1 0-64 0zM448 192H0v272c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192z" /></svg>
                <p className="text_7">Lịch học</p>
            </div>

            <FlexiblePopup open={open} onClose={() => setOpen(false)} title={`Lịch học - ${curCourse.ID}`} width={1200} renderItemList={() => scheduleRender} />

            {makeupPop.open && <FlexiblePopup open={makeupPop.open} onClose={() => setMakeupPop({ open: false, initialStudents: [] })} title="Tạo buổi bù" width={600} renderItemList={() => <MakeupLessonForm course={curCourse} initialStudents={makeupPop.initialStudents} onDone={(ok, mes) => handleDone(ok, mes, () => setMakeupPop({ open: false, initialStudents: [] }))} />} />}

            {editPop.open && <FlexiblePopup open={editPop.open} onClose={() => setEditPop({ open: false, lesson: null })} title="Chỉnh sửa buổi học" width={600} renderItemList={() => <EditLessonForm course={curCourse} lesson={editPop.lesson} onDone={(_d, ok, mes) => handleDone(ok, mes, () => setEditPop({ open: false, lesson: null }))} onCancel={() => setEditPop({ open: false, lesson: null })} />} />}

            {studentListPop.open && <FlexiblePopup open={studentListPop.open} onClose={() => setStudentListPop({ open: false, lesson: null })} title={`Danh sách học sinh - Buổi ${studentListPop.lesson?.Topic || ''}`} width={500} renderItemList={() => <StudentListForLesson lesson={studentListPop.lesson} allStudentsInCourse={toArr(curCourse.Student)} />} />}

            {cancelPop.open && <FlexiblePopup open={cancelPop.open} onClose={() => setCancelPop({ open: false, lesson: null })} title="Báo nghỉ buổi học" width={420} renderItemList={() => cancelPop.lesson && <CancelLessonForm lesson={cancelPop.lesson} onCancel={() => setCancelPop({ open: false, lesson: null })} onConfirm={async (reason) => { if (!cancelPop.lesson) return; setIsSaving(true); try { const payload = { courseId: curCourse._id, detailId: cancelPop.lesson._id, type: 'Báo nghỉ', data: { Note: reason } }; const res = await fetch('/api/course/ucalendarcourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const json = await res.json(); if (res.ok && json.status === 2) { await handleUpdateCourse(); } setToast({ open: true, status: res.ok && json.status === 2, mes: json.mes }); } catch (error) { setToast({ open: true, status: false, mes: 'Lỗi kết nối máy chủ' }); } finally { setIsSaving(false); setCancelPop({ open: false, lesson: null }); } }} />} />}

            <Noti open={toast.open} status={toast.status} mes={toast.mes} onClose={() => setToast(t => ({ ...t, open: false }))} button={<button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setToast(t => ({ ...t, open: false }))}>Tắt thông báo</button>} />
        </>
    );
}