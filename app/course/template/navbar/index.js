'use client';

import { useState, useMemo, useCallback } from 'react';
import Nav from '../../ui/nav-item';
// import CourseItem from '../../ui/course-item';
import styles from './index.module.css';

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

export default function Navbar({ data }) {
    const courses = Array.isArray(data) ? data : [];

    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');

    // 2. Dùng `courses` thay vì `data` để tính counts, groups, areaOptions
    const { counts, groups, areaOptions } = useMemo(() => {
        const result = {
            counts: { inProgress: 0, completed: 0, trial: 0, review: 0 },
            groups: { inProgress: [], completed: [], trial: [], review: [] },
            areaSet: new Set(),
        };

        courses.forEach((c) => {
            // Nếu c là null/undefined, bỏ qua
            if (!c) return;

            // Lấy khu vực (Area) nếu có
            if (c.Area) {
                result.areaSet.add(c.Area);
            }

            // Phân loại vào các nhóm
            if (!c.Status && c.Type !== 'Học thử') {
                result.counts.inProgress += 1;
                result.groups.inProgress.push(c);
            } else if (c.Status && c.Type === 'AI Robotic') {
                result.counts.completed += 1;
                result.groups.completed.push(c);
            } else if (c.Type === 'Học thử') {
                result.counts.trial += 1;
                result.groups.trial.push(c);
            } else {
                result.counts.review += 1;
                result.groups.review.push(c);
            }
        });

        return {
            counts: result.counts,
            groups: result.groups,
            // Luôn có ít nhất một phần tử rỗng '' để hiển thị “Tất cả khu vực”
            areaOptions: [''].concat(Array.from(result.areaSet)),
        };
    }, [courses]);

    // 3. Hàm lọc khóa học theo từ khoá (search) và khu vực (area)
    const courseFilter = useCallback(
        (c) => {
            if (!c) return false; // tránh xem c là undefined/null
            if (area && c.Area !== area) return false;

            if (!search) return true;
            const q = search.trim().toLowerCase();

            // Kiểm tra ID (chuỗi) và TeacherHR (có thể undefined) một cách an toàn
            const idMatches = typeof c.ID === 'string' && c.ID.toLowerCase().includes(q);
            const teacherMatches =
                typeof c.TeacherHR === 'string' && c.TeacherHR.toLowerCase().includes(q);

            return idMatches || teacherMatches;
        },
        [search, area]
    );

    // 4. Lấy danh sách theo tab hiện tại, luôn kiểm tra an toàn để tránh listForTab = undefined
    const listForTab = useMemo(() => {
        const getGroup = (groupArray) => Array.isArray(groupArray) ? groupArray : [];

        switch (tab) {
            case 0:
                return getGroup(groups.inProgress).filter(courseFilter);
            case 1:
                return getGroup(groups.completed).filter(courseFilter);
            case 2:
                return getGroup(groups.trial).filter(courseFilter);
            default:
                return getGroup(groups.review).filter(courseFilter);
        }
    }, [tab, groups, courseFilter]);

    // 5. Khai báo mảng TABS (dùng để hiển thị số lượng và nhãn)
    const TABS = [
        { label: 'Khóa học đang học', count: counts.inProgress },
        { label: 'Khóa học hoàn thành', count: counts.completed },
        { label: 'Buổi học thử', count: counts.trial },
        { label: 'Khóa ôn luyện', count: counts.review },
    ];

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
                        <option value="" className="text_6_400">
                            Tất cả khu vực
                        </option>
                        {areaOptions.map((a) =>
                            a ? (
                                <option key={a} value={a} className="text_6_400">
                                    {a}
                                </option>
                            ) : null
                        )}
                    </select>
                </div>
                {/* <Create /> */}
            </div>

            {/* ---------- NỘI DUNG TAB ---------- */}
            <div className={styles.tabContent}>
                {Array.isArray(listForTab) && listForTab.length > 0 ? (
                    <div className={styles.listWrap}>
                        {/* {listForTab.map((c) => (
                            // Nếu c có thể là undefined, bạn có thể kiểm tra trước khi render CourseItem
                            // c ? <CourseItem key={c.ID} data={c} /> : null
                        ))} */}
                    </div>
                ) : (
                    <p className={styles.empty}>Không tìm thấy khóa học phù hợp.</p>
                )}
            </div>
        </div>
    );
}
