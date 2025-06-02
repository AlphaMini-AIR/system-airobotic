'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './index.module.css';

import FlexiblePopup from '@/components/(popup)/popup_right';
import TextNoti from '@/components/(noti)/textnoti';
import Loading from '@/components/(loading)/loading';
import Menu from '@/components/(button)/menu';
import Noti from '@/components/(noti)/noti';

import { Data_book } from '@/data/book';
import { Read_Area } from '@/data/area';
import { Data_user } from '@/data/users';

export default function Create() {
    /* ---------------- popup chính ---------------- */
    const [openPopup, setOpenPopup] = useState(false);
    const openPopupHandler = useCallback(() => setOpenPopup(true), []);
    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setSecondaryOpen(false);
        setErrorMsg('');
        // Reset thông báo
        setNotiOpen(false);
    }, []);

    /* ---------------- form chính ---------------- */
    const [program, setProgram] = useState('Chọn chương trình');
    const [programObj, setProgramObj] = useState(null);
    const [area, setArea] = useState('Chọn khu vực');
    const [areaObj, setAreaObj] = useState(null);
    const [teacher, setTeacher] = useState('Chọn giáo viên');
    const [errorMsg, setErrorMsg] = useState('');

    /* ---------------- menu mở ---------------- */
    const [openProgram, setOpenProgram] = useState(false);
    const [openArea, setOpenArea] = useState(false);
    const [openTeacher, setOpenTeacher] = useState(false);

    /* ---------------- lấy dữ liệu Program ---------------- */
    const [programs, setPrograms] = useState([]);
    const [loadingProg, setLoadingProg] = useState(false);
    useEffect(() => {
        if (openPopup && programs.length === 0 && !loadingProg) {
            setLoadingProg(true);
            Data_book()
                .then((res) => setPrograms(res))
                .finally(() => setLoadingProg(false));
        }
    }, [openPopup, programs.length, loadingProg]);

    /* ---------------- lấy dữ liệu Area ---------------- */
    const [areas, setAreas] = useState([]);
    const [loadingArea, setLoadingArea] = useState(false);
    useEffect(() => {
        if (openPopup && areas.length === 0 && !loadingArea) {
            setLoadingArea(true);
            Read_Area()
                .then((res) => {
                    const list = Array.isArray(res) ? res : res.data;
                    setAreas(list);
                })
                .finally(() => setLoadingArea(false));
        }
    }, [openPopup, areas.length, loadingArea]);

    /* ---------------- lấy dữ liệu Teacher ---------------- */
    const [teachersList, setTeachersList] = useState([]);
    const [loadingTeacher, setLoadingTeacher] = useState(false);
    useEffect(() => {
        if (openPopup && teachersList.length === 0 && !loadingTeacher) {
            setLoadingTeacher(true);
            Data_user()
                .then((res) => {
                    const list = Array.isArray(res) ? res : res.data || [];
                    setTeachersList(list);
                })
                .finally(() => setLoadingTeacher(false));
        }
    }, [openPopup, teachersList.length, loadingTeacher]);

    /* ---------------- lịch học ---------------- */
    const [schedules, setSchedules] = useState([]);
    const addSchedule = (item) => setSchedules((prev) => [...prev, item]);
    const addMany = (arr) => setSchedules((prev) => [...prev, ...arr]);
    const updateScheduleAt = (idx, newItem) =>
        setSchedules((prev) => prev.map((s, i) => (i === idx ? newItem : s)));
    const deleteSchedule = (idx) =>
        setSchedules((prev) => prev.filter((_, i) => i !== idx));

    /* ---------------- popup con ---------------- */
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState(null); // 'single' | 'bulk' | 'edit'
    const [editingIndex, setEditingIndex] = useState(null);

    const openSingle = () => {
        if (
            program.startsWith('Chọn') ||
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            setErrorMsg(
                'Vui lòng chọn đầy đủ chương trình, khu vực và giáo viên trước khi thêm lịch.'
            );
            return;
        }
        setErrorMsg('');
        setSecondaryType('single');
        setSecondaryOpen(true);
    };
    const openBulk = () => {
        if (
            program.startsWith('Chọn') ||
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            setErrorMsg(
                'Vui lòng chọn đầy đủ chương trình, khu vực và giáo viên trước khi tạo lịch hàng loạt.'
            );
            return;
        }
        setErrorMsg('');
        setSecondaryType('bulk');
        setSecondaryOpen(true);
    };
    const openEdit = (idx) => {
        setEditingIndex(idx);
        setSecondaryType('edit');
        setSecondaryOpen(true);
    };
    const closeSecondary = () => {
        setSecondaryOpen(false);
        setEditingIndex(null);
    };

    /* ---------------- helper render list chung ---------------- */
    const renderList = (arr, onPick, selectedValue) => (
        <div className={styles.list_menuwrap}>
            <div className="flex_col" style={{ gap: 3, padding: 8 }}>
                {arr.map((opt, i) => {
                    const val = typeof opt === 'string' ? opt : opt.name || opt.Name;
                    return (
                        <p
                            key={i}
                            onClick={() => onPick(val)}
                            className={styles.list_li}
                        >
                            {val}
                        </p>
                    );
                })}
            </div>
        </div>
    );

    /* ---------------- menu popup chính ---------------- */
    let programMenu;
    if (loadingProg) {
        programMenu = (
            <div className={styles.list_menuwrap}>
                <Loading content="đang tải..." />
            </div>
        );
    } else if (programs.length === 0) {
        programMenu = (
            <div className={styles.list_menuwrap}>
                <div style={{ padding: 12, color: '#555' }}>Chưa có chương trình</div>
            </div>
        );
    } else {
        programMenu = renderList(
            programs,
            (val) => {
                const obj = programs.find((p) => p.Name === val);
                setProgram(val);
                setProgramObj(obj);
                setOpenProgram(false);
            },
            program
        );
    }

    let areaMenu;
    if (loadingArea) {
        areaMenu = (
            <div className={styles.list_menuwrap}>
                <Loading content="đang tải..." />
            </div>
        );
    } else if (areas.length === 0) {
        areaMenu = (
            <div className={styles.list_menuwrap}>
                <div style={{ padding: 12, color: '#555' }}>Chưa có khu vực</div>
            </div>
        );
    } else {
        areaMenu = renderList(
            areas,
            (val) => {
                const obj = areas.find((a) => a.name === val);
                setArea(val);
                setAreaObj(obj);
                setOpenArea(false);
            },
            area
        );
    }

    let teacherMenu;
    if (loadingTeacher) {
        teacherMenu = (
            <div className={styles.list_menuwrap}>
                <Loading content="đang tải..." />
            </div>
        );
    } else if (teachersList.length === 0) {
        teacherMenu = (
            <div className={styles.list_menuwrap}>
                <div style={{ padding: 12, color: '#555' }}>Chưa có giáo viên</div>
            </div>
        );
    } else {
        const teacherNames = teachersList.map((u) => u.name);
        teacherMenu = renderList(
            teacherNames,
            (val) => {
                setTeacher(val);
                setOpenTeacher(false);
            },
            teacher
        );
    }

    /* ---------------- form thêm/chỉnh sửa single (popup 2) ---------------- */
    const SingleForm = ({ initialData = null, onSave }) => {
        const [day, setDay] = useState(
            initialData ? formatForDateInput(initialData.Day) : ''
        );
        const [topicObj, setTopicObj] = useState(
            initialData
                ? { id: initialData.ID, name: initialData.Topic }
                : { id: '', name: 'Chọn chủ đề' }
        );
        const [room, setRoom] = useState(
            initialData ? initialData.Room : 'Chọn phòng'
        );
        const [localTeacher, setLocalTeacher] = useState(
            initialData ? initialData.Teacher : teacher
        );

        const [openTopic, setOpenTopic] = useState(false);
        const [openRoom, setOpenRoom] = useState(false);
        const [openSingleTeacher, setOpenSingleTeacher] = useState(false);

        const [start, setStart] = useState(
            initialData ? initialData.Time.split('-')[0] : '08:00'
        );
        const [lesson, setLesson] = useState(initialData ? initialData.Lesson : 4);

        const topicList = programObj
            ? Object.entries(programObj.Topic).map(([id, info]) => ({
                id,
                name: info.Name,
                period: info.Period,
            }))
            : [];

        const roomList = areaObj ? areaObj.room : [];
        const teacherNames = teachersList.map((u) => u.name);

        const handleSave = (e) => {
            e.preventDefault();

            if (
                !day ||
                topicObj.name === 'Chọn chủ đề' ||
                room === 'Chọn phòng' ||
                localTeacher === 'Chọn giáo viên'
            ) {
                return;
            }

            const [h, m] = start.split(':').map(Number);
            const endMin = lesson * 45;
            const end = new Date(2000, 0, 1, h, m + endMin)
                .toTimeString()
                .slice(0, 5);

            const payload = {
                Day: day.split('-').reverse().join('/'),
                Topic: topicObj.name,
                Room: room,
                Time: `${start}-${end}`,
                Lesson: lesson,
                ID: initialData ? initialData.ID : topicObj.id,
                Image: '',
                Teacher: localTeacher,
                TeachingAs: '',
            };

            onSave(payload);
            closeSecondary();
        };

        const topicMenu =
            topicList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>Chưa có chủ đề</div>
                </div>
            ) : (
                <div className={styles.list_menuwrap}>
                    <div className="flex_col" style={{ gap: 3, padding: 8 }}>
                        {topicList.map((opt, i) => (
                            <p
                                key={i}
                                onClick={() => {
                                    setTopicObj(opt);
                                    setOpenTopic(false);
                                }}
                                className={styles.list_li}
                            >
                                {opt.name}
                            </p>
                        ))}
                    </div>
                </div>
            );

        const roomMenu =
            roomList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>Chưa có phòng</div>
                </div>
            ) : (
                renderList(roomList, (val) => {
                    setRoom(val);
                    setOpenRoom(false);
                }, room)
            );

        const singleTeacherMenu =
            teacherNames.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>Chưa có giáo viên</div>
                </div>
            ) : (
                renderList(teacherNames, (val) => {
                    setLocalTeacher(val);
                    setOpenSingleTeacher(false);
                }, localTeacher)
            );

        return (
            <form className={styles.popupForm} onSubmit={handleSave}>
                <div>
                    <TextNoti
                        title={initialData ? 'Chỉnh sửa buổi học' : 'Thông tin buổi học'}
                        color="blue"
                        mes="Thông tin buổi học là bắt buộc"
                    />
                </div>

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Chủ đề
                </p>
                <Menu
                    menuItems={topicMenu}
                    menuPosition="bottom"
                    isOpen={openTopic}
                    onOpenChange={setOpenTopic}
                    customButton={
                        <div
                            className={styles.selectBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenTopic(true);
                            }}
                        >
                            {topicObj.name}
                        </div>
                    }
                />

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Phòng học
                </p>
                <Menu
                    menuItems={roomMenu}
                    menuPosition="bottom"
                    isOpen={openRoom}
                    onOpenChange={setOpenRoom}
                    customButton={
                        <div
                            className={styles.selectBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenRoom(true);
                            }}
                        >
                            {room}
                        </div>
                    }
                />

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Giáo viên
                </p>
                <Menu
                    menuItems={singleTeacherMenu}
                    menuPosition="bottom"
                    isOpen={openSingleTeacher}
                    onOpenChange={setOpenSingleTeacher}
                    customButton={
                        <div
                            className={styles.selectBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenSingleTeacher(true);
                            }}
                        >
                            {localTeacher}
                        </div>
                    }
                />

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Ngày học
                </p>
                <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    required
                />

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Thời gian bắt đầu
                </p>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />

                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Số tiết
                </p>
                <input
                    type="number"
                    min="1"
                    value={lesson}
                    onChange={(e) => setLesson(+e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12 }}>
                    <button type="submit" className={styles.submit} style={{ fontWeight: 400 }}>
                        {initialData ? 'Cập nhật buổi học' : 'Lưu buổi học'}
                    </button>
                </div>
            </form>
        );
    };

    /* ---------------- form Bulk (popup 2) ---------------- */
    const BulkForm = () => {
        const topicEntries = programObj ? Object.entries(programObj.Topic) : [];
        const allTopics = topicEntries.map(([id, info]) => ({
            id,
            name: info.Name,
            lesson: info.Period,
        }));

        const [rows, setRows] = useState(
            allTopics.map((topic) => ({
                id: topic.id,
                name: topic.name,
                lesson: topic.lesson,
                day: '',
                start: '08:00',
                room: '',
                teacher: teacher,
                openRoom: false,
                openTeacher: false,
            }))
        );
        const [invalidRows, setInvalidRows] = useState(new Set());
        const [errorBulk, setErrorBulk] = useState('');

        const updateRow = (idx, field, value) => {
            setRows((prev) =>
                prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
            );
            setInvalidRows((prev) => {
                if (prev.has(idx)) {
                    const copy = new Set(prev);
                    copy.delete(idx);
                    return copy;
                }
                return prev;
            });
            if (errorBulk) setErrorBulk('');
        };

        const roomList = areaObj ? areaObj.room : [];
        const teacherNames = teachersList.map((u) => u.name);

        const getRoomMenu = (idx, selected) =>
            roomList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>Chưa có phòng</div>
                </div>
            ) : (
                renderList(roomList, (val) => {
                    updateRow(idx, 'room', val);
                    updateRow(idx, 'openRoom', false);
                }, selected)
            );

        const getTeacherMenu = (idx, selected) =>
            teacherNames.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>Chưa có giáo viên</div>
                </div>
            ) : (
                renderList(teacherNames, (val) => {
                    updateRow(idx, 'teacher', val);
                    updateRow(idx, 'openTeacher', false);
                }, selected)
            );

        const addRow = () => {
            const usedIds = new Set(rows.map((r) => r.id));
            const nextTopic = allTopics.find((t) => !usedIds.has(t.id));
            if (!nextTopic) return;
            setRows((prev) => [
                ...prev,
                {
                    id: nextTopic.id,
                    name: nextTopic.name,
                    lesson: nextTopic.lesson,
                    day: '',
                    start: '08:00',
                    room: '',
                    teacher: teacher,
                    openRoom: false,
                    openTeacher: false,
                },
            ]);
        };

        const removeRow = (idx) => {
            setRows((prev) => prev.filter((_, i) => i !== idx));
            setInvalidRows((prev) => {
                if (prev.has(idx)) {
                    const copy = new Set(prev);
                    copy.delete(idx);
                    return copy;
                }
                return prev;
            });
        };

        const handleSave = () => {
            const missingIndices = new Set();
            rows.forEach((r, i) => {
                if (!r.day || !r.room || !r.teacher) {
                    missingIndices.add(i);
                }
            });

            if (missingIndices.size > 0) {
                setInvalidRows(missingIndices);
                setErrorBulk(
                    'Có buổi học thiếu thông tin. Vui lòng điền đầy đủ và thử lại.'
                );
                return;
            }

            const newSessions = rows.map((r) => {
                const [h, m] = r.start.split(':').map(Number);
                const end = new Date(2000, 0, 1, h, m + r.lesson * 45)
                    .toTimeString()
                    .slice(0, 5);
                return {
                    Day: r.day.split('-').reverse().join('/'),
                    Topic: r.name,
                    Room: r.room,
                    Time: `${r.start}-${end}`,
                    Lesson: r.lesson,
                    ID: r.id,
                    Image: '',
                    Teacher: r.teacher,
                    TeachingAs: '',
                };
            });

            addMany(newSessions);
            closeSecondary();
        };

        const usedIds = new Set(rows.map((r) => r.id));
        const hasMore = allTopics.some((t) => !usedIds.has(t.id));

        return (
            <div className={styles.bulkContainer}>
                {errorBulk && (
                    <p className={styles.error} style={{ marginBottom: 8 }}>
                        {errorBulk}
                    </p>
                )}

                {rows.map((r, i) => (
                    <div
                        key={i}
                        className={`${styles.bulkItem} ${invalidRows.has(i) ? styles.errorBorder : ''
                            }`}
                    >
                        <div className={styles.bulkLine}>
                            <span className={styles.bulkId}>{i + 1}.</span>
                            <span className={styles.bulkTopic}>{r.name}</span>
                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => removeRow(i)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.bulkLine}>
                            <input
                                type="date"
                                value={r.day}
                                onChange={(e) => updateRow(i, 'day', e.target.value)}
                                className={styles.bulkInput}
                            />
                            <input
                                type="time"
                                value={r.start}
                                onChange={(e) => updateRow(i, 'start', e.target.value)}
                                className={styles.bulkInput}
                            />
                            <input
                                type="number"
                                min="1"
                                value={r.lesson}
                                onChange={(e) =>
                                    updateRow(i, 'lesson', +e.target.value)
                                }
                                className={styles.bulkInputSmall}
                            />
                        </div>

                        <div className={styles.bulkLine}>
                            <Menu
                                menuItems={getRoomMenu(i, r.room)}
                                menuPosition="bottom"
                                isOpen={r.openRoom}
                                onOpenChange={(val) => updateRow(i, 'openRoom', val)}
                                customButton={
                                    <div
                                        className={`${styles.selectBtn} ${!r.room ? styles.selectBtnWarning : ''
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateRow(i, 'openRoom', true);
                                        }}
                                    >
                                        {r.room || 'Chọn phòng'}
                                    </div>
                                }
                            />

                            <Menu
                                menuItems={getTeacherMenu(i, r.teacher)}
                                menuPosition="bottom"
                                isOpen={r.openTeacher}
                                onOpenChange={(val) => updateRow(i, 'openTeacher', val)}
                                customButton={
                                    <div
                                        className={`${styles.selectBtn} ${!r.teacher ? styles.selectBtnWarning : ''
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateRow(i, 'openTeacher', true);
                                        }}
                                    >
                                        {r.teacher || 'Chọn giáo viên'}
                                    </div>
                                }
                            />
                        </div>
                    </div>
                ))}
                <div className={styles.bulkActions}>
                    <button className={styles.submit} onClick={handleSave}>
                        Lưu tất cả
                    </button>
                    <button
                        type="button"
                        className={`${styles.addBtn} ${!hasMore ? styles.disabledBtn : ''
                            }`}
                        onClick={addRow}
                        disabled={!hasMore}
                        style={{ background: 'var(--green)' }}
                    >
                        + Thêm buổi
                    </button>
                </div>
            </div>
        );
    };

    const formatForDateInput = (dayString) => {
        const [dd, mm, yyyy] = dayString.split('/');
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    };

    /* ---------------- trạng thái API và thông báo ---------------- */
    const [isLoading, setIsLoading] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMessage, setNotiMessage] = useState('');

    /* ---------------- render Course Form (popup chính) ---------------- */
    const renderCourseForm = () => (
        <form className={styles.form} onSubmit={handleSaveCourse}>
            <TextNoti
                title="Thông tin khóa học"
                color="blue"
                mes="Thông tin khóa học là bắt buộc"
            />

            {/* CHƯƠNG TRÌNH */}
            <Menu
                menuItems={programMenu}
                menuPosition="bottom"
                isOpen={openProgram}
                onOpenChange={setOpenProgram}
                customButton={
                    <div
                        className={`${styles.selectBtn} ${program.startsWith('Chọn')
                            ? styles.selectBtnWarning
                            : ''
                            }`}
                    >
                        {program}
                    </div>
                }
            />

            {/* KHU VỰC */}
            <Menu
                menuItems={areaMenu}
                menuPosition="bottom"
                isOpen={openArea}
                onOpenChange={setOpenArea}
                customButton={
                    <div
                        className={`${styles.selectBtn} ${area.startsWith('Chọn')
                            ? styles.selectBtnWarning
                            : ''
                            }`}
                    >
                        {area}
                    </div>
                }
            />

            {/* GIÁO VIÊN */}
            <Menu
                menuItems={teacherMenu}
                menuPosition="bottom"
                isOpen={openTeacher}
                onOpenChange={setOpenTeacher}
                customButton={
                    <div
                        className={`${styles.selectBtn} ${teacher.startsWith('Chọn')
                            ? styles.selectBtnWarning
                            : ''
                            }`}
                    >
                        {teacher}
                    </div>
                }
            />

            {errorMsg && (
                <p className={styles.error} style={{ marginTop: 8 }}>
                    {errorMsg}
                </p>
            )}

            {/* LỊCH HỌC */}
            <TextNoti
                title="Lịch học"
                color="blue"
                mes="Bạn có thể thêm từng buổi hoặc tạo hàng loạt."
            />
            <div className={styles.scheduleAction}>
                <button type="button" className={styles.addBtn} onClick={openSingle}>
                    + Thêm buổi
                </button>
                <button type="button" className={styles.addBtn} onClick={openBulk}>
                    + Tạo toàn bộ
                </button>
            </div>

            <ScheduleList />

            <button type="submit" className={styles.submit}>
                Lưu khóa học
            </button>
        </form>
    );

    /* ---------------- xử lý lưu khóa học ---------------- */
    const handleSaveCourse = (e) => {
        e.preventDefault();
        if (
            program.startsWith('Chọn') ||
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            alert('Vui lòng chọn đủ chương trình, khu vực và giáo viên.');
            return;
        }
        if (schedules.length === 0) {
            alert('Bạn phải thêm ít nhất 1 buổi học.');
            return;
        }

        const code = programObj ? programObj.ID : '';

        const payload = {
            Name: program,
            Area: area,
            TeacherHR: teacher,
            Status: 'planning',
            TimeStart: schedules[0].Day.split('/').reverse().join('-'),
            TimeEnd: schedules.at(-1)?.Day.split('/').reverse().join('-'),
            Detail: schedules,
            code: code,
        };

        setIsLoading(true);
        fetch('/api/course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((r) =>
                r.json().then((j) => ({
                    ok: r.ok,
                    data: j,
                }))
            )
            .then(({ ok, data }) => {
                setIsLoading(false);
                if (ok) {
                    setNotiStatus(true);
                    setNotiMessage('Đã lưu khóa học thành công!');
                    setNotiOpen(true);
                } else {
                    setNotiStatus(false);
                    setNotiMessage(data.mes || 'Lỗi từ server');
                    setNotiOpen(true);
                }
            })
            .catch((err) => {
                setIsLoading(false);
                setNotiStatus(false);
                setNotiMessage(err.message || 'Không thể kết nối đến server');
                setNotiOpen(true);
            });
    };

    /* ---------------- hiển thị danh sách lịch ---------------- */
    const ScheduleList = () => {
        if (schedules.length === 0) {
            return <p className={styles.scheduleHint}>Chưa có buổi học nào</p>;
        }
        return (
            <div className={styles.scheduleList}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <p className="text_4">Danh sách buổi học</p>
                </div>
                {schedules.map((s, i) => {
                    const [startTime] = s.Time.split('-');

                    return (
                        <div key={i} className={styles.scheduleItem}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className={styles.scheduleIndex}>
                                    {i + 1}. {s.Topic}
                                </span>
                                <span className={styles.scheduleText}>
                                    {`${s.Day} – ${startTime} (${s.Lesson} tiết) – ${s.Room} – ${s.Teacher}`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div
                                    style={{
                                        width: 16,
                                        height: 16,
                                        padding: 8,
                                        borderRadius: 5,
                                        background: '#f8e7b2',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => openEdit(i)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 512 512"
                                        width={16}
                                        height={16}
                                        fill="#d89025"
                                    >
                                        <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z" />
                                    </svg>
                                </div>
                                <div
                                    style={{
                                        width: 16,
                                        height: 16,
                                        padding: 8,
                                        borderRadius: 5,
                                        background: '#ffdbcc',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => deleteSchedule(i)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 448 512"
                                        width={16}
                                        height={16}
                                        fill="var(--red)"
                                    >
                                        <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <div className={styles.button} onClick={openPopupHandler}>
                <svg viewBox="0 0 448 512" width="20" height="20" fill="#fff">
                    <path d="M64 32c-35.3 0-64 28.7-64 64v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V96c0-35.3-64-64-64-64H64zm136 312v-64h-64c-13.3 0-24-10.7-24-24s10.7-24 24-24h64v-64c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24h-64v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
                </svg>
                Thêm khóa học
            </div>

            <FlexiblePopup
                open={openPopup}
                onClose={closePopupHandler}
                title="Thêm khóa học mới"
                fetchData={null}
                data={[]}
                width={700}
                renderItemList={renderCourseForm}

                secondaryOpen={secondaryOpen}
                onCloseSecondary={closeSecondary}
                fetchDataSecondary={null}
                dataSecondary={[]}
                renderSecondaryList={() => {
                    if (secondaryType === 'single') {
                        return <SingleForm initialData={null} onSave={addSchedule} />;
                    }
                    if (secondaryType === 'edit' && editingIndex !== null) {
                        return (
                            <SingleForm
                                initialData={schedules[editingIndex]}
                                onSave={(updated) => updateScheduleAt(editingIndex, updated)}
                            />
                        );
                    }
                    return <BulkForm />;
                }}
                secondaryTitle={
                    secondaryType === 'single'
                        ? 'Thêm buổi học'
                        : secondaryType === 'edit'
                            ? 'Chỉnh sửa buổi học'
                            : 'Tạo lịch hàng loạt'
                }
            />

            {/* Loading toàn màn hình khi gọi API */}
            {isLoading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                >
                    <Loading content="Đang xử lý..." />
                </div>
            )}

            {/* Thông báo kết quả API */}
            <Noti
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
                status={notiStatus}
                mes={notiMessage}
                button={
                    <div
                        onClick={() => {
                            setNotiOpen(false);
                            if (notiStatus) {
                                closePopupHandler();
                            }
                        }}
                    >
                        Đóng
                    </div>
                }
            />
        </>
    );
}
