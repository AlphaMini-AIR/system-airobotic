'use client'

import { useState, useMemo, useCallback } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { Svg_Add } from '@/components/(icon)/svg'
import Menu from '@/components/(ui)/(button)/menu'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import styles from './index.module.css'
import { useRouter } from 'next/navigation'

export default function Add({ book = [], student = [], teacher = [], area = [], onCreate }) {
    const router = useRouter()
    const roomList = useMemo(() => {
        const m = new Map()
        area.forEach(a => (a.rooms || []).forEach(r => m.set(r._id, r.name)))
        return [...m].map(([id, name]) => ({ id, name }))
    }, [area])

    const bookMap = useMemo(() => Object.fromEntries(book.map(b => [b._id, b])), [book])
    const teacherRaw = useMemo(() => teacher.filter(t => t.role.includes('Teacher')), [teacher])

    /* ---------- default selections ---------- */
    const defaultBook = useMemo(() => book.find(b => /fantasy\s*zoo/i.test(b.Name)) || book[0], [book])
    const defaultTopic = useMemo(() => defaultBook?.Topics?.find(t => /mắt\s*mèo/i.test(t.Name)) || defaultBook?.Topics?.[0], [defaultBook])
    const defaultTeacher = useMemo(() => teacher.find(t => /khắc\s*hoàng/i.test(t.name.toLowerCase())) || teacherRaw[0], [teacher, teacherRaw])
    const defaultRoom = useMemo(() => roomList.find(r => r.name === 'B304') || roomList[0], [roomList])

    /* ---------- state ---------- */
    const [open, setOpen] = useState(false)
    const [showStu, setShowStu] = useState(false)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [notification, setNoti] = useState({ open: false, status: false, mes: '' })
    const [form, setForm] = useState(() => ({
        day: new Date().toISOString().slice(0, 10),
        time: '08:00-10:00',
        room: defaultRoom?.id || '',
        book: defaultBook?._id || '',
        topicId: defaultTopic?._id || '',
        teacher: defaultTeacher?._id || '',
        teachingAs: '',
        studentIds: [],
        note: ''
    }))

    const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap])

    /* ---------- utils ---------- */
    const normalizeTime = useCallback(v => {
        const m = v.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/)
        if (!m) return '08:00-10:00'
        const pad = (x, lim) => String(Math.min(lim, +x)).padStart(2, '0')
        const s = `${pad(m[1], 23)}:${pad(m[2] || 0, 59)}`
        const e = `${pad(m[3], 23)}:${pad(m[4] || 0, 59)}`
        return s < e ? `${s}-${e}` : `${s}-10:00`
    }, [])

    const toggleStudent = id =>
        setForm(f =>
            f.studentIds.includes(id)
                ? { ...f, studentIds: f.studentIds.filter(x => x !== id) }
                : { ...f, studentIds: [...f.studentIds, id] }
        )

    /* ---------- submit ---------- */
    const save = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/coursetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            }).then(r => r.json())
            console.log(res);
            
            if (!res.status) {
                setNoti({ open: true, status: false, mes: res.mes || 'Tạo buổi thất bại' })
            } else {
                setNoti({ open: true, status: true, mes: 'Thêm buổi học thử thành công!' })
                setOpen(false)
                onCreate && onCreate(res.data)
            }
        } catch (e) {
            setNoti({ open: true, status: false, mes: 'Lỗi mạng hoặc máy chủ' })
        } finally {
            router.refresh()
            setLoading(false)
        }
    }

    /* ---------- dropdown menus ---------- */
    const wrap = arr => <div className={styles.wrapitem}>{arr}</div>
    const bookM = wrap(book.map(b => <p key={b._id} className={styles.item} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>))
    const topicM = wrap(topics.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>))
    const roomM = wrap(roomList.map(r => <p key={r.id} className={styles.item} onClick={() => setForm({ ...form, room: r.id })}>{r.name}</p>))
    const teachM = wrap(teacherRaw.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>))
    const asstM = wrap(teacherRaw.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>))

    /* ---------- students popup ---------- */
    const filteredStu = useMemo(() => {
        const q = search.toLowerCase()
        return student.filter(s => s.Name.toLowerCase().includes(q) || s.ID.toLowerCase().includes(q))
    }, [search, student])

    const stuList = (
        <div className={styles.stuBody}>
            <input className='input' placeholder='Tìm tên/ID …' value={search} onChange={e => setSearch(e.target.value)} />
            <div className={styles.stuScroll}>
                {filteredStu.map(s => (
                    <label key={s._id} className={styles.stuItem}>
                        <input type='checkbox' checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                        <span>{s.ID} – {s.Name}</span>
                    </label>
                ))}
            </div>
            <button className='btn' style={{ width: '100%', marginTop: 12, justifyContent: 'center', borderRadius: 5 }} onClick={() => setShowStu(false)}>Xong</button>
        </div>
    )

    /* ---------- select wrapper ---------- */
    const Select = ({ label, value, menu, openCustom }) => (
        <div className={styles.field}>
            <p className='text_6'>{label}</p>
            {openCustom ? (
                <div className='input' style={{ cursor: 'pointer' }} onClick={openCustom}>
                    <span className='text_6_400'>{value || 'Tùy chọn'}</span>
                </div>
            ) : (
                <Menu
                    buttonContent={value}
                    menuItems={menu}
                    customButton={<div className='input' style={{ cursor: 'pointer' }}><span className='text_6_400'>{value || 'Tùy chọn'}</span></div>}
                />
            )}
        </div>
    )

    /* ---------- main popup ---------- */
    const body = (
        <div className={styles.popupContainer}>
            <div className={styles.field}>
                <p className='text_6'>Ngày học:</p>
                <input type='date' className='input' value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} />
            </div>

            <div className={styles.field}>
                <p className='text_6'>Giờ:</p>
                <input className='input' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} onBlur={e => setForm({ ...form, time: normalizeTime(e.target.value) })} />
            </div>

            <Select label='Chương trình' value={bookMap[form.book]?.Name} menu={bookM} />
            <Select label='Chủ đề' value={topics.find(t => t._id === form.topicId)?.Name} menu={topicM} />
            <Select label='Phòng' value={roomList.find(r => r.id === form.room)?.name} menu={roomM} />
            <Select label='Giáo viên' value={teacher.find(t => t._id === form.teacher)?.name} menu={teachM} />
            <Select label='Trợ giảng' value={teacher.find(t => t._id === form.teachingAs)?.name} menu={asstM} />
            <Select label={`Học sinh (${form.studentIds.length})`} value={form.studentIds.length ? 'Đã chọn' : ''} openCustom={() => setShowStu(true)} />

            <div className={styles.field}>
                <p className='text_6'>Ghi chú:</p>
                <textarea rows={3} className='input' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            <button className='btn' style={{ width: '100%', marginTop: 16, borderRadius: 5, justifyContent: 'center' }} onClick={save}>
                Thêm buổi học thử
            </button>
        </div>
    )

    return (
        <>
            <div className='btn' style={{ margin: 0, borderRadius: 5 }} onClick={() => setOpen(true)}>
                <Svg_Add w={16} h={16} c='#fff' /><p className='text_6_400' style={{ color: '#fff' }}>Thêm buổi học thử</p>
            </div>

            <FlexiblePopup
                open={open}
                onClose={() => setOpen(false)}
                title='Tạo buổi học thử'
                renderItemList={() => body}
                secondaryOpen={showStu}
                onCloseSecondary={() => setShowStu(false)}
                renderSecondaryList={() => stuList}
                secondaryTitle='Danh sách học sinh'
                width={480}
                globalZIndex={1200}
            />

            {loading && (
                <div className={styles.loadingOverlay}>
                    <Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}

            <Noti
                open={notification.open}
                status={notification.status}
                mes={notification.mes}
                onClose={() => setNoti(prev => ({ ...prev, open: false }))}
                button={
                    <div className='btn' style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti(prev => ({ ...prev, open: false }))}>
                        <p className='text_6_400' style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />
        </>
    )
}
