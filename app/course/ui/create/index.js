'use client';

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Loading from '@/components/(ui)/(loading)/loading';
import Menu from '@/components/(ui)/(button)/menu';
import Noti from '@/components/(features)/(noti)/noti';
import { useRouter } from 'next/navigation';
import { Svg_Add } from '@/components/(icon)/svg';

const initialProgramState = { Name: 'Chọn chương trình', ID: null, Topics: [] };
const initialAreaState = { name: 'Chọn khu vực', rooms: [] };
const initialTeacherState = 'Chọn giáo viên';
const initialCourseTypeState = 'Chọn loại';

const formatForDateInput = (dayString) => {
    if (!dayString || !dayString.includes('/')) return '';
    const [dd, mm, yyyy] = dayString.split('/');
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
};

const renderList = (arr, onPick) => (
    <div className={styles.list_menuwrap}>
        <div className="flex_col" style={{ gap: 3, padding: 8 }}>
            {arr.map((opt, i) => {
                const val = typeof opt === 'string' ? opt : opt.name || opt.Name;
                return <p key={i} onClick={() => onPick(opt)} className={styles.list_li}>{val}</p>;
            })}
        </div>
    </div>
);

const SingleForm = memo(({ initialData, onSave, programObj, areaObj, teachersList, mainTeacher, closeSecondary }) => {
    const [day, setDay] = useState(initialData ? formatForDateInput(initialData.Day) : '');
    const [topicObj, setTopicObj] = useState(initialData ? { _id: initialData.ID, Name: initialData.Topic, Period: initialData.Lesson } : null);
    const [room, setRoom] = useState(initialData ? initialData.Room : 'Chọn phòng');
    const [localTeacher, setLocalTeacher] = useState(initialData ? initialData.Teacher : mainTeacher);
    const [start, setStart] = useState(initialData ? initialData.Time.split('-')[0] : '08:00');
    const [lesson, setLesson] = useState(initialData ? initialData.Lesson : 4);
    const [openMenus, setOpenMenus] = useState({ topic: false, room: false, teacher: false });

    const topicList = useMemo(() => programObj?.Topics || [], [programObj]);
    const roomList = useMemo(() => areaObj?.rooms?.map(r => r.name) || [], [areaObj]);
    const teacherNames = useMemo(() => teachersList.map((u) => u.name), [teachersList]);

    const handleSave = (e) => {
        e.preventDefault();
        if (!day || !topicObj || room === 'Chọn phòng' || localTeacher === 'Chọn giáo viên') return;
        const [h, m] = start.split(':').map(Number);
        const endMin = (topicObj.Period || lesson) * 45;
        const end = new Date(2000, 0, 1, h, m + endMin).toTimeString().slice(0, 5);
        const payload = { Day: day.split('-').reverse().join('/'), Topic: topicObj.Name, Room: room, Time: `${start}-${end}`, Lesson: topicObj.Period || lesson, ID: topicObj._id, Image: '', Teacher: localTeacher, TeachingAs: '' };
        onSave(payload);
        closeSecondary();
    };

    const createMenu = (items, onPick, placeholder) => items.length === 0 ? <div className={styles.list_menuwrap}><div style={{ padding: 12, color: '#555' }}>{placeholder}</div></div> : renderList(items, onPick);

    const topicMenu = createMenu(topicList, (val) => { setTopicObj(val); setLesson(val.Period); setOpenMenus(p => ({ ...p, topic: false })); }, 'Chưa có chủ đề');
    const roomMenu = createMenu(roomList, (val) => { setRoom(val); setOpenMenus(p => ({ ...p, room: false })); }, 'Chưa có phòng');
    const singleTeacherMenu = createMenu(teacherNames, (val) => { setLocalTeacher(val); setOpenMenus(p => ({ ...p, teacher: false })); }, 'Chưa có giáo viên');

    return (
        <form className={styles.popupForm} onSubmit={handleSave}>
            <TextNoti title={initialData ? 'Chỉnh sửa buổi học' : 'Thông tin buổi học'} color="blue" mes="Thông tin buổi học là bắt buộc" />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Chủ đề</p>
            <Menu menuItems={topicMenu} menuPosition="bottom" isOpen={openMenus.topic} onOpenChange={(v) => setOpenMenus(p => ({ ...p, topic: v }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, topic: !p.topic }))} className={styles.selectBtn}>{topicObj?.Name || 'Chọn chủ đề'}</div>} />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Phòng học</p>
            <Menu menuItems={roomMenu} menuPosition="bottom" isOpen={openMenus.room} onOpenChange={(v) => setOpenMenus(p => ({ ...p, room: v }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, room: !p.room }))} className={styles.selectBtn}>{room}</div>} />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Giáo viên</p>
            <Menu menuItems={singleTeacherMenu} menuPosition="bottom" isOpen={openMenus.teacher} onOpenChange={(v) => setOpenMenus(p => ({ ...p, teacher: v }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, teacher: !p.teacher }))} className={styles.selectBtn}>{localTeacher}</div>} />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Ngày học</p>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Thời gian bắt đầu</p>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            <p className="text_6_400" style={{ marginBottom: 4 }}>Số tiết</p>
            <input type="number" min="1" value={lesson} readOnly className={styles.readOnlyInput} />
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12 }}>
                <button type="submit" className={styles.submit} style={{ fontWeight: 400 }}>{initialData ? 'Cập nhật buổi học' : 'Lưu buổi học'}</button>
            </div>
        </form>
    );
});
SingleForm.displayName = 'SingleForm';

const BulkForm = memo(({ programObj, areaObj, teachersList, mainTeacher, addMany, closeSecondary }) => {
    const allTopics = useMemo(() => programObj ? programObj.Topics.map(topic => ({ id: topic._id, name: topic.Name, lesson: topic.Period })) : [], [programObj]);
    const [rows, setRows] = useState(() => allTopics.map(topic => ({ ...topic, day: '', start: '08:00', room: '', teacher: mainTeacher, openRoom: false, openTeacher: false })));
    const [invalidRows, setInvalidRows] = useState(new Set());
    const [errorBulk, setErrorBulk] = useState('');
    const [isFirstRoomSet, setIsFirstRoomSet] = useState(true);

    const roomList = useMemo(() => areaObj?.rooms?.map(r => r.name) || [], [areaObj]);
    const teacherNames = useMemo(() => teachersList.map(u => u.name), [teachersList]);

    const updateRow = useCallback((idx, field, value) => {
        setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
        if (invalidRows.has(idx)) {
            setInvalidRows(prev => { const newSet = new Set(prev); newSet.delete(idx); return newSet; });
        }
        if (errorBulk) setErrorBulk('');
    }, [invalidRows, errorBulk]);

    const handleRoomPick = (idx, roomValue) => {
        if (isFirstRoomSet) {
            setRows(prev => prev.map(row => ({ ...row, room: roomValue, openRoom: false })));
            setIsFirstRoomSet(false);
        } else {
            updateRow(idx, 'room', roomValue);
            updateRow(idx, 'openRoom', false);
        }
    };

    const handleFirstDayChange = (e) => {
        const firstDateValue = e.target.value;
        if (!firstDateValue) return;
        const firstDate = new Date(firstDateValue);
        setRows(prev => prev.map((row, index) => {
            if (index === 0) return { ...row, day: firstDateValue };
            const nextDate = new Date(firstDate);
            nextDate.setDate(nextDate.getDate() + index * 7);
            return { ...row, day: nextDate.toISOString().slice(0, 10) };
        }));
    };

    const handleSave = () => {
        const missing = new Set(rows.reduce((acc, r, i) => (!r.day || !r.room || !r.teacher ? [...acc, i] : acc), []));
        if (missing.size > 0) {
            setInvalidRows(missing);
            setErrorBulk('Có buổi học thiếu thông tin. Vui lòng điền đầy đủ và thử lại.');
            return;
        }
        const newSessions = rows.map(r => {
            const [h, m] = r.start.split(':').map(Number);
            const end = new Date(2000, 0, 1, h, m + r.lesson * 45).toTimeString().slice(0, 5);
            return { Day: r.day.split('-').reverse().join('/'), Topic: r.name, Room: r.room, Time: `${r.start}-${end}`, Lesson: r.lesson, ID: r.id, Image: '', Teacher: r.teacher, TeachingAs: '' };
        });
        addMany(newSessions);
        closeSecondary();
    };

    const getMenu = (items, onPick, placeholder) => items.length === 0 ? <div className={styles.list_menuwrap}><div style={{ padding: 12, color: '#555' }}>{placeholder}</div></div> : renderList(items, onPick);

    return (
        <div className={styles.bulkContainer}>
            {errorBulk && <p className={styles.error} style={{ marginBottom: 8 }}>{errorBulk}</p>}
            {rows.map((r, i) => (
                <div key={i} className={`${styles.bulkItem} ${invalidRows.has(i) ? styles.errorBorder : ''}`}>
                    <div className={styles.bulkLine}><span className={styles.bulkId}>{i + 1}.</span><span className={styles.bulkTopic}>{r.name}</span></div>
                    <div className={styles.bulkLine}>
                        <input type="date" value={r.day} onChange={i === 0 ? handleFirstDayChange : (e) => updateRow(i, 'day', e.target.value)} className={styles.bulkInput} />
                        <input type="time" value={r.start} onChange={(e) => updateRow(i, 'start', e.target.value)} className={styles.bulkInput} />
                        <input type="number" min="1" value={r.lesson} readOnly className={styles.bulkInputSmall} />
                    </div>
                    <div className={styles.bulkLine}>
                        <Menu menuItems={getMenu(roomList, (val) => handleRoomPick(i, val), 'Chưa có phòng')} menuPosition="bottom" isOpen={r.openRoom} onOpenChange={(val) => updateRow(i, 'openRoom', val)} customButton={<div onClick={() => updateRow(i, 'openRoom', !r.openRoom)} className={`${styles.selectBtn} ${!r.room ? styles.selectBtnWarning : ''}`}>{r.room || 'Chọn phòng'}</div>} />
                        <Menu menuItems={getMenu(teacherNames, (val) => { updateRow(i, 'teacher', val); updateRow(i, 'openTeacher', false); }, 'Chưa có giáo viên')} menuPosition="bottom" isOpen={r.openTeacher} onOpenChange={(val) => updateRow(i, 'openTeacher', val)} customButton={<div onClick={() => updateRow(i, 'openTeacher', !r.openTeacher)} className={`${styles.selectBtn} ${!r.teacher ? styles.selectBtnWarning : ''}`}>{r.teacher || 'Chọn giáo viên'}</div>} />
                    </div>
                </div>
            ))}
            <div className={styles.bulkActions}><button className={styles.submit} onClick={handleSave}>Lưu tất cả</button></div>
        </div>
    );
});
BulkForm.displayName = 'BulkForm';

const ScheduleList = memo(({ schedules, onEdit, onDelete }) => {
    if (schedules.length === 0) return <p className={styles.scheduleHint}>Chưa có buổi học nào</p>;
    return (
        <div className={styles.scheduleList}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}><p className="text_4">Danh sách buổi học</p></div>
            {schedules.map((s, i) => (
                <div key={i} className={styles.scheduleItem}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <span className={styles.scheduleIndex}>{i + 1}. {s.Topic}</span>
                        <span className='text_6_400'>{`${s.Day} – ${s.Time.split('-')[0]} (${s.Lesson} tiết) – ${s.Room} – ${s.Teacher}`}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type='button' className='wrapicon' style={{ background: '#f8e7b2' }} onClick={() => onEdit(i)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="#d89025"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32S209.7 64 192 64L96 64z" /></svg></button>
                        <button type='button' className={styles.iconButton} style={{ background: '#ffdbcc' }} onClick={() => onDelete(i)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill="var(--red)"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg></button>
                    </div>
                </div>
            ))}
        </div>
    );
});
ScheduleList.displayName = 'ScheduleList';

export default function Create({ books = [], areas = [], teachers = [] }) {
    const router = useRouter();
    const [openPopup, setOpenPopup] = useState(false);
    const [program, setProgram] = useState(initialProgramState);
    const [courseType, setCourseType] = useState(initialCourseTypeState);
    const [area, setArea] = useState(initialAreaState);
    const [teacher, setTeacher] = useState(initialTeacherState);
    const [schedules, setSchedules] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [noti, setNoti] = useState({ open: false, status: false, message: '' });
    const [openMenus, setOpenMenus] = useState({ program: false, type: false, area: false, teacher: false });
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const resetForm = useCallback(() => {
        setProgram(initialProgramState);
        setCourseType(initialCourseTypeState);
        setArea(initialAreaState);
        setTeacher(initialTeacherState);
        setSchedules([]);
        setErrorMsg('');
        setOpenMenus({ program: false, type: false, area: false, teacher: false });
    }, []);

    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setSecondaryOpen(false);
        setNoti(prev => ({ ...prev, open: false }));
        resetForm();
    }, [resetForm]);

    const openSecondary = (type) => {
        if (program.Name.startsWith('Chọn') || courseType.startsWith('Chọn') || area.name.startsWith('Chọn') || teacher.startsWith('Chọn')) {
            setErrorMsg('Vui lòng chọn đầy đủ chương trình, loại khóa, khu vực và giáo viên.');
            return;
        }
        setErrorMsg('');
        setSecondaryType(type);
        setSecondaryOpen(true);
    };

    const openEdit = (idx) => { setEditingIndex(idx); openSecondary('edit'); };
    const closeSecondary = () => { setSecondaryOpen(false); setEditingIndex(null); };

    const handleSaveCourse = async (e) => {
        e.preventDefault();
        if (program.Name.startsWith('Chọn') || courseType.startsWith('Chọn') || area.name.startsWith('Chọn') || teacher.startsWith('Chọn')) {
            setNoti({ open: true, status: false, message: 'Vui lòng điền đủ thông tin cơ bản.' });
            return;
        }
        if (schedules.length === 0) {
            setNoti({ open: true, status: false, message: 'Bạn phải thêm ít nhất 1 buổi học.' });
            return;
        }
        const teacherHrObj = teachers.find(t => t.name === teacher);
        if (!program._id || !area._id || !teacherHrObj?._id) {
            setNoti({ open: true, status: false, message: 'Thông tin Chương trình, Khu vực hoặc Giáo viên không hợp lệ.' });
            return;
        }

        // Tối ưu hóa: Tạo lookup maps để tránh dùng `find` trong vòng lặp
        const topicIdMap = new Map(program.Topics.map(t => [t.Name, t._id]));
        const teacherIdMap = new Map(teachers.map(t => [t.name, t._id]));

        const formattedDetail = schedules.map(s => ({
            Topic: topicIdMap.get(s.Topic),
            Day: new Date(s.Day.split('/').reverse().join('-')).toISOString(),
            Room: s.Room,
            Time: s.Time,
            Teacher: teacherIdMap.get(s.Teacher),
            TeachingAs: teacherIdMap.get(s.TeachingAs) || null,
        }));

        const payload = { code: program.ID, Book: program._id, Area: area._id, TeacherHR: teacherHrObj._id, Type: courseType, Detail: formattedDetail };
        setIsLoading(true);
        try {
            const res = await fetch('/api/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            setNoti({ open: true, status: res.ok, message: data.mes || 'Lỗi từ server' });
            if (res.ok) {
                router.refresh();
                closePopupHandler();
            }
        } catch (err) {
            setNoti({ open: true, status: false, message: err.message || 'Không thể kết nối đến server' });
        } finally {
            setIsLoading(false);
        }
    };

    const getMenu = (data, onPick, placeholder, onToggle) => renderList(data, (val) => { onPick(val); onToggle(); });

    const programMenu = getMenu(books, setProgram, 'Chưa có chương trình', () => setOpenMenus(p => ({ ...p, program: false })));
    const areaMenu = getMenu(areas, setArea, 'Chưa có khu vực', () => setOpenMenus(p => ({ ...p, area: false })));
    const teacherMenu = getMenu(teachers.map(t => t.name), setTeacher, 'Chưa có giáo viên', () => setOpenMenus(p => ({ ...p, teacher: false })));
    const typeMenu = renderList(['AI Robotic', 'Học thử'], (t) => { setCourseType(t); setOpenMenus(p => ({ ...p, type: false })); });

    const renderCourseForm = () => (
        <form className={styles.form} onSubmit={handleSaveCourse}>
            <TextNoti title="Thông tin khóa học" color="blue" mes="Thông tin khóa học là bắt buộc" />
            <Menu menuItems={programMenu} menuPosition="bottom" isOpen={openMenus.program} onOpenChange={isOpen => setOpenMenus(p => ({ ...p, program: isOpen }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, program: !p.program }))} className={`${styles.selectBtn} ${program.Name.startsWith('Chọn') ? styles.selectBtnWarning : ''}`}>{program.Name}</div>} />
            <Menu menuItems={typeMenu} menuPosition="bottom" isOpen={openMenus.type} onOpenChange={isOpen => setOpenMenus(p => ({ ...p, type: isOpen }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, type: !p.type }))} className={`${styles.selectBtn} ${courseType.startsWith('Chọn') ? styles.selectBtnWarning : ''}`}>{courseType}</div>} />
            <Menu menuItems={areaMenu} menuPosition="bottom" isOpen={openMenus.area} onOpenChange={isOpen => setOpenMenus(p => ({ ...p, area: isOpen }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, area: !p.area }))} className={`${styles.selectBtn} ${area.name.startsWith('Chọn') ? styles.selectBtnWarning : ''}`}>{area.name}</div>} />
            <Menu menuItems={teacherMenu} menuPosition="bottom" isOpen={openMenus.teacher} onOpenChange={isOpen => setOpenMenus(p => ({ ...p, teacher: isOpen }))} customButton={<div onClick={() => setOpenMenus(p => ({ ...p, teacher: !p.teacher }))} className={`${styles.selectBtn} ${teacher.startsWith('Chọn') ? styles.selectBtnWarning : ''}`}>{teacher}</div>} />
            {errorMsg && <p className={styles.error} style={{ marginTop: 8 }}>{errorMsg}</p>}
            <TextNoti title="Lịch học" color="blue" mes="Bạn có thể thêm từng buổi hoặc tạo hàng loạt." />
            <div className={styles.scheduleAction}>
                <button type="button" className={styles.addBtn} onClick={() => openSecondary('single')}>+ Thêm buổi</button>
                <button type="button" className={styles.addBtn} onClick={() => openSecondary('bulk')}>+ Tạo toàn bộ</button>
            </div>
            <ScheduleList schedules={schedules} onEdit={openEdit} onDelete={idx => setSchedules(prev => prev.filter((_, i) => i !== idx))} />
            <button type="submit" className={styles.submit}>Lưu khóa học</button>
        </form>
    );

    const renderSecondaryList = () => {
        switch (secondaryType) {
            case 'single': return <SingleForm onSave={item => setSchedules(p => [...p, item])} programObj={program} areaObj={area} teachersList={teachers} mainTeacher={teacher} closeSecondary={closeSecondary} />;
            case 'edit': return <SingleForm initialData={schedules[editingIndex]} onSave={updated => setSchedules(p => p.map((s, i) => (i === editingIndex ? updated : s)))} programObj={program} areaObj={area} teachersList={teachers} mainTeacher={teacher} closeSecondary={closeSecondary} />;
            case 'bulk': return <BulkForm programObj={program} areaObj={area} teachersList={teachers} mainTeacher={teacher} addMany={arr => setSchedules(arr)} closeSecondary={closeSecondary} />;
            default: return null;
        }
    };

    return (
        <>
            <div className={styles.button} onClick={() => setOpenPopup(true)}>
                <Svg_Add w={16} h={16} c="white" />
                <p className='text_6_400' style={{ color: 'white' }}>Thêm khóa học</p>
            </div>
            <FlexiblePopup open={openPopup} onClose={closePopupHandler} title="Thêm khóa học mới" width={700} renderItemList={renderCourseForm} secondaryOpen={secondaryOpen} onCloseSecondary={closeSecondary} renderSecondaryList={renderSecondaryList} secondaryTitle={secondaryType === 'single' ? 'Thêm buổi học' : secondaryType === 'edit' ? 'Chỉnh sửa buổi học' : 'Tạo lịch hàng loạt'} />
            {isLoading && <div className={styles.loadingOverlay}><Loading content={<p className='text_7' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message} button={<button className={styles.bnt} onClick={() => { if (noti.status) closePopupHandler(); else setNoti(p => ({ ...p, open: false })); }}>Đóng</button>} />
        </>
    );
}