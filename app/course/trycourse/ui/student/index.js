'use client'

import { useState, useMemo, useCallback } from 'react'
import SessionPopup from '../detaillesson'
import CareSessionPopup from './item'
import { formatDate } from '@/function'
import styles from './index.module.css'

/* helpers */
const toDate = (day, hm) => {
    const [h, m] = hm.split(':').map(Number)
    const d = new Date(day)
    d.setHours(h, m, 0, 0)
    return d
}

export const attendInfo = (session, st) => {
    if (st.checkin) return { label: 'Có mặt', cls: styles.present }
    const [hStart] = session.time.split('-')
    return Date.now() < toDate(session.day, hStart)
        ? { label: 'Chưa điểm danh', cls: styles.pending }
        : { label: 'Vắng mặt', cls: styles.absent }
}

const careTxt = s => (s === 2 ? 'Đã theo học' : s === 0 ? 'Không theo' : 'Chưa chăm sóc')

// 1. Cập nhật props để nhận thêm teacher, area, và book
export default function Student({ data, student, teacher = [], area = [], book = [] }) {
    const [q, setQ] = useState('')
    // 2. Chỉ lưu ID của session đang được chọn để tránh dữ liệu cũ
    const [detailId, setDetailId] = useState(null)
    const [careOpen, setCareOpen] = useState(false)
    const [careSession, setCareSession] = useState(null)

    const rows = useMemo(() => {
        const out = []
        // Đảm bảo data.sessions là một mảng an toàn
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        sessions.forEach(session => {
            session.students.forEach(st => {
                const careObj = st.statuses?.find(v => String(v.topic) === String(session._id))
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
                })
            })
        })
        if (!q) return out
        const kw = q.toLowerCase()
        return out.filter(r => r.name.toLowerCase().includes(kw) || r.phone.includes(kw))
    }, [data.sessions, q])

    // 3. Tìm đối tượng session đầy đủ từ `data.sessions` (luôn mới nhất) bằng ID đã lưu
    const detailSession = useMemo(() => {
        if (!detailId) return null;
        // Đảm bảo data.sessions là một mảng an toàn
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        return sessions.find(s => String(s._id) === detailId);
    }, [detailId, data.sessions]);

    /* counters */
    const total = rows.length
    const follow = rows.filter(r => r.careStatus === 2).length
    const no = rows.filter(r => r.careStatus === 0).length
    const wait = rows.filter(r => r.careStatus === 1).length

    /* đổi trạng thái */
    const changeCareStatus = useCallback(
        (nextStatus) =>
            setCareSession(cs => (cs ? { ...cs, careStatus: nextStatus } : cs)),
        []
    )

    return (
        <>
            <div className={styles.mainContainer}>
                <div className={styles.topBar}>
                    <input
                        className='input'
                        style={{ width: 320 }}
                        placeholder='Tìm học sinh theo tên hoặc sđt...'
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />
                    <div className={styles.stats}>
                        <span className={styles.stat} style={{ background: 'var(--main_b)' }}>Tổng: {total}</span>
                        <span className={styles.stat} style={{ background: 'var(--green)' }}>Theo học: {follow}</span>
                        <span className={styles.stat} style={{ background: 'var(--red)' }}>Không học: {no}</span>
                        <span className={styles.stat} style={{ background: 'var(--yellow)' }}>Chưa CS: {wait}</span>
                    </div>
                </div>

                <div className={styles.list}>
                    {rows.map(r => (
                        <div key={r.id} className={styles.rowWrap}>
                            {/* student column */}
                            <div
                                className={`${styles.item} ${r.attend.cls}`}
                                style={r.careStatus === 2 ? { opacity: .55, background: 'var(--green)' } : undefined}
                                onClick={() => {
                                    setCareSession({
                                        ...r.session,
                                        ...r.studentRaw,
                                        attendLabel: r.attend.label,
                                        careStatus: r.careStatus,
                                        note: r.note
                                    })
                                    setCareOpen(true)
                                }}
                            >
                                {r.careStatus === 2 && <span className={styles.cared}>Đã chăm sóc</span>}
                                <div className={styles.gr}><p className='text_6_400'>Tên học sinh</p><p className='text_6'>{r.name}</p></div>
                                <div className={styles.gr}><p className='text_6_400'>Trạng thái học thử</p><p className='text_6'>{r.attend.label}</p></div>
                                <div className={styles.gr}><p className='text_6_400'>Trạng thái chăm sóc</p><p className='text_6'>{careTxt(r.careStatus)}</p></div>
                            </div>

                            {/* session column */}
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

            {/* 4. Truyền đầy đủ props cho SessionPopup */}
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