'use client'

import { useState, useMemo } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { formatDate } from '@/function'
import { Svg_Course, Svg_Pen, Svg_Profile, Svg_Student } from '@/components/(icon)/svg'
import styles from './index.module.css'
import { attendInfo } from '../student'

/* util */
const toDate = (d, hm) => {
    const [h, m] = hm.split(':').map(Number)
    const x = new Date(d)
    x.setHours(h, m, 0, 0)
    return x
}
const sessionPassed = s => new Date() > toDate(s.day, s.time.split('-')[1])

export default function SessionPopup({ open, onClose, session, allStudents = [] }) {
    /* ─────────────── derived data ─────────────── */
    const timeLabel = useMemo(
        () => `${formatDate(new Date(session.day))} – ${session.time} – ${session.room?.name || '–––'}`,
        [session]
    )
    const images = useMemo(() => session.students.flatMap(st => st.images || []), [session])
    const isPast = sessionPassed(session)
    const [sec, setSec] = useState(null)      // null | 'img' | 'stu' | 'info'

    /* ─────────────── blocks ───────────────────── */
    const InfoBlock = () => (
        <section className={styles.block}>

            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p className='text_4' style={{ marginBottom: 8 }}>Thông tin buổi học</p>
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Chương trình' val={session.book?.name} />
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Chủ đề' val={session.topic?.Name} />
                    <Row icon={<Svg_Profile w={16} h={16} c='var(--text-primary)' />} label='Giáo viên' val={`${session.teacher?.name || '–––'} – ${session.teacher?.phone || ''}`} />
                    <Row icon={<Svg_Student w={18} h={18} c='var(--text-primary)' />} label='Số học sinh' val={session.students.length} />
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Thời gian' val={timeLabel} />
                </div>
                <div style={{ flex: .5, display: 'flex', gap: 8, height: '100%', justifyContent: 'end' }}>
                    <div className={styles.trigger} onClick={() => setSec('stu')}>
                        <Svg_Student w={24} h={24} c='var(--text-primary)' />
                        <p className="text_7">Học sinh</p>
                    </div>
                    <div className={styles.trigger} onClick={() => setSec('stu')}>
                        <Svg_Pen w={24} h={24} c='var(--text-primary)' />
                        <p className="text_7">Thông tin</p>
                    </div>
                </div>
            </div>
        </section>
    )

    const StudentTable = () => (
        <section className={styles.block}>
            <header className={styles.blockHead}>
                <p className='text_4'>Danh sách học sinh</p>

            </header>

            {session.students.length === 0 ? (
                <p className='text_6_400' style={{ paddingTop: 16 }}>Chưa có học sinh.</p>
            ) : (
                <div className={styles.table}>
                    <div className={styles.headerwrap} style={{ background: 'var(--hover)', borderRadius: '5px 5px 0 0' }}>
                        <p className='text_6'>ID</p><p className='text_6'>Họ và tên</p><p className='text_6'>Liên hệ</p>
                        <p className='text_6'>Trạng thái học</p><p className='text_6'>Chăm sóc</p><p className='text_6'>Hđ</p>
                    </div>
                    {session.students.map(st => {
                        const care = st.statuses?.find(v => v.topic === session._id)?.status ?? 1
                        const careTxt = care === 2 ? 'Đã theo học' : care === 0 ? 'Không theo' : 'Chưa chăm sóc'
                        const stt = attendInfo(session, st).label
                        return (
                            <div className={styles.headerwrap} key={st.studentId}>
                                <p className='text_6_400'>{st.id}</p>
                                <p className='text_6_400'>{st.name}</p>
                                <p className='text_6_400'>{st.phone || ''}</p>
                                <p className='text_6_400'>{stt}</p>
                                <p className='text_6_400'>{careTxt}</p>
                                <p className='text_6_400'>–</p>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )

    const ImageBlock = ({ all = false }) => (
        <section className={styles.block}>
            <header className={styles.blockHead}>
                <p className='text_4'>Hình ảnh</p>
                {!all && images.length > 4 && (
                    <button className='btnSmall' onClick={() => setSec('img')}>
                        Xem tất cả
                    </button>
                )}
            </header>

            {images.length === 0 ? (
                <p className='text_6_400' style={{ paddingTop: 16 }}>Không có hình ảnh.</p>
            ) : (
                <div className={all ? styles.galleryAll : styles.galleryThumb}>
                    {(all ? images : images.slice(0, 4)).map(i => (
                        <img key={i.id} src={`https://lh3.googleusercontent.com/d/${i.id}`} alt='' />
                    ))}
                </div>
            )}
        </section>
    )

    /* ─────────────── editors ───────────────────── */
    const EditStudents = () => {
        const [pick, setPick] = useState(new Set(session.students.map(s => s.studentId)))
        const toggle = id => setPick(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
        const save = async () => {
            await fetch('/api/coursetry/edit-students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id, students: [...pick] })
            })
            location.reload()
        }
        return (
            <div className={styles.editWrap}>
                <p className='text_4'>Chỉnh sửa học sinh</p>
                <div className={styles.scrollBox}>
                    {allStudents.map(s => (
                        <label key={s._id} className={styles.chkLine}>
                            <input type='checkbox' checked={pick.has(s._id)} onChange={() => toggle(s._id)} />
                            <span>{s.Name} – {s.Phone}</span>
                        </label>
                    ))}
                </div>
                <button className='btn' style={{ marginTop: 16 }} onClick={save}>Lưu thay đổi</button>
            </div>
        )
    }

    const EditInfo = () => {
        const [form, setForm] = useState({ day: session.day.slice(0, 10), time: session.time, note: session.note || '' })
        const save = async () => {
            await fetch('/api/coursetry/edit-session', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id, ...form })
            })
            location.reload()
        }
        return (
            <div className={styles.editWrap}>
                <p className='text_4'>Cập nhật buổi học</p>
                <label className={styles.field}><span className='text_6'>Ngày</span><input type='date' className='input' value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} /></label>
                <label className={styles.field}><span className='text_6'>Giờ (hh:mm-hh:mm)</span><input className='input' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label>
                <label className={styles.field}><span className='text_6'>Ghi chú</span><textarea rows={3} className='input' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
                <button className='btn' style={{ marginTop: 16 }} onClick={save}>Lưu thay đổi</button>
            </div>
        )
    }

    /* ─────────────── main render ──────────────── */
    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title='Chi tiết buổi học'
            renderItemList={() => (
                <div className={styles.container}>
                    <InfoBlock />
                    <StudentTable />
                    <ImageBlock />
                </div>
            )}
            secondaryOpen={!!sec}
            onCloseSecondary={() => setSec(null)}
            secondaryTitle={sec === 'img' ? 'Tất cả hình ảnh' : sec === 'stu' ? 'Chỉnh sửa học sinh' : 'Cập nhật buổi học'}
            renderSecondaryList={() =>
                sec === 'img' ? <ImageBlock all /> : sec === 'stu' ? <EditStudents /> : <EditInfo />
            }
            width={1000}
            globalZIndex={1400}
        />
    )
}

/* small row helper */
const Row = ({ icon, label, val }) => (
    <div className={styles.row}>
        {icon}<span className='text_6'>{label}:</span><span className='text_6_400'>{val || '–––'}</span>
    </div>
)
