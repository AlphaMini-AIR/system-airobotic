'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Title from '@/components/(features)/(popup)/title';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { Svg_Add, Svg_Student } from '@/components/(icon)/svg';
import styles from './index.module.css';
import { course_data, student_data } from '@/data/actions/get';
import { reloadCourse } from '@/data/actions/reload';

export default function Student({ course }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [courseStudentSearch, setCourseStudentSearch] = useState('');
    const [openAdd, setOpenAdd] = useState(false);
    const [allStudents, setAllStudents] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [selectMenuOpen, setSelectMenuOpen] = useState(false);
    const [addStudentSearch, setAddStudentSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMes, setNotiMes] = useState('');

    const [alertConfig, setAlertConfig] = useState({
        open: false,
        type: 'warning',
        title: '',
        content: null,
        onConfirm: null,
    });

    const [reasonNote, setReasonNote] = useState('');

    const studentNameMap = useMemo(() => new Map(allStudents.map(s => [s.ID, s.Name])), [allStudents]);

    useEffect(() => {
        if ((!open && !openAdd) || allStudents.length > 0) return;
        async function fetchData() {
            setLoadingAll(true);
            const students = await student_data();
            setAllStudents(students);
            setLoadingAll(false)
        }
        fetchData();
    }, [open, openAdd, allStudents.length]);

    const handlePickStudent = (stu) => {
        if (selected.find((s) => s._id === stu._id)) return;
        setSelected((prev) => [...prev, stu]);
    };

    const handleRemove = (id) => {
        setSelected((prev) => prev.filter((s) => s._id !== id));
    };

    const resetAddPopup = () => {
        setOpenAdd(false);
        setSelected([]);
        setSelectMenuOpen(false);
        setAddStudentSearch('');
    };

    const handleSaveStudents = () => {
        if (selected.length === 0) return;
        setSaving(true);
        setGlobalLoading(true);
        fetch(`/api/course/${course._id}/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                students: selected.map((s) => s.ID),
            }),
        })
            .then(async (res) => {
                const json = await res.json();
                setNotiStatus(res.ok);
                setNotiMes(json.mes || (res.ok ? 'Đã thêm học sinh' : 'Lỗi không xác định'));
                if (res.ok) {
                    await course_data(course._id);
                    router.refresh();
                    resetAddPopup();
                }
            })
            .catch((err) => {
                setNotiStatus(false);
                setNotiMes(err.message || 'Không thể kết nối server');
            })
            .finally(() => {
                setNotiOpen(true);
                setSaving(false);
                setGlobalLoading(false);
            });
    };

    const executeStudentAction = useCallback(async (studentId, actionType, note) => {
        setGlobalLoading(true);
        setAlertConfig(prev => ({ ...prev, open: false }));

        try {
            const res = await fetch(`/api/course/${course._id}/student`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, action: actionType, note }),
            });
            const json = await res.json();

            if (res.ok) {
                await reloadCourse(course._id);
                router.refresh();
            }
            setNotiStatus(res.ok);
            setNotiMes(json.mes || 'Thao tác thất bại');
        } catch (err) {
            setNotiStatus(false);
            setNotiMes(err.message || 'Lỗi kết nối server');
        } finally {
            setNotiOpen(true);
            setGlobalLoading(false);
        }
    }, [course.ID, course._id, router]);

    const handleStudentAction = useCallback((student, studentName, actionType) => {
        setReasonNote('');
        const isReserve = actionType === 'reserve';

        setAlertConfig({
            open: true,
            type: 'warning',
            title: isReserve ? 'Xác nhận bảo lưu' : 'Xác nhận xóa học sinh',
            content: (
                <div className="flex_col" style={{ gap: 16 }}>
                    <p className="text_6">
                        Bạn có chắc muốn {isReserve ? 'bảo lưu kết quả' : 'xóa'} học sinh <b>{studentName} ({student.ID})</b>?
                        {!isReserve && <><br />Hành động này sẽ xóa toàn bộ dữ liệu liên quan và <b>không thể hoàn tác.</b></>}
                    </p>
                    <textarea
                        className="input"
                        placeholder="Vui lòng nhập lý do..."
                        rows={3}
                        defaultValue=""
                        onChange={(e) => setReasonNote(e.target.value)}
                        autoFocus
                    />
                </div>
            ),
            onConfirm: (note) => executeStudentAction(student.ID, actionType, note),
        });
    }, [executeStudentAction]);

    const renderStudentList = (listInCourse) => {
        if (loadingAll) return <Loading content="Đang tải dữ liệu học sinh..." />;

        const key = courseStudentSearch.trim().toLowerCase();

        const show = key
            ? listInCourse.filter((s) => {
                const name = studentNameMap.get(s.ID) || '';
                return (`${name} ${s.ID ?? ''}`).toLowerCase().includes(key);
            })
            : listInCourse;
        const reversedShow = [...show].reverse();

        return (
            <>
                <div className={styles.box}>
                    <input
                        className="input"
                        style={{ flex: 1, borderRadius: 3 }}
                        placeholder="Nhập tên hoặc mã học sinh..."
                        value={courseStudentSearch}
                        onChange={(e) => setCourseStudentSearch(e.target.value)}
                    />
                    <div className="btn" style={{ borderRadius: 3, margin: 0, padding: 10 }} onClick={() => { reloadCourse(course._id); router.refresh() }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={18} height={18} fill="white"><path d="M142.9 142.9c-17.5 17.5-30.1 38-37.8 59.8c-5.9 16.7-24.2 25.4-40.8 19.5s-25.4-24.2-19.5-40.8C55.6 150.7 73.2 122 97.6 97.6c87.2-87.2 228.3-87.5 315.8-1L455 55c6.9-6.9 17.2-8.9 26.2-5.2s14.8 12.5 14.8 22.2l0 128c0 13.3-10.7 24-24 24l-8.4 0c0 0 0 0 0 0L344 224c-9.7 0-18.5-5.8-22.2-14.8s-1.7-19.3 5.2-26.2l41.1-41.1c-62.6-61.5-163.1-61.2-225.3 1zM16 312c0-13.3 10.7-24 24-24l7.6 0 .7 0L168 288c9.7 0 18.5 5.8 22.2 14.8s1.7 19.3-5.2 26.2l-41.1 41.1c62.6 61.5 163.1 61.2 225.3-1c17.5-17.5 30.1-38 37.8-59.8c5.9-16.7 24.2-25.4 40.8-19.5s25.4 24.2 19.5 40.8c-10.8 30.6-28.4 59.3-52.9 83.8c-87.2 87.2-228.3 87.5-315.8 1L57 457c-6.9 6.9-17.2 8.9-26.2 5.2S16 449.7 16 440l0-119.6 0-.7 0-7.6z" /></svg>
                    </div>
                    <div className="btn" style={{ borderRadius: 3, margin: 0, padding: 10 }} onClick={() => setOpenAdd(true)}>
                        <Svg_Add w={18} h={18} c="white" />
                    </div>
                </div >
                {
                    reversedShow.length === 0 ? (
                        <p className="text_4" style={{ padding: 16 }}>Không tìm thấy học sinh phù hợp</p>
                    ) : (
                        <div style={{ padding: 16 }} >
                            <div style={{ display: 'flex', background: 'var(--border-color)', borderRadius: 3 }}>
                                <p className="text_6" style={{ flex: 1, padding: 8 }}>ID</p>
                                <p className="text_6" style={{ flex: 3, padding: 8 }}>Họ và Tên</p>
                                <p className="text_6" style={{ flex: 1, padding: 8 }}>Hành động</p>
                            </div>
                            {reversedShow.map((s, index) => {
                                const studentName = studentNameMap.get(s.ID) || 'Không có tên';
                                return (
                                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} key={index}>
                                        <p className="text_6" style={{ flex: 1, padding: 8 }}>{s.ID}</p>
                                        <p className="text_6" style={{ flex: 3, padding: 8 }}>{studentName}</p>
                                        <div className="text_6" style={{ padding: 8, flex: 1, gap: 8, display: 'flex', justifyContent: 'start' }}>
                                            <WrapIcon
                                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="white"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM368 288H144c-17.7 0-32-14.3-32-32s14.3-32 32-32H368c17.7 0 32 14.3 32 32s-14.3 32-32 32z" /></svg>}
                                                content='Bảo lưu kết quả'
                                                style={{ background: 'var(--yellow)' }}
                                                placement='bottom'
                                                click={() => handleStudentAction(s, studentName, 'reserve')}
                                            />
                                            <WrapIcon
                                                icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill="white"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0h120.4c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64s14.3-32 32-32h96l7.2-14.3zM32 128h384v320c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm192-48a24 24 0 1 1 0-48 24 24 0 1 1 0 48z" /></svg>}
                                                content='Xóa khỏi khóa học'
                                                style={{ background: 'var(--red)' }}
                                                placement='bottom'
                                                click={() => handleStudentAction(s, studentName, 'remove')}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                }
            </>
        );
    };

    const availableStudents = allStudents.filter((s) => !selected.find((sel) => sel._id === s._id));
    const filteredAvailableStudents = addStudentSearch.trim()
        ? availableStudents.filter((s) => (`${s.Name ?? ''} ${s.ID ?? ''}`).toLowerCase().includes(addStudentSearch.trim().toLowerCase()))
        : availableStudents;

    const studentMenu = (
        <div className={styles.menuWrap}>
            <div style={{ padding: 8 }}>
                <input
                    className="input"
                    placeholder="Tìm học sinh..."
                    value={addStudentSearch}
                    onChange={(e) => setAddStudentSearch(e.target.value)}
                    style={{ width: 'calc(100% - 24px)', marginBottom: 8 }}
                />
                <div className="flex_col" style={{ gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                    {filteredAvailableStudents.map((s) => (
                        <p key={s._id} onClick={() => { handlePickStudent(s); setSelectMenuOpen(false); setAddStudentSearch(''); }} className={`${styles.listItem} text_6_400`}>
                            {s.Name} ({s.ID})
                        </p>
                    ))}
                    {filteredAvailableStudents.length === 0 && <p className={styles.noItem}>Không tìm thấy</p>}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className={styles.trigger} onClick={() => setOpen(true)}>
                <Svg_Student w={24} h={24} c="var(--text-primary)" />
                <p className="text_7">Học sinh</p>
            </div>

            <FlexiblePopup
                open={open}
                onClose={() => { setOpen(false); setCourseStudentSearch(''); }}
                title="Danh sách học sinh"
                width={600}
                globalZIndex={1500}
                data={course.Student || []}
                renderItemList={renderStudentList}
            />

            <CenterPopup open={openAdd} onClose={() => { if (!saving) resetAddPopup(); }} size="md" globalZIndex={1600}>
                <>
                    <Title content="Thêm học sinh" click={() => { if (!saving) resetAddPopup(); }} />
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: 400, overflowY: 'auto' }}>
                        {loadingAll ? (<p>Đang tải danh sách học sinh...</p>) : (
                            <>
                                <p className="text_6">Chọn học sinh</p>
                                <Menu menuItems={studentMenu} menuPosition="bottom" isOpen={selectMenuOpen} onOpenChange={setSelectMenuOpen} customButton={<div className={styles.selectBtn} onClick={(e) => { e.stopPropagation(); setSelectMenuOpen(true); }}>Chọn học sinh...</div>} />
                                <div style={{ flex: 1 }}>
                                    <p className="text_6" style={{ marginBottom: 16 }}>Danh sách học sinh đã chọn ({selected.length} học sinh)</p>
                                    <div className={styles.selectedContainer}>
                                        {selected.length === 0 ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có học sinh nào được chọn</div>
                                        ) : (
                                            selected.map((s) => (
                                                <div key={s._id} className={styles.selectedItem}>
                                                    <p className="text_6_400">{s.Name} ({s.ID})</p>
                                                    <button className={styles.removeBtn} onClick={() => handleRemove(s._id)} disabled={saving}>×</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button className="btn" disabled={saving || selected.length === 0} onClick={handleSaveStudents}>
                                        {saving ? 'Đang lưu...' : 'Thêm học sinh vào khóa học'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            </CenterPopup>

            <AlertPopup
                open={alertConfig.open}
                onClose={() => setAlertConfig({ ...alertConfig, open: false })}
                title={alertConfig.title}
                content={alertConfig.content}
                type={alertConfig.type}
                actions={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="input" onClick={() => setAlertConfig({ ...alertConfig, open: false })}>
                            Hủy bỏ
                        </button>
                        <button
                            className={`btn ${alertConfig.type === 'warning' ? 'btn_warning' : ''}`}
                            onClick={() => alertConfig.onConfirm(reasonNote)}
                            disabled={!reasonNote.trim()}
                            style={{ margin: 0, transform: 'none' }}
                        >
                            Xác nhận
                        </button>
                    </div>
                }
            />

            {globalLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loading content={<p className="text_6_400" style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}

            <Noti open={notiOpen} onClose={() => setNotiOpen(false)} status={notiStatus} mes={notiMes} button={<div className="btn" onClick={() => setNotiOpen(false)} style={{ marginTop: 16, width: 'calc(100% - 24px)', justifyContent: 'center' }}>Tắt thông báo</div>} />
        </>
    );
}