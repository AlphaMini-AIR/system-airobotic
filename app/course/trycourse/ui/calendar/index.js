'use client'

import { formatDate } from '@/function'
import styles from './index.module.css'

const WEEK_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const slotOfHour = h => (h < 12 ? 0 : h < 18 ? 1 : 2)
const rank = { upcoming: 0, ongoing: 1, past: 2 }
const colorOf = { upcoming: '#f0a205', ongoing: '#0bc0e0', past: '#9e9e9e' }

/* ------------ helpers ------------ */
const statusOf = ({ day, time }) => {
    const [st, ed] = time.split('-')
    const [sh, sm] = st.split(':').map(Number)
    const [eh, em] = ed.split(':').map(Number)

    const base = new Date(day)
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm || 0)
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em || 0)
    const now = new Date()

    if (now < start) return 'upcoming'
    if (now <= end) return 'ongoing'
    return 'past'
}

export default function Calendar({ data, time }) {
    const cells = Array.from({ length: 7 }, () => [
        { c: 0, s: null }, { c: 0, s: null }, { c: 0, s: null }
    ])

    data.sessions.forEach(s => {
        const col = (new Date(s.day).getDay() + 6) % 7
        const row = slotOfHour(+s.time.split('-')[0].split(':')[0])
        const st = statusOf(s)

        cells[col][row].c += 1
        if (cells[col][row].s === null || rank[st] < rank[cells[col][row].s]) {
            cells[col][row].s = st
        }
    })
    const today = new Date()
    const hasToday = today >= time && today < new Date(time.getTime() + 7 * 24 * 60 * 60 * 1000)
    const todayCol = (today.getDay() + 6) % 7

    return (
        <div className={styles.mainContainer}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {['Buổi sáng', 'Buổi chiều', 'Buổi tối'].map(l => (
                    <p key={l} className={`text_6 ${styles.box}`}>{l}</p>
                ))}
                <p className={`text_6 ${styles.box}`} />
            </div>

            {WEEK_LABELS.map((lbl, col) => (
                <div key={lbl} style={{ display: 'flex', flexDirection: 'column' }}>
                    {[0, 1, 2].map(row => {
                        const { c, s } = cells[col][row]
                        const bg = s ? colorOf[s] : 'transparent'
                        const fg = bg === 'transparent' ? 'inherit' : '#fff'
                        const txt = c > 1 ? c : c === 1 ? '' : '-'
                        return (
                            <p
                                key={row}
                                className={`text_6_400 ${styles.box}`}
                                style={{
                                    backgroundColor: col === todayCol && hasToday ? '#e7f3ff' : 'transparent'
                                }}
                            >
                                <span style={{ backgroundColor: bg, color: fg }}>{txt}</span>
                            </p>
                        )
                    })}
                    <p
                        className={`text_6 ${styles.box}`}
                        style={{
                            backgroundColor: col === todayCol && hasToday ? '#e7f3ff' : 'transparent'
                        }}
                    >
                        <span >{lbl}</span>
                    </p>
                </div>
            ))}
        </div>
    )
}
