'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Menu from '@/components/(ui)/(button)/menu';

import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';

import { Read_Student_All } from '@/data/student';
import { Re_course_one } from '@/data/course';

import styles from './index.module.css';
import { Svg_Add, Svg_Student } from '@/components/(icon)/svg';
import Title from '@/components/(features)/(popup)/title';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';

export default function Student({ course }) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    // CHỈNH SỬA 1: Đổi tên state 'search' để làm rõ mục đích
    const [courseStudentSearch, setCourseStudentSearch] = useState('');
    const [openAdd, setOpenAdd] = useState(false);
    const [allStudents, setAllStudents] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [selectMenuOpen, setSelectMenuOpen] = useState(false);
    // CHỈNH SỬA 2: Đổi tên state 'selectSearch' để làm rõ mục đích
    const [addStudentSearch, setAddStudentSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMes, setNotiMes] = useState('');

    useEffect(() => {
        if ((!open && !openAdd) || allStudents.length > 0) return;

        setLoadingAll(true);
        Read_Student_All()
            .then((res) => {
                const list = Array.isArray(res) ? res : res.data || [];
                setAllStudents(list);
            })
            .finally(() => setLoadingAll(false));
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
        // Đảm bảo reset đúng state tìm kiếm
        setAddStudentSearch('');
    };

    const handleSaveStudents = () => {
        if (selected.length === 0) return;
        setSaving(true);
        setGlobalLoading(true);
        fetch('/api/course/addstudent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseID: course._id,
                students: selected.map((s) => s.ID),
            }),
        })
            .then(async (res) => {
                const json = await res.json();
                setNotiStatus(res.ok);
                setNotiMes(json.mes || (res.ok ? 'Đã thêm học sinh' : 'Lỗi không xác định'));
                setNotiOpen(true);
                if (res.ok) {
                    await Re_course_one(course.ID);
                    router.refresh();
                    resetAddPopup();
                }
            })
            .catch((err) => {
                setNotiStatus(false);
                setNotiMes(err.message || 'Không thể kết nối server');
                setNotiOpen(true);
            })
            .finally(() => {
                setSaving(false);
                setGlobalLoading(false);
            });
    };

const renderStudentList = (listInCourse) => {
    if (loadingAll) {
        return <Loading content="Đang tải dữ liệu học sinh..." />;
    }

    const key = courseStudentSearch.trim().toLowerCase();
    const studentNameMap = new Map(allStudents.map(s => [s.ID, s.Name]));

    const show = key
        ? listInCourse.filter((s) => {
              const name = studentNameMap.get(s.ID) || '';
              return (`${name} ${s.ID ?? ''}`).toLowerCase().includes(key);
          })
        : listInCourse;

    // Tạo một bản sao mới của mảng 'show' và đảo ngược nó
    // để không làm thay đổi dữ liệu gốc (props).
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
                <div className="btn" style={{ borderRadius: 3, margin: 0, padding: 10 }} onClick={() => Re_course_one(course.ID).finally(() => router.refresh())}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={18} height={18} fill="white"><path d="M142.9 142.9c-17.5 17.5-30.1 38-37.8 59.8c-5.9 16.7-24.2 25.4-40.8 19.5s-25.4-24.2-19.5-40.8C55.6 150.7 73.2 122 97.6 97.6c87.2-87.2 228.3-87.5 315.8-1L455 55c6.9-6.9 17.2-8.9 26.2-5.2s14.8 12.5 14.8 22.2l0 128c0 13.3-10.7 24-24 24l-8.4 0c0 0 0 0 0 0L344 224c-9.7 0-18.5-5.8-22.2-14.8s-1.7-19.3 5.2-26.2l41.1-41.1c-62.6-61.5-163.1-61.2-225.3 1zM16 312c0-13.3 10.7-24 24-24l7.6 0 .7 0L168 288c9.7 0 18.5 5.8 22.2 14.8s1.7 19.3-5.2 26.2l-41.1 41.1c62.6 61.5 163.1 61.2 225.3-1c17.5-17.5 30.1-38 37.8-59.8c5.9-16.7 24.2-25.4 40.8-19.5s25.4 24.2 19.5 40.8c-10.8 30.6-28.4 59.3-52.9 83.8c-87.2 87.2-228.3 87.5-315.8 1L57 457c-6.9 6.9-17.2 8.9-26.2 5.2S16 449.7 16 440l0-119.6 0-.7 0-7.6z" /></svg>
                </div>
                <div className="btn" style={{ borderRadius: 3, margin: 0, padding: 10 }} onClick={() => setOpenAdd(true)}>
                    <Svg_Add w={18} h={18} c="white" />
                </div>
            </div>
            {reversedShow.length === 0 ? (
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
                                <div className="text_6" style={{ padding: 8, flex: 1, display: 'flex', justifyContent: 'start' }}>
                                    <WrapIcon
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width={16} height={16} fill="white"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM471 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>}
                                        content='Xóa khỏi khóa học'
                                        style={{ background: 'var(--red)' }}
                                        placement='bottom'
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    );
};

    // CHỈNH SỬA 4: Cập nhật logic lọc cho popup "Thêm học sinh" để sử dụng state 'addStudentSearch'
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
                onClose={() => { setOpen(false); setCourseStudentSearch(''); }} // Reset đúng state tìm kiếm
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
                                                    <button className={styles.removeBtn} onClick={() => handleRemove(s._id)} disabled={saving}>&times;</button>
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

            {globalLoading && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loading content="Đang xử lý..." /></div>}

            <Noti open={notiOpen} onClose={() => setNotiOpen(false)} status={notiStatus} mes={notiMes} button={<div className="btn" onClick={() => setNotiOpen(false)} style={{ marginTop: 16, width: 'calc(100% - 24px)', justifyContent: 'center' }}>Tắt thông báo</div>} />
        </>
    );
}