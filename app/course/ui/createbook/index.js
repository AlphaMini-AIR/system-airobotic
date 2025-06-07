'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './index.module.css';

import FlexiblePopup from '@/components/(popup)/popup_right';
import TextNoti from '@/components/(noti)/textnoti';
import Loading from '@/components/(loading)/loading';
import Menu from '@/components/(button)/menu';
import Noti from '@/components/(noti)/noti';

import { useRouter } from 'next/navigation';
import { Data_book } from '@/data/book';
import { Read_Area } from '@/data/area';
import { Data_user } from '@/data/users';
import { Re_course_all } from '@/data/course';

export default function Create() {
    const router = useRouter();

    /* ----------------------------------------------------------------
     *  STATE CHUNG CỦA POPUP CHÍNH
     * ---------------------------------------------------------------- */
    const [openPopup, setOpenPopup] = useState(false);
    const openPopupHandler = useCallback(() => setOpenPopup(true), []);
    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setSecondaryOpen(false);
        setErrorMsg('');
        setNotiOpen(false);          // reset thông báo
    }, []);

    /* ----------------------------------------------------------------
     *  THÔNG TIN KHÓA HỌC (FORM CHÍNH)
     * ---------------------------------------------------------------- */
    const [program, setProgram] = useState('Chọn chương trình');
    const [programObj, setProgramObj] = useState(null);

    const [courseType, setCourseType] = useState('Chọn loại'); // <--- NEW
    const courseTypes = ['AI Robotic', 'Học thử'];              // <--- NEW
    const [openType, setOpenType] = useState(false);           // <--- NEW

    const [area, setArea] = useState('Chọn khu vực');
    const [areaObj, setAreaObj] = useState(null);

    const [teacher, setTeacher] = useState('Chọn giáo viên');

    const [errorMsg, setErrorMsg] = useState('');

    /* ----------------------------------------------------------------
     *  MENU STATE (CHÍNH)
     * ---------------------------------------------------------------- */
    const [openProgram, setOpenProgram] = useState(false);
    const [openArea, setOpenArea] = useState(false);
    const [openTeacher, setOpenTeacher] = useState(false);

    /* ----------------------------------------------------------------
     *  FETCH DỮ LIỆU CHO CHỌN PROGRAM
     * ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
     *  FETCH DỮ LIỆU CHO CHỌN AREA
     * ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
     *  FETCH DỮ LIỆU CHO CHỌN TEACHER
     * ---------------------------------------------------------------- */
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

    /* ----------------------------------------------------------------
     *  QUẢN LÝ LỊCH HỌC
     * ---------------------------------------------------------------- */
    const [schedules, setSchedules] = useState([]);
    const addSchedule = (item) => setSchedules((prev) => [...prev, item]);
    const addMany = (arr) => setSchedules((prev) => [...prev, ...arr]);
    const updateScheduleAt = (idx, newItem) =>
        setSchedules((prev) => prev.map((s, i) => (i === idx ? newItem : s)));
    const deleteSchedule = (idx) =>
        setSchedules((prev) => prev.filter((_, i) => i !== idx));

    /* ----------------------------------------------------------------
     *  POPUP THỨ CẤP (THÊM / SỬA BUỔI HỌC)
     * ---------------------------------------------------------------- */
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState(null); // 'single' | 'bulk' | 'edit'
    const [editingIndex, setEditingIndex] = useState(null);

    const openSingle = () => {
        if (
            program.startsWith('Chọn') ||
            courseType.startsWith('Chọn') ||  /* NEW */
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            setErrorMsg(
                'Vui lòng chọn đầy đủ chương trình, loại khóa, khu vực và giáo viên trước khi thêm lịch.'
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
            courseType.startsWith('Chọn') ||  /* NEW */
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            setErrorMsg(
                'Vui lòng chọn đầy đủ chương trình, loại khóa, khu vực và giáo viên trước khi tạo lịch hàng loạt.'
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

    /* ----------------------------------------------------------------
     *  HÀM DÙNG CHUNG VẼ MENU LIST
     * ---------------------------------------------------------------- */
    const renderList = (arr, onPick, selected) => (
        <div className={styles.list_menuwrap}>
            <div className="flex_col" style={{ gap: 3, padding: 8 }}>
                {arr.map((opt, i) => {
                    const val =
                        typeof opt === 'string' ? opt : opt.name || opt.Name;
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

    /* ----------------------------------------------------------------
     *  MENU: PROGRAM
     * ---------------------------------------------------------------- */
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
                <div style={{ padding: 12, color: '#555' }}>
                    Chưa có chương trình
                </div>
            </div>
        );
    } else {
        programMenu = renderList(programs, (val) => {
            const obj = programs.find((p) => p.Name === val);
            setProgram(val);
            setProgramObj(obj);
            setOpenProgram(false);
        }, program);
    }

    /* ----------------------------------------------------------------
     *  MENU: AREA
     * ---------------------------------------------------------------- */
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
                <div style={{ padding: 12, color: '#555' }}>
                    Chưa có khu vực
                </div>
            </div>
        );
    } else {
        areaMenu = renderList(areas, (val) => {
            const obj = areas.find((a) => a.name === val);
            setArea(val);
            setAreaObj(obj);
            setOpenArea(false);
        }, area);
    }

    /* ----------------------------------------------------------------
     *  MENU: TEACHER
     * ---------------------------------------------------------------- */
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
                <div style={{ padding: 12, color: '#555' }}>
                    Chưa có giáo viên
                </div>
            </div>
        );
    } else {
        const teacherNames = teachersList.map((u) => u.name);
        teacherMenu = renderList(teacherNames, (val) => {
            setTeacher(val);
            setOpenTeacher(false);
        }, teacher);
    }

    /* ----------------------------------------------------------------
     *  MENU: COURSE TYPE  (NEW)
     * ---------------------------------------------------------------- */
    const typeMenu = renderList(courseTypes, (val) => {
        setCourseType(val);
        setOpenType(false);
    }, courseType);

    /* ----------------------------------------------------------------
     *  COMPONENT: FORM THÊM / SỬA 1 BUỔI HỌC (popup 2)
     * ---------------------------------------------------------------- */
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

        /* ----------------------------------------------------------------
         *  DỮ LIỆU CHỨC NĂNG
         * ---------------------------------------------------------------- */
        const topicList = programObj
            ? Object.entries(programObj.Topic).map(([id, info]) => ({
                id,
                name: info.Name,
                period: info.Period,
            }))
            : [];

        const roomList = areaObj ? areaObj.room : [];
        const teacherNames = teachersList.map((u) => u.name);

        /* ----------------------------------------------------------------
         *  XỬ LÝ LƯU 1 BUỔI
         * ---------------------------------------------------------------- */
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

        /* ----------------------------------------------------------------
         *  MENU CHỦ ĐỀ
         * ---------------------------------------------------------------- */
        const topicMenu =
            topicList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>
                        Chưa có chủ đề
                    </div>
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

        /* ----------------------------------------------------------------
         *  MENU PHÒNG
         * ---------------------------------------------------------------- */
        const roomMenu =
            roomList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>
                        Chưa có phòng
                    </div>
                </div>
            ) : (
                renderList(roomList, (val) => {
                    setRoom(val);
                    setOpenRoom(false);
                }, room)
            );

        /* ----------------------------------------------------------------
         *  MENU GIÁO VIÊN
         * ---------------------------------------------------------------- */
        const singleTeacherMenu =
            teacherNames.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>
                        Chưa có giáo viên
                    </div>
                </div>
            ) : (
                renderList(teacherNames, (val) => {
                    setLocalTeacher(val);
                    setOpenSingleTeacher(false);
                }, localTeacher)
            );

        /* ----------------------------------------------------------------
         *  JSX TRẢ VỀ
         * ---------------------------------------------------------------- */
        console.log(topicMenu);

        return (
            <form className={styles.popupForm} onSubmit={handleSave}>
                <div>
                    <TextNoti
                        title={
                            initialData ? 'Chỉnh sửa buổi học' : 'Thông tin buổi học'
                        }
                        color="blue"
                        mes="Thông tin buổi học là bắt buộc"
                    />
                </div>

                {/* Chủ đề ------------------------------------------------ */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>Chủ đề</p>
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

                {/* Phòng ------------------------------------------------- */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>Phòng học</p>
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

                {/* Giáo viên -------------------------------------------- */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>Giáo viên</p>
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

                {/* Ngày học --------------------------------------------- */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>Ngày học</p>
                <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    required
                />

                {/* Thời gian bắt đầu ------------------------------------ */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>
                    Thời gian bắt đầu
                </p>
                <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />

                {/* Số tiết --------------------------------------------- */}
                <p className="text_6_400" style={{ marginBottom: 4 }}>Số tiết</p>
                <input
                    type="number"
                    min="1"
                    value={lesson}
                    onChange={(e) => setLesson(+e.target.value)}
                />

                {/* Submit ----------------------------------------------- */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginTop: 12,
                    }}
                >
                    <button
                        type="submit"
                        className={styles.submit}
                        style={{ fontWeight: 400 }}
                    >
                        {initialData ? 'Cập nhật buổi học' : 'Lưu buổi học'}
                    </button>
                </div>
            </form>
        );
    };

    /* ----------------------------------------------------------------
     *  COMPONENT: FORM TẠO NHIỀU BUỔI HỌC (popup 2)
     * ---------------------------------------------------------------- */
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

        /* ---------------- helper chỉnh sửa ---------------- */
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

        /* ---------------- menu room ---------------- */
        const getRoomMenu = (idx, selected) =>
            roomList.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>
                        Chưa có phòng
                    </div>
                </div>
            ) : (
                renderList(roomList, (val) => {
                    updateRow(idx, 'room', val);
                    updateRow(idx, 'openRoom', false);
                }, selected)
            );

        /* ---------------- menu teacher -------------- */
        const getTeacherMenu = (idx, selected) =>
            teacherNames.length === 0 ? (
                <div className={styles.list_menuwrap}>
                    <div style={{ padding: 12, color: '#555' }}>
                        Chưa có giáo viên
                    </div>
                </div>
            ) : (
                renderList(teacherNames, (val) => {
                    updateRow(idx, 'teacher', val);
                    updateRow(idx, 'openTeacher', false);
                }, selected)
            );

        /* ---------------- thêm / xoá hàng ------------ */
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

        /* ---------------- lưu toàn bộ ------------- */
        const handleSave = () => {
            const missing = new Set();
            rows.forEach((r, i) => {
                if (!r.day || !r.room || !r.teacher) missing.add(i);
            });

            if (missing.size > 0) {
                setInvalidRows(missing);
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

        /* ---------------- JSX return ------------ */
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
                        {/* dòng tiêu đề */}
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

                        {/* dòng date - time - lesson */}
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
                                onChange={(e) =>
                                    updateRow(i, 'start', e.target.value)
                                }
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

                        {/* dòng room & teacher */}
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
                                onOpenChange={(val) =>
                                    updateRow(i, 'openTeacher', val)
                                }
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

                {/* cuối form bulk */}
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

    /* ----------------------------------------------------------------
     *  ĐỔI DD/MM/YYYY -> YYYY-MM-DD (date input)
     * ---------------------------------------------------------------- */
    const formatForDateInput = (dayString) => {
        const [dd, mm, yyyy] = dayString.split('/');
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    };

    /* ----------------------------------------------------------------
     *  TRẠNG THÁI GỌI API & NOTI
     * ---------------------------------------------------------------- */
    const [isLoading, setIsLoading] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMessage, setNotiMessage] = useState('');

    /* ----------------------------------------------------------------
     *  RENDER FORM KHÓA HỌC (POPUP CHÍNH)
     * ---------------------------------------------------------------- */
    const renderCourseForm = () => (
        <form className={styles.form} onSubmit={handleSaveCourse}>
            <TextNoti
                title="Thông tin khóa học"
                color="blue"
                mes="Thông tin khóa học là bắt buộc"
            />

            {/* CHƯƠNG TRÌNH ------------------------------------------- */}
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

            {/* LOẠI KHÓA HỌC (NEW) ------------------------------------ */}
            <Menu
                menuItems={typeMenu}
                menuPosition="bottom"
                isOpen={openType}
                onOpenChange={setOpenType}
                customButton={
                    <div
                        className={`${styles.selectBtn} ${courseType.startsWith('Chọn')
                            ? styles.selectBtnWarning
                            : ''
                            }`}
                    >
                        {courseType}
                    </div>
                }
            />

            {/* KHU VỰC ----------------------------------------------- */}
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

            {/* GIÁO VIÊN --------------------------------------------- */}
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

            {/* LỊCH HỌC ---------------------------------------------- */}
            <TextNoti
                title="Lịch học"
                color="blue"
                mes="Bạn có thể thêm từng buổi hoặc tạo hàng loạt."
            />
            <div className={styles.scheduleAction}>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={openSingle}
                >
                    + Thêm buổi
                </button>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={openBulk}
                >
                    + Tạo toàn bộ
                </button>
            </div>

            <ScheduleList />

            <button type="submit" className={styles.submit}>
                Lưu khóa học
            </button>
        </form>
    );

    /* ----------------------------------------------------------------
     *  HANDLE SUBMIT KHÓA HỌC
     * ---------------------------------------------------------------- */
    const handleSaveCourse = (e) => {
        e.preventDefault();

        if (
            program.startsWith('Chọn') ||
            courseType.startsWith('Chọn') || /* NEW */
            area.startsWith('Chọn') ||
            teacher.startsWith('Chọn')
        ) {
            alert(
                'Vui lòng chọn đủ chương trình, loại khóa, khu vực và giáo viên chủ nhiệm.'
            );
            return;
        }
        if (schedules.length === 0) {
            alert('Bạn phải thêm ít nhất 1 buổi học.');
            return;
        }

        const code = programObj ? programObj.ID : '';

        const payload = {
            Name: program,
            Type: courseType, /* NEW */
            Area: area,
            TeacherHR: teacher,
            Status: 'planning',
            TimeStart: schedules[0].Day.split('/').reverse().join('-'),
            TimeEnd: schedules.at(-1)?.Day.split('/').reverse().join('-'),
            Detail: schedules,
            code,
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
                    Re_course_all();
                    router.refresh();
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

    /* ----------------------------------------------------------------
     *  COMPONENT HIỂN THỊ DANH SÁCH BUỔI HỌC
     * ---------------------------------------------------------------- */
    const ScheduleList = () => {
        if (schedules.length === 0) {
            return (
                <p className={styles.scheduleHint}>Chưa có buổi học nào</p>
            );
        }
        return (
            <div className={styles.scheduleList}>
                <div
                    style={{
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--border-color)',
                    }}
                >
                    <p className="text_4">Danh sách buổi học</p>
                </div>
                {schedules.map((s, i) => {
                    const [startTime] = s.Time.split('-');

                    return (
                        <div key={i} className={styles.scheduleItem}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}
                            >
                                <span className={styles.scheduleIndex}>
                                    {i + 1}. {s.Topic}
                                </span>
                                <span className={styles.scheduleText}>
                                    {`${s.Day} – ${startTime} (${s.Lesson} tiết) – ${s.Room} – ${s.Teacher}`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {/* EDIT */}
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
                                        <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32S209.7 64 192 64L96 64z" />
                                    </svg>
                                </div>
                                {/* DELETE */}
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

    /* ----------------------------------------------------------------
     *  JSX CHÍNH TRẢ VỀ
     * ---------------------------------------------------------------- */
    return (
        <>
            {/* Button mở popup */}
            <div className={styles.button} onClick={openPopupHandler}>
                <svg viewBox="0 0 448 512" width="20" height="20" fill="#fff">
                    <path d="M64 32c-35.3 0-64 28.7-64 64v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V96c0-35.3-64-64-64-64H64zm136 312v-64h-64c-13.3 0-24-10.7-24-24s10.7-24 24-24h64v-64c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24h-64v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
                </svg>
                Thêm khóa học
            </div>

            {/* Popup chính / Popup phụ */}
            <FlexiblePopup
                open={openPopup}
                onClose={closePopupHandler}
                title="Thêm khóa học mới"
                fetchData={null}
                data={[]}
                width={700}
                renderItemList={renderCourseForm}
                /* popup phụ */
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
                                onSave={(updated) =>
                                    updateScheduleAt(editingIndex, updated)
                                }
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

            {/* Loading full-screen */}
            {isLoading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                >
                    <Loading content="Đang xử lý..." />
                </div>
            )}

            {/* Notification */}
            <Noti
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
                status={notiStatus}
                mes={notiMessage}
                button={
                    <div
                        className={styles.bnt}
                        onClick={() => {
                            setNotiOpen(false);
                            if (notiStatus) closePopupHandler();
                        }}
                    >
                        Đóng
                    </div>
                }
            />
        </>
    );
}
