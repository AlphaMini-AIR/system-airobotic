'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import Noti from '@/components/(features)/(noti)/noti';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { useRouter } from 'next/navigation';
import styles from './index.module.css';
import { formatDate } from '@/function';
import { reloadCourse } from '@/data/actions/reload';
import { course_data, user_data } from '@/data/actions/get';

const toArr = v => Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];
const Cell = React.memo(({ flex, align, header, children }) => (<div style={{ flex, justifyContent: align, fontWeight: header ? 600 : 400 }} className={`${styles.cell} text_6_400`}>{children}</div>));
const MoreIcons = React.memo(({ onEdit, onDelete, onDetail, isCancelled, onCreateMakeup }) => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <WrapIcon icon={<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>} content="Sửa lịch học" placement="bottom" style={{ background: 'var(--yellow)' }} click={onEdit} />
        {isCancelled ? (<WrapIcon icon={<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'><path fill='#FFFFFFFF' d='M16 3a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v5.528A6 6 0 0 0 12.528 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V4a1 1 0 0 1 2 0v1h6V4a1 1 0 0 1 1-1m1 10a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 1.5a1 1 0 0 0-.993.883L16 15.5V17a1 1 0 0 0 .883.993L17 18h1a1 1 0 0 0 .117-1.993L18 16v-.5a1 1 0 0 0-1-1M8.5 14H8a1 1 0 1 0 0 2h.5a1 1 0 1 0 0-2m2.5-4H8a1 1 0 0 0-.117 1.993L8 12h3a1 1 0 0 0 .117-1.993z' /></svg>} content="Tạo buổi bù" placement="bottom" style={{ background: 'var(--green)' }} click={onCreateMakeup} />) : (<WrapIcon icon={<svg viewBox="0 0 448 512" width="14" height="14" fill="#fff"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 280 0H168a24 24 0 0 0-22.6 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h16l21.2 339a48 48 0 0 0 47.9 45h243.6a48 48 0 0 0 47.9-45L416 96h16a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" /></svg>} content="Báo nghỉ" placement="bottom" style={{ background: 'var(--red)' }} click={onDelete} />)}
        <WrapIcon icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="#fff"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>} content="Chi tiết học sinh" placement="bottom" style={{ background: 'var(--main_d)' }} click={onDetail} />
    </div>
));
const StudentListForLesson = React.memo(({ lesson, allStudentsInCourse, studentIdToNameMap }) => {
    const studentsToShow = useMemo(() => toArr(allStudentsInCourse).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)), [lesson._id, allStudentsInCourse]);
    if (studentsToShow.length === 0) return <div style={{ padding: '20px', textAlign: 'center' }}>Không có học sinh nào trong buổi học này.</div>;
    return <div style={{ padding: '8px' }}>{studentsToShow.map(student => (<div key={student.ID} className={styles.studentRow}><p className='text_6_400'>{student.ID}</p><p className='text_6_400'>{studentIdToNameMap.get(student.ID) || student.Name}</p></div>))}</div>;
});
const ListMenu = React.memo(({ arr, loading, empty, onPick }) => {
    const body = useMemo(() => {
        if (loading) return <Loading content="đang tải..." />;
        const data = toArr(arr);
        if (data.length === 0) return <div style={{ padding: 12 }}>{empty}</div>;
        return data.map((v, i) => (<p key={i} className="text_6_400" onClick={() => onPick(v)}>{v}</p>));
    }, [arr, loading, empty, onPick]);
    return <div className={styles.list_menuwrap}>{body}</div>;
});
const cols = [{ key: 'Day', label: 'Ngày', flex: 0.6, align: 'left' }, { key: 'Time', label: 'Giờ', flex: 0.6, align: 'left' }, { key: 'Topic', label: 'Chủ đề', flex: 2, align: 'left' }, { key: 'Room', label: 'Phòng', flex: 0.7, align: 'left' }, { key: 'Teacher', label: 'Giáo viên', flex: 1.2, align: 'left' }, { key: 'Type', label: 'Trạng thái', flex: 0.8, align: 'center' }, { key: 'Students', label: 'Sỉ số', flex: 0.8, align: 'center' }, { key: 'more', label: 'Hành động', flex: 1, align: 'center' }];
const ScheduleTable = React.memo(({ course, onEdit, onDelete, onShowStudents, onCreateMakeup }) => {
    const studentCountMap = useMemo(() => {
        const counts = new Map();
        toArr(course?.Student).forEach(student => {
            toArr(student.Learn).forEach(learn => {
                counts.set(learn.Lesson, (counts.get(learn.Lesson) || 0) + 1);
            });
        });
        return counts;
    }, [course?.Student]);

    return (
        <div className={styles.detailContainer}>
            <div className={styles.rowHead}>{cols.map((col, i) => <Cell key={i} flex={col.flex} align={col.align} header>{col.label}</Cell>)}</div>
            {toArr(course?.Detail).map((row, index) => (
                <div key={row._id || index} className={styles.row} style={{ background: row.Type === 'Học bù' ? '#fffadd' : row.Type === 'Báo nghỉ' ? '#ffe6e6' : 'transparent' }}>
                    {cols.map(col => {
                        switch (col.key) {
                            case 'Topic': return <Cell key={col.key} flex={col.flex} align={col.align}>{row.LessonDetails?.Name || 'N/A'}</Cell>;
                            case 'Teacher': return <Cell key={col.key} flex={col.flex} align={col.align}>{row.Teacher?.name || 'N/A'}</Cell>;
                            case 'Day': return <Cell key={col.key} flex={col.flex} align={col.align}>{formatDate(new Date(row.Day))}</Cell>;
                            case 'more': return <Cell key={col.key} flex={col.flex} align={col.align}><MoreIcons onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} onDetail={() => onShowStudents(row)} onCreateMakeup={() => onCreateMakeup(row)} isCancelled={row.Type === 'Báo nghỉ'} /></Cell>;
                            case 'Type': return <Cell key={col.key} flex={col.flex} align={col.align}><span className='text_7' style={{ padding: '4px 16px', borderRadius: '12px', background: row.Type === 'Học bù' ? 'var(--yellow)' : row.Type === 'Báo nghỉ' ? 'var(--red)' : 'var(--green)', color: 'white' }}>{row.Type || 'Chính thức'}</span></Cell>;
                            case 'Students': return <Cell key={col.key} flex={col.flex} align={col.align}><span>{studentCountMap.get(row._id) || 0} học sinh</span></Cell>;
                            default: return <Cell key={col.key} flex={col.flex} align={col.align}>{row[col.key]}</Cell>;
                        }
                    })}
                </div>
            ))}
        </div>
    );
});
const LessonForm = React.memo(({ mode = 'makeup', course, lesson, onDone, onCancel, initialStudents = [], allTeachers, allRooms, topicMap }) => {
    const isEditMode = mode === 'edit';
    const initialFormState = useMemo(() => ({
        Day: isEditMode ? lesson.Day.split('T')[0] : '',
        Start: isEditMode ? lesson.Time.split('-')[0] : '',
        Topic: isEditMode ? lesson.LessonDetails?.Name : '',
        Teacher: isEditMode ? lesson.Teacher?.name : '',
        TeachingAs: isEditMode ? lesson.TeachingAs?.name : '',
        Room: isEditMode ? lesson.Room : '',
        Students: isEditMode ? toArr(course.Student).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)).map(s => s.ID) : initialStudents,
    }), [mode, lesson, course.Student, initialStudents]);

    const [form, setForm] = useState(initialFormState);
    const [open, setOpen] = useState({ topic: false, teacher: false, assist: false, room: false });
    const [saving, setSaving] = useState(false);
    const isStudentListLocked = useMemo(() => mode === 'makeup' && initialStudents.length > 0, [mode, initialStudents]);

    const handleFormChange = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);
    const toggleStu = useCallback(id => { setForm(f => ({ ...f, Students: f.Students.includes(id) ? f.Students.filter(x => x !== id) : [...f.Students, id] })); }, []);
    const handleOpen = useCallback((menu, value) => setOpen(o => ({ ...o, [menu]: value })), []);
    const handlePick = useCallback((field, menuName, value) => { handleFormChange(field, value); handleOpen(menuName, false); }, [handleFormChange, handleOpen]);

    const save = useCallback(async () => {
        if (!isEditMode && (!form.Topic || !form.Day || !form.Start)) {
            onDone(null, false, 'Vui lòng nhập đủ thông tin bắt buộc.');
            return;
        }
        const teacherEntry = allTeachers.find(t => t.name === form.Teacher);
        const teachingAsEntry = allTeachers.find(t => t.name === form.TeachingAs);
        const topicEntry = topicMap.get(form.Topic);

        const [h, m] = form.Start.split(':').map(Number);
        const totalMin = h * 60 + m + (topicEntry?.Period || lesson?.LessonDetails?.Period || 0) * 45;
        const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
        const endM = String(totalMin % 60).padStart(2, '0');

        let payload = {
            courseId: course._id,
            data: { ...form, Teacher: teacherEntry?._id, TeachingAs: teachingAsEntry?._id, Time: `${form.Start}-${endH}:${endM}` }
        };
        if (isEditMode) {
            payload.detailId = lesson._id;
        } else {
            payload.type = 'Học bù';
            payload.data.Topic = topicEntry?._id;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            onDone(form, res.ok && json.status === 2, json.mes || (res.ok ? 'Thao tác thành công' : 'Thao tác thất bại'));
        } catch (err) {
            onDone(form, false, err.message || 'Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    }, [form, allTeachers, topicMap, course._id, lesson, isEditMode, onDone]);

    const availableTeachers = useMemo(() => allTeachers.filter(t => t.name !== form.TeachingAs).map(t => t.name), [allTeachers, form.TeachingAs]);
    const availableAssistants = useMemo(() => ['— Không chọn —', ...allTeachers.filter(t => t.name !== form.Teacher).map(t => t.name)], [allTeachers, form.Teacher]);
    const allTopics = useMemo(() => Array.from(topicMap.keys()), [topicMap]);
    const studentIdToNameMap = useMemo(() => new Map(toArr(course.Student).map(s => [s.ID, s.Name])), [course.Student]);

    return (
        <>
            {saving && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2500 }}><Loading content={isEditMode ? "Đang cập nhật..." : "Đang lưu..."} /></div>}
            <div className={styles.editForm}>
                <p className="text_6">Chủ đề buổi học</p>
                {isEditMode ? <p className="text_6_400" style={{ padding: '10px 12px', background: 'var(--bg_color)', borderRadius: 4 }}>{form.Topic}</p> : <Menu menuItems={<ListMenu arr={allTopics} empty="Chưa có chủ đề" onPick={v => handlePick('Topic', 'topic', v)} />} menuPosition="bottom" isOpen={open.topic} onOpenChange={v => handleOpen('topic', v)} customButton={<button className={styles.selectBtn} style={{ textAlign: 'left' }}><p className="text_6_400">{form.Topic || 'Chọn chủ đề'}</p></button>} />}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input type="date" className={styles.selectBtn} style={{ flex: 1 }} value={form.Day} onChange={e => handleFormChange('Day', e.target.value)} />
                    <input type="time" className={styles.selectBtn} style={{ flex: 1 }} value={form.Start} onChange={e => handleFormChange('Start', e.target.value)} />
                </div>
                <p className="text_6" style={{ marginTop: 8 }}>Giáo viên</p>
                <Menu menuItems={<ListMenu arr={availableTeachers} empty="Chưa có GV" onPick={v => handlePick('Teacher', 'teacher', v)} />} menuPosition="bottom" isOpen={open.teacher} onOpenChange={v => handleOpen('teacher', v)} customButton={<button className={styles.selectBtn} style={{ textAlign: 'left' }}><p className="text_6_400">{form.Teacher || 'Chọn GV'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Trợ giảng</p>
                <Menu menuItems={<ListMenu arr={availableAssistants} empty="" onPick={v => handlePick('TeachingAs', 'assist', v === '— Không chọn —' ? '' : v)} />} menuPosition="bottom" isOpen={open.assist} onOpenChange={v => handleOpen('assist', v)} customButton={<button className={styles.selectBtn} style={{ textAlign: 'left' }}><p className="text_6_400">{form.TeachingAs || 'Không có'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>Phòng học</p>
                <Menu menuItems={<ListMenu arr={allRooms} empty="Chưa có phòng" onPick={v => handlePick('Room', 'room', v)} />} menuPosition="bottom" isOpen={open.room} onOpenChange={v => handleOpen('room', v)} customButton={<button className={styles.selectBtn} style={{ textAlign: 'left' }}><p className="text_6_400">{form.Room || 'Chọn phòng'}</p></button>} />
                <p className="text_6" style={{ marginTop: 8 }}>{isStudentListLocked ? 'Học sinh tham gia (cố định)' : 'Chọn học sinh tham gia'}</p>
                <div className={styles.stuWrap}>
                    {isStudentListLocked ? toArr(form.Students).map(id => (<div key={id} className="text_6_400" style={{ padding: '10px 16px', borderRadius: 4, background: 'var(--green)', color: '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 14 }}>{id} – {studentIdToNameMap.get(id)}</p></div>)) : toArr(course.Student).map(s => {
                        const selected = form.Students.includes(s.ID);
                        return (<div key={s.ID} className="text_6_400" onClick={() => toggleStu(s.ID)} style={{ padding: '10px 16px', borderRadius: 4, cursor: 'pointer', background: selected ? 'var(--green)' : 'var(--border-color)', color: selected ? '#fff' : 'var(--text-primary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: 14 }}>{s.ID} – {s.Name}</p><p style={{ fontSize: 14 }}>{selected ? 'Chọn' : 'Không chọn'}</p></div>);
                    })}
                </div>
            </div>
            <div className={styles.btnRow}>
                <button className="btn" style={{ borderRadius: 5, background: 'var(--border-color)' }} onClick={onCancel}>Huỷ bỏ</button>
                <button className="btn" style={{ borderRadius: 5, background: 'var(--green)' }} onClick={save}>Lưu thông tin</button>
            </div>
        </>
    );
});
const CancelLessonForm = React.memo(({ onCancel, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <div className={styles.cancelBox}>
            <TextNoti mes="Báo nghỉ lớp học sẽ cần lý do để thông báo cho phụ huynh và buổi học sẽ được bù vào một thời gian khác." title="Báo nghỉ lớp học" color="blue" />
            <textarea className={styles.textarea} placeholder="Lý do (tuỳ chọn)" value={reason} onChange={e => setReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={onCancel} className="btn" style={{ background: 'var(--border-color)' }}>Hủy</button>
                <button onClick={() => onConfirm(reason)} className="btn" style={{ background: 'var(--red)' }}>Xác nhận báo nghỉ</button>
            </div>
        </div>
    );
});
export default function Calendar({ course }) {
    const router = useRouter();
    const [curCourse, setCurCourse] = useState(course);
    const [allTeachers, setAllTeachers] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [open, setOpen] = useState(false);
    const [popupState, setPopupState] = useState({ type: null, data: null });
    const [toast, setToast] = useState({ open: false, status: false, mes: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => { setCurCourse(course); }, [course]);
    useEffect(() => {
        const fetchData = async () => {
            const users = await user_data({});
            setAllTeachers(users);
            setAllRooms(toArr(course.Area?.rooms).map(r => r.name));
        };
        fetchData();
    }, [course.Area]);

    const topicMap = useMemo(() => new Map(toArr(course.Book?.Topics).map(t => [t.Name, t])), [course.Book?.Topics]);
    const studentIdToNameMap = useMemo(() => new Map(toArr(course.Student).map(s => [s.ID, s.Name])), [course.Student]);

    const handleClosePopup = useCallback(() => setPopupState({ type: null, data: null }), []);
    const handleUpdateCourse = useCallback(async () => {
        setIsProcessing(true);
        await reloadCourse(course._id);
        const freshData = await course_data(course._id);
        if (freshData) setCurCourse(freshData);
        router.refresh();
        setIsProcessing(false);
    }, [course._id, router]);
    const handleApiResponse = useCallback(async (isSuccess, message) => {
        setToast({ open: true, status: isSuccess, mes: message });
        if (isSuccess) {
            handleClosePopup();
            await handleUpdateCourse();
        }
    }, [handleClosePopup, handleUpdateCourse]);

    const handleApiRequest = useCallback(async (payload, successMessage, errorMessage) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/course/ucalendarcourse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            await handleApiResponse(res.ok && json.status === 2, json.mes || (res.ok ? successMessage : errorMessage));
        } catch (error) {
            await handleApiResponse(false, error.message || 'Lỗi kết nối máy chủ');
        } finally {
            setIsProcessing(false);
        }
    }, [handleApiResponse]);

    const handleOpenPopup = useCallback((type, data = null) => {
        if (type === 'edit' && data?.Type === 'Báo nghỉ') {
            setToast({ open: true, status: false, mes: 'Không thể chỉnh sửa buổi học đã báo nghỉ.' });
            return;
        }
        setPopupState({ type, data });
    }, []);

    const handleConfirmCancel = useCallback(async (reason) => {
        if (!popupState.data) return;
        await handleApiRequest({ courseId: curCourse._id, detailId: popupState.data._id, type: 'Báo nghỉ', data: { Note: reason } }, 'Báo nghỉ thành công!', 'Báo nghỉ thất bại!');
    }, [popupState.data, curCourse._id, handleApiRequest]);

    const handleFormDone = useCallback((_, ok, mes) => handleApiResponse(ok, mes), [handleApiResponse]);

    const openMakeupForCancelled = useCallback((lesson) => {
        const studentIds = toArr(course.Student).filter(s => s.Learn?.some(l => l.Lesson === lesson._id)).map(s => s.ID);
        handleOpenPopup('makeup', { initialStudents: studentIds });
    }, [course.Student, handleOpenPopup]);

    const renderPopupContent = () => {
        const { type, data } = popupState;
        switch (type) {
            case 'makeup': return <LessonForm mode="makeup" course={curCourse} allTeachers={allTeachers} allRooms={allRooms} topicMap={topicMap} onDone={handleFormDone} onCancel={handleClosePopup} initialStudents={data?.initialStudents || []} />;
            case 'edit': return <LessonForm mode="edit" course={curCourse} lesson={data} allTeachers={allTeachers} allRooms={allRooms} topicMap={topicMap} onDone={handleFormDone} onCancel={handleClosePopup} />;
            case 'studentList': return <StudentListForLesson lesson={data} allStudentsInCourse={toArr(curCourse.Student)} studentIdToNameMap={studentIdToNameMap} />;
            case 'cancel': return <CancelLessonForm onCancel={handleClosePopup} onConfirm={handleConfirmCancel} />;
            default: return null;
        }
    };

    return (
        <>
            {isProcessing && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 2500 }}><Loading content="Đang xử lý..." /></div>}
            <div className={styles.trigger} onClick={() => setOpen(true)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="18" height="18"><path fill="currentColor" d="M96 32v32H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48h-48V32a32 32 0 1 0-64 0v32H160V32a32 32 0 1 0-64 0zM448 192H0v272c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192z" /></svg><p className="text_7">Lịch học</p></div>
            <FlexiblePopup open={open} onClose={() => setOpen(false)} title={`Lịch học - ${curCourse.ID}`} width={1200} renderItemList={() => <><div className={styles.top}><button className="btn" style={{ background: 'var(--green)' }} onClick={() => handleOpenPopup('makeup')}>Tạo buổi bù</button></div><ScheduleTable course={curCourse} onEdit={(lesson) => handleOpenPopup('edit', lesson)} onDelete={(lesson) => handleOpenPopup('cancel', lesson)} onShowStudents={(lesson) => handleOpenPopup('studentList', lesson)} onCreateMakeup={openMakeupForCancelled} /></>} />
            {popupState.type && <FlexiblePopup open={true} onClose={handleClosePopup} title={popupState.type === 'makeup' ? 'Tạo buổi bù' : popupState.type === 'edit' ? 'Chỉnh sửa buổi học' : popupState.type === 'cancel' ? 'Báo nghỉ buổi học' : `Học sinh buổi "${popupState.data?.LessonDetails?.Name || ''}"`} width={popupState.type === 'studentList' ? 500 : popupState.type === 'cancel' ? 420 : 600} renderItemList={renderPopupContent} />}
            <Noti open={toast.open} status={toast.status} mes={toast.mes} onClose={() => setToast(t => ({ ...t, open: false }))} />
        </>
    );
}