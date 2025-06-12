'use client';

import { useState, useMemo, useCallback } from 'react';
import Nav from '../../ui/nav-item';
import CourseItem from '../../ui/course-item';
import Create from '../../ui/create';
import styles from './index.module.css';
import { useRouter } from 'next/navigation';
import { Re_course_all } from '@/data/course';
import ProgramList from '../../ui/book-item';
import CourseManagementPage from '../../ui/createbook';

function BookIcon({ active }) {
    return (
        <svg
            viewBox="0 0 384 512"
            height="20"
            width="20"
            fill={active ? '#ffffff' : 'var(--text-primary)'}
            aria-hidden="true"
        >
            <path d="M0 48v439.7A24.3 24.3 0 0 0 24.3 512c5 0 9.9-1.5 14-4.4L192 400l153.7 107.6a24.4 24.4 0 0 0 14 4.4A24.3 24.3 0 0 0 384 487.7V48A48 48 0 0 0 336 0H48A48 48 0 0 0 0 48z" />
        </svg>
    );
}

export default function Navbar({ data = [], book = [] }) {
    const router = useRouter()
    const [isReloading, setIsReloading] = useState(false);
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');

    const reloadData = useCallback(async () => {
        setIsReloading(true)
        await Re_course_all()
        router.refresh()
        setIsReloading(false)
    }, []);

    const { counts, groups, areaOptions } = useMemo(() => {
        const result = {
            counts: { inProgress: 0, completed: 0, trial: 0, book: 0 },
            groups: { inProgress: [], completed: [], trial: [], book: [] },
            areaSet: new Set(),
        };

        data.forEach((c) => {
            result.areaSet.add(c.Area);
            if (!c.Status && c.Type !== 'Học thử') {
                result.counts.inProgress += 1;
                result.groups.inProgress.push(c);
            } else if (c.Status && c.Type === 'AI Robotic') {
                result.counts.completed += 1;
                result.groups.completed.push(c);
            } else if (c.Type === 'Học thử') {
                result.counts.trial += 1;
                result.groups.trial.push(c);
            }
        });

        return {
            counts: result.counts,
            groups: result.groups,
            areaOptions: [''].concat(Array.from(result.areaSet)),
        };
    }, [data, book]);
    counts.book = book.length;

    const courseFilter = useCallback(
        (c) => {
            if (area && c.Area !== area) return false;
            if (!search) return true;
            const q = search.trim().toLowerCase();
            return (
                c.ID.toLowerCase().includes(q) ||
                (c.TeacherHR && c.TeacherHR.toLowerCase().includes(q))
            );
        },
        [search, area]
    );

    /* --------- LẤY DANH SÁCH THEO TAB + FILTER TUỲ CHỌN --------- */
    const listForTab = useMemo(() => {
        switch (tab) {
            case 0:
                return groups.inProgress.filter(courseFilter);
            case 1:
                return groups.completed.filter(courseFilter);
            case 2:
                return groups.trial.filter(courseFilter);
            default:
                return groups.book.filter(courseFilter);
        }
    }, [tab, groups, courseFilter]);

    /* --------------- KHAI BÁO MẢNG TAB (không có JSX thừa) --------------- */
    const TABS = [
        { label: 'Khóa học đang học', count: counts.inProgress },
        { label: 'Khóa học hoàn thành', count: counts.completed },
        { label: 'Buổi học thử', count: counts.trial },
        { label: 'Chương trình học', count: counts.book },
    ];

    /* ---------------------------- JSX ---------------------------- */
    return (
        <div className={styles.sidebarContainer}>
            {/* ---------- NAVIGATION ---------- */}
            <div className={styles.tabNav}>
                {TABS.map((t, i) => (
                    <div
                        key={t.label}
                        className={`${styles.tabItem} ${i === tab ? styles.active : ''}`}
                        onClick={() => setTab(i)}
                    >
                        <Nav
                            icon={<BookIcon active={i === tab} />}
                            title={t.label}
                            sl={t.count}
                            status={i === tab}
                        />
                    </div>
                ))}
            </div>

            {/* ---------- THANH TÌM & LỌC ---------- */}
            <div className={styles.searchBar}>
                <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                    {tab !== 3 ? <>
                        <input
                            className={`${styles.searchInput} text_6_400`}
                            placeholder="Nhập ID khóa học hoặc tên GVCN"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className={styles.areaSelect}
                            style={{ color: 'var(--text-primary)' }}
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                        >
                            <option value="" className='text_6_400'>Tất cả khu vực</option>
                            {areaOptions.map(
                                (a) =>
                                    a && (
                                        <option key={a} value={a} className='text_6_400'>
                                            {a}
                                        </option>
                                    )
                            )}
                        </select>
                    </> : null}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className={`btn-ac btn-re`}
                        onClick={reloadData}
                        disabled={isReloading}
                    >
                        {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                    </button>
                    {tab !== 3 ? <Create /> : <CourseManagementPage />}
                </div>
            </div>

            {/* ---------- NỘI DUNG TAB ---------- */}
            <div className={styles.tabContent}>
                {tab === 3 ? (
                    <ProgramList programs={book} />
                ) : (
                    <>
                        {listForTab.length ? (
                            <div className={styles.listWrap}>
                                {listForTab.map((c) => (
                                    <CourseItem key={c.ID} data={c} />
                                ))}
                            </div>
                        ) : (
                            <p className={styles.empty}>Không tìm thấy khóa học phù hợp.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
