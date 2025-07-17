'use client'

import { useState, useMemo } from 'react'
import Menu from '@/components/(ui)/(button)/menu'
import TextNoti from '@/components/(features)/(noti)/textnoti'
import SessionPopup from './ui/detaillesson'
import { formatDate } from '@/function'
import styles from './index.module.css'

const buildDate = (d, h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)

const statusOf = s => {
    if (!s.time || !s.day) return { label: 'Lỗi dữ liệu', color: styles.gray, weight: 3, end: new Date() };
    const [st, et] = s.time.split('-')
    const [sh, sm] = st.split(':').map(Number)
    const [eh, em] = et.split(':').map(Number)
    const base = new Date(s.day)
    const start = buildDate(base, sh, sm)
    const end = buildDate(base, eh, em)
    const now = new Date()

    if (now < start) return { label: 'Chưa diễn ra', color: styles.orange, weight: 0, end }
    if (now > end) return { label: 'Đã diễn ra', color: styles.gray, weight: 2, end }
    return { label: 'Đang diễn ra', color: styles.blue, weight: 1, end }
}

export default function CourseTryFilter({ data, student, teacher = [], area = [], book = [] }) {
    const [statusFilter, setStatusFilter] = useState('all')
    const [teacherFilter, setTeacherFilter] = useState('all')
    const [activeSessionId, setActiveSessionId] = useState(null)

    const statusText = {
        all: 'Tất cả trạng thái',
        before: 'Chưa diễn ra',
        now: 'Đang diễn ra',
        done: 'Đã diễn ra'
    }

    const statusMenu = (
        <div className={styles.wrapitem}>
            {Object.entries(statusText).map(([k, v]) => (
                <p key={k} className={styles.item} onClick={() => setStatusFilter(k)}>
                    {v}
                </p>
            ))}
        </div>
    )

    const teacherMenu = (
        <div className={styles.wrapitem}>
            <p className={styles.item} onClick={() => setTeacherFilter('all')}>Tất cả giáo viên</p>
            {teacher.map(t => (
                <p key={t._id} className={styles.item} onClick={() => setTeacherFilter(t._id)}>
                    {t.name}
                </p>
            ))}
        </div>
    )

    const Select = ({ value, menu }) => (
        <Menu
            buttonContent={value}
            menuItems={menu}
            customButton={
                <div className='input' style={{ cursor: 'pointer' }}>
                    <span className='text_6_400'>{value}</span>
                </div>
            }
        />
    )

    const sessionsSorted = useMemo(() => {
        const sessions = Array.isArray(data?.sessions) ? data.sessions : []
        return sessions
            .map(s => ({ ...s, _st: statusOf(s) }))
            .filter(s => {
                if (statusFilter === 'before' && s._st.weight !== 0) return false
                if (statusFilter === 'now' && s._st.weight !== 1) return false
                if (statusFilter === 'done' && s._st.weight !== 2) return false
                if (teacherFilter !== 'all' && String(s.teacher?._id) !== teacherFilter) return false
                return true
            })
            .sort((a, b) =>
                a._st.weight !== b._st.weight ? a._st.weight - b._st.weight : a._st.end - b._st.end
            )
    }, [data, statusFilter, teacherFilter])

    const activeSession = useMemo(() => {
        if (!activeSessionId) return null
        return sessionsSorted.find(s => s._id === activeSessionId)
    }, [activeSessionId, sessionsSorted])

    return (
        <>
            {activeSession && (
                <SessionPopup
                    open
                    onClose={() => setActiveSessionId(null)}
                    session={activeSession}
                    student={student}
                    teacher={teacher}
                    area={area}
                    book={book}
                />
            )}

            <div className={styles.filterBar}>
                <Select value={statusText[statusFilter]} menu={statusMenu} />
                <Select
                    value={
                        teacherFilter === 'all'
                            ? 'Tất cả giáo viên'
                            : teacher.find(t => t._id === teacherFilter)?.name
                    }
                    menu={teacherMenu}
                />
            </div>

            <div className={styles.listWrapper}>
                {sessionsSorted.length === 0 ? (
                    <TextNoti
                        title='Không có buổi học phù hợp'
                        mes='Thay đổi bộ lọc để xem các buổi học khác.'
                        color='blue'
                    />
                ) : (
                    sessionsSorted.map(s => (
                        <div key={s._id} className={styles.items} onClick={() => setActiveSessionId(s._id)}>
                            <div className={`${styles.badge} ${s._st.color}`}>{s._st.label}</div>
                            <div className={styles.row}><p className='text_6'>Chủ đề:</p><span className='text_6_400'>{s.topic?.Name || '---'}</span></div>
                            <div className={styles.row}><p className='text_6'>Số lượng học sinh:</p><span className='text_6_400'>{s.students.length}</span></div>
                            <div className={styles.row}><p className='text_6'>Thời gian:</p><span className='text_6_400'>{formatDate(new Date(s.day))} – {s.time} – {s.room?.name || '---'}</span></div>
                            <div className={styles.row}><p className='text_6'>Giáo viên:</p><span className='text_6_400'>{s.teacher?.name || '---'}</span></div>
                        </div>
                    ))
                )}
            </div>
        </>
    )
}