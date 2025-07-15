'use client'

import { Svg_ArowRight, Svg_Left } from '@/components/(icon)/svg'
import Add from '../add'
import styles from './index.module.css'

const fmt = d =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function More({
    data, weekStart, setWeekStart, book, student, teacher, area
}) {
    const prevWeek = () => setWeekStart(w => new Date(w.getTime() - 7 * 864e5))
    const nextWeek = () => setWeekStart(w => new Date(w.getTime() + 7 * 864e5))

    const weekLabel = `${fmt(weekStart)} - ${fmt(new Date(weekStart.getTime() + 6 * 864e5))}`

    return (
        <div className={styles.mainContainer}>
            <div className={styles.filleft}>
                <div className={styles.modeToggle}>
                    <button className={`${styles.modeButton}`}>Tất cả</button>
                    <button className={`${styles.modeButton} ${styles.active}`}>Theo tuần</button>
                </div>

                <div className={styles.modeToggle}>
                    <button className={`${styles.modeButton} ${styles.active}`} onClick={prevWeek}>
                        <Svg_Left w={16} h={16} c='var(--text-primary)' />
                    </button>

                    <button className={`${styles.modeButton}`}>{weekLabel}</button>

                    <button className={`${styles.modeButton} ${styles.active}`} onClick={nextWeek}>
                        <Svg_ArowRight w={16} h={16} c='var(--text-primary)' />
                    </button>
                </div>
            </div>

            <Add data={data} book={book} student={student} teacher={teacher} area={area} />
        </div>
    )
}
