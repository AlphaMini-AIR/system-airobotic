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
import { Re_book } from '@/data/book';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Area, Svg_Course } from '@/components/(icon)/svg';
import ListArea from '../../ui/area-item'
import CreateArea from '../../ui/createarea';
import { Re_Area } from '@/data/area';

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

export default function Navbar({ data = [], book = [], user, areas = [] }) {
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

    const reloadDatabook = useCallback(async () => {
        setIsReloading(true)
        await Re_book()
        router.refresh()
        setIsReloading(false)
    }, []);

    const { counts, groups, areaOptions } = useMemo(() => {
        const result = {
            counts: { inProgress: 0, completed: 0, trial: 0, book: book.length },
            groups: { inProgress: [], completed: [], trial: [] },
            areaMap: new Map(),
        };

        data.forEach((c) => {
            if (c.Area && c.Area._id) { result.areaMap.set(c.Area._id, c.Area); }
            if (!c.Status && c.Type !== 'Học thử') { result.groups.inProgress.push(c) }
            else if (c.Status && c.Type === 'AI Robotic') { result.groups.completed.push(c) }
        });

        result.counts.inProgress = result.groups.inProgress.length;
        result.counts.completed = result.groups.completed.length;
        result.counts.trial = areas.length;

        return {
            counts: result.counts,
            groups: result.groups,
            areaOptions: Array.from(result.areaMap.values()),
        };
    }, [data, book]);

    counts.book = book.length;

    const courseFilter = useCallback(
        (c) => {
            if (area && c.Area._id !== area) return false;
            if (!search) return true;
            const q = search.trim().toLowerCase();
            return (
                c.ID.toLowerCase().includes(q) ||
                (c.TeacherHR && c.TeacherHR.name.toLowerCase().includes(q))
            );
        },
        [search, area]
    );

    const listForTab = useMemo(() => {
        switch (tab) {
            case 0:
                return groups.inProgress.filter(courseFilter);
            case 1:
                return groups.completed.filter(courseFilter);
            case 2:
                return groups.trial.filter(courseFilter);
            default:
                return book.filter(courseFilter);
        }
    }, [tab, groups, courseFilter]);

    const TABS = [
        { label: 'Khóa học đang học', count: counts.inProgress, icon: <BookIcon active={tab === 0} /> },
        { label: 'Khóa học hoàn thành', count: counts.completed, icon: <BookIcon active={tab === 1} /> },
        { label: 'Quản lý khu vực', count: counts.trial, icon: <Svg_Area w={18} h={18} c={tab === 2 ? '#ffffff' : 'var(--text-primary)'} /> },
        { label: 'Chương trình học', count: counts.book, icon: <Svg_Course w={18} h={18} c={tab === 3 ? '#ffffff' : 'var(--text-primary)'} /> },
    ];

    return (
        <>
            <div className={styles.sidebarContainer}>
                <div className={styles.tabNav}>
                    {TABS.map((t, i) => (
                        <div
                            key={t.label}
                            className={`${styles.tabItem} ${i === tab ? styles.active : ''}`}
                            onClick={() => setTab(i)}
                        >
                            <Nav
                                icon={t.icon}
                                title={t.label}
                                sl={t.count}
                                status={i === tab}
                            />
                        </div>
                    ))}
                </div>

                <div className={styles.searchBar}>
                    <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                        {tab !== 3 && tab !== 2 ? <>
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
                                {areaOptions.map((a, index) =>
                                    a && (
                                        <option key={index} value={a._id} className='text_6_400'>
                                            {a.name}
                                        </option>
                                    )
                                )}
                            </select>
                        </> : null}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {tab != 2 &&
                            <button
                                className={`btn-ac btn-re`}
                                onClick={tab !== 3 ? reloadData : reloadDatabook}
                                disabled={isReloading}
                            >
                                {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                            </button>}
                        {user.role.includes('Admin') || user.role.includes('Acadamic') ? <>
                            {tab !== 3 && tab !== 2 ? <Create /> : tab === 3 ? <CourseManagementPage /> : <CreateArea />}
                        </> : null}
                    </div>
                </div>

                <div className={styles.tabContent}>
                    {tab === 3 ? (
                        <ProgramList programs={book} />
                    ) : tab === 2 ? <ListArea programs={areas} /> : (
                        <>
                            {listForTab.length ? (
                                <div className={styles.listWrap}>
                                    {listForTab.map((c) => <CourseItem key={c.ID} data={c} />)}
                                </div>
                            ) : (
                                <p className={styles.empty}>Không tìm thấy khóa học phù hợp.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            {isReloading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loading content="Đang tải dữ liệu..." />
            </div>}
        </>
    );
}
