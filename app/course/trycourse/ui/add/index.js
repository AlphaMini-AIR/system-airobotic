'use client'

import { useState, useMemo, useCallback } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { Svg_Add } from '@/components/(icon)/svg'
import Menu from '@/components/(ui)/(button)/menu'
import styles from './index.module.css'

export default function Add({ data, book = [], student = [], teacher = [], area = [], onCreate }) {
    const folderBase = data?.rootFolderId || 'drv://TRY_ROOT'

    const roomList = useMemo(() => [...new Set(area.flatMap((a) => a.room))], [area])
    const bookMap = useMemo(() => Object.fromEntries(book.map((b) => [b._id, b])), [book])
    const teacherRaw = useMemo(() => teacher.filter((t) => t.role.includes('Teacher')), [teacher])

    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({
        day: new Date().toISOString().slice(0, 10),
        time: '08:00-10:00',
        room: '',
        book: '',
        topicId: '',
        teacher: '',
        teachingAs: '',
        studentIds: [],
        note: ''
    })

    const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap])

    const normalizeTime = useCallback((val) => {
        const m = val.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/)
        if (!m) return '08:00-10:00'
        const h = (x) => String(Math.min(23, +x)).padStart(2, '0')
        const p = (x) => String(Math.min(59, +x)).padStart(2, '0')
        const s = `${h(m[1])}:${p(m[2] || '0')}`
        const e = `${h(m[3])}:${p(m[4] || '0')}`
        return s < e ? `${s}-${e}` : `${s}-10:00`
    }, [])

    const toggleStudent = (id) =>
        setForm((f) =>
            f.studentIds.includes(id)
                ? { ...f, studentIds: f.studentIds.filter((x) => x !== id) }
                : { ...f, studentIds: [...f.studentIds, id] }
        )

    const handleCreate = async () => {
        const folderId = `${folderBase}/${form.day}`
        const res = await fetch('/api/trial/add-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, folderId })
        }).then((r) => r.json())
        if (!res.status) return alert(res.mes || 'Lỗi tạo buổi học')
        setOpen(false)
        onCreate && onCreate(res.data)
    }

    const wrap = (arr) => <div className={styles.wrapitem}>{arr}</div>

    const bookMenu = wrap(book.map((b) => <p key={b._id} className={`${styles.item} text_6_400`} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>))
    const topicMenu = wrap(topics.map((t) => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>))
    const roomMenu = wrap(roomList.map((r) => <p key={r} className={styles.item} onClick={() => setForm({ ...form, room: r })}>{r}</p>))
    const teacherMenu = wrap(teacherRaw.map((t) => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>))
    const assistantMenu = wrap(teacherRaw.map((t) => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>))
    const studentMenu = wrap(student.map((s) =>
        <div key={s._id} className={styles.checkboxLine} onClick={() => toggleStudent(s._id)}>
            <input type='checkbox' readOnly checked={form.studentIds.includes(s._id)} />
            <span>{`${s.ID} – ${s.Name}`}</span>
        </div>
    ))

    const Select = ({ label, valueText, menu }) => (
        <div className={styles.field}>
            <p className='text_6'>{label}</p>
            <Menu
                buttonContent={valueText}
                menuItems={menu}
                customButton={
                    <div className='input' style={{ cursor: 'pointer' }}>
                        <span className='text_6_400'>{valueText || 'Tùy chọn'}</span>
                    </div>
                }
            />
        </div>
    )

    const popupContent = (
        <div className={styles.popupContainer}>
            <div className={styles.field}>
                <p className='text_6'>Ngày học:</p>
                <input type='date' className='input' value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
            </div>

            <div className={styles.field}>
                <p className='text_6'>Giờ (vd 08:00-10:00):</p>
                <input
                    type='text'
                    className='input'
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    onBlur={(e) => setForm({ ...form, time: normalizeTime(e.target.value) })}
                />
            </div>

            <Select label='Chương trình' valueText={bookMap[form.book]?.Name} menu={bookMenu} />
            <Select label='Chủ đề' valueText={topics.find((t) => t._id === form.topicId)?.Name} menu={topicMenu} />
            <Select label='Phòng' valueText={form.room} menu={roomMenu} />
            <Select label='Giáo viên' valueText={teacher.find((t) => t._id === form.teacher)?.name} menu={teacherMenu} />
            <Select label='Trợ giảng' valueText={teacher.find((t) => t._id === form.teachingAs)?.name} menu={assistantMenu} />
            <Select label={`Học sinh (${form.studentIds.length})`} valueText={form.studentIds.length ? 'Đã chọn' : ''} menu={studentMenu} />

            <div className={styles.field}>
                <p className='text_6'>Ghi chú:</p>
                <textarea rows={3} className='input' value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            <button className={styles.submit} onClick={handleCreate}>Lưu</button>
        </div>
    )

    return (
        <>
            <div className='btn' style={{ margin: 0, transform: 'none', borderRadius: 5 }} onClick={() => setOpen(true)}>
                <Svg_Add w={16} h={16} c='white' />
                <p className='text_6_400' style={{ color: 'white' }}>Thêm buổi học thử</p>
            </div>

            <FlexiblePopup
                open={open}
                onClose={() => setOpen(false)}
                title='Tạo buổi học thử'
                renderItemList={() => popupContent}
                width={480}
                globalZIndex={1200}
            />
        </>
    )
}
