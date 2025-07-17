'use client';

import { useState, useMemo, useCallback } from 'react';
import SessionPopup from '../detaillesson';
import CareSessionPopup from './item';
import { formatDate } from '@/function';
import styles from './index.module.css';
import Menu from '@/components/(ui)/(button)/menu'; // Import Menu component

/* helpers */
const toDate = (day, hm) => {
    const [h, m] = hm.split(':').map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
};

export const attendInfo = (session, st) => {
    if (st.checkin) return { label: 'Có mặt', cls: styles.present };
    const [hStart] = session.time.split('-');
    return Date.now() < toDate(session.day, hStart)
        ? { label: 'Chưa điểm danh', cls: styles.pending }
        : { label: 'Vắng mặt', cls: styles.absent };
};

const careTxt = s => (s === 2 ? 'Đã theo học' : s === 0 ? 'Không theo' : 'Chưa chăm sóc');

// Định nghĩa các tùy chọn cho bộ lọc trạng thái chăm sóc
const CARE_FILTER_OPTIONS = {
    'all': 'Tất cả trạng thái CS',
    '1': 'Chưa chăm sóc',
    '2': 'Theo học',
    '0': 'Không theo',
};


export default function Student({ data, student, teacher = [], area = [], book = [] }) {
    const [q, setQ] = useState('');
    const [detailId, setDetailId] = useState(null);
    const [careOpen, setCareOpen] = useState(false);
    const [careSession, setCareSession] = useState(null);

    // 1. Thêm state cho bộ lọc trạng thái chăm sóc
    const [careFilter, setCareFilter] = useState('all');

    /* build rows */
    const rows = useMemo(() => {
        let out = [];
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        sessions.forEach(session => {
            session.students.forEach(st => {
                const careObj = st.statuses?.find(v => String(v.topic) === String(session._id));
                out.push({
                    id: `${session._id}-${st.studentId}`,
                    session,
                    studentRaw: st,
                    studentId: st.studentId,
                    name: st.name,
                    phone: st.phone || '',
                    attend: attendInfo(session, st),
                    careStatus: careObj?.status ?? 1,
                    note: careObj?.note || ''
                });
            });
        });

        // Sắp xếp để ưu tiên "Chưa chăm sóc" (careStatus === 1) lên đầu
        out.sort((a, b) => (b.careStatus === 1) - (a.careStatus === 1));

        // 2. Áp dụng bộ lọc trạng thái chăm sóc
        let filteredRows = careFilter === 'all'
            ? out
            : out.filter(r => r.careStatus === parseInt(careFilter));

        // Áp dụng bộ lọc tìm kiếm theo tên/sdt
        if (!q) return filteredRows;

        const kw = q.toLowerCase();
        return filteredRows.filter(r => r.name.toLowerCase().includes(kw) || r.phone.includes(kw));

    }, [data.sessions, q, careFilter]); // 3. Thêm careFilter vào dependency array

    const detailSession = useMemo(() => {
        if (!detailId) return null;
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        return sessions.find(s => String(s._id) === detailId);
    }, [detailId, data.sessions]);

    /* counters */
    const total = rows.length;
    const follow = rows.filter(r => r.careStatus === 2).length;
    const no = rows.filter(r => r.careStatus === 0).length;
    const wait = rows.filter(r => r.careStatus === 1).length;

    const changeCareStatus = useCallback(
        (nextStatus) =>
            setCareSession(cs => (cs ? { ...cs, careStatus: nextStatus } : cs)),
        []
    );

    // 4. Tạo JSX cho menu của bộ lọc
    const careFilterMenu = (
        <div className={styles.wrapitem}>
            {Object.entries(CARE_FILTER_OPTIONS).map(([value, label]) => (
                <p key={value} className={styles.itemmenu} onClick={() => setCareFilter(value)}>
                    {label}
                </p>
            ))}
        </div>
    );

    return (
        <>
            <div className={styles.mainContainer}>
                <div className={styles.topBar}>
                    <input
                        className='input'
                        style={{ width: 220 }}
                        placeholder='Tìm học sinh theo tên hoặc sđt...'
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />


                    <div className={styles.stats} style={{ justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <Menu
                                customButton={
                                    <div className='input' style={{ cursor: 'pointer' }}>
                                        <span className='text_6_400'>{CARE_FILTER_OPTIONS[careFilter]}</span>
                                    </div>
                                }
                                menuItems={careFilterMenu}
                            />
                        </div>
                        <span className={styles.stat} style={{ background: 'var(--main_b)' }}>Tổng: {total}</span>
                        <span className={styles.stat} style={{ background: 'var(--green)' }}>Theo học: {follow}</span>
                        <span className={styles.stat} style={{ background: 'var(--red)' }}>Không học: {no}</span>
                        <span className={styles.stat} style={{ background: 'var(--yellow)' }}>Chưa CS: {wait}</span>
                    </div>
                </div>

                <div className={styles.list}>
                    {rows.map(r => (
                        <div key={r.id} className={styles.rowWrap}>
                            <div
                                className={`${styles.item} ${r.attend.cls}`}
                                style={r.careStatus === 2 ? { opacity: .55, background: '#fefefe' } : undefined}
                                onClick={() => {
                                    setCareSession({
                                        ...r.session,
                                        ...r.studentRaw,
                                        // Đảm bảo topicId được truyền đúng tên `_id` của session
                                        topicId: r.session._id,
                                        attendLabel: r.attend.label,
                                        careStatus: r.careStatus,
                                        note: r.note
                                    });
                                    setCareOpen(true);
                                }}
                            >
                                {r.careStatus === 2 && <div className={styles.cared} style={{ justifyContent: 'center' }}>
                                    <p className='text_7' style={{ background: 'var(--green)', padding: 8, borderRadius: 5, color: 'white' }}>{careTxt(r.careStatus)}</p>
                                </div>}
                                <div className={styles.gr}><p className='text_6_400'>Tên học sinh</p><p className='text_6'>{r.name}</p></div>
                                <div className={styles.gr}><p className='text_6_400'>Trạng thái học thử</p><p className='text_6'>{r.attend.label}</p></div>
                                <div className={styles.gr}><p className='text_6_400'>Trạng thái chăm sóc</p><p className='text_6'>{careTxt(r.careStatus)}</p></div>
                            </div>

                            <div
                                className={styles.sessionInfo}
                                onClick={() => setDetailId(r.session._id)}
                            >
                                <p className='text_6'>Chủ đề: {r.session.topic?.Name || 'Chưa có'}</p>
                                <p className='text_6_400'>Thời gian: {r.session.time} – {formatDate(new Date(r.session.day))}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {detailSession && (
                <SessionPopup
                    open
                    onClose={() => setDetailId(null)}
                    session={detailSession}
                    student={student}
                    teacher={teacher}
                    area={area}
                    book={book}
                />
            )}

            {careSession && (
                <CareSessionPopup
                    open={careOpen}
                    onClose={() => setCareOpen(false)}
                    session={careSession}
                    onChangeStatus={changeCareStatus}
                />
            )}
        </>
    )
}