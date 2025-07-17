'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import Menu from '@/components/(ui)/(button)/menu'
import WrapIcon from '@/components/(ui)/(button)/hoveIcon'
import { Svg_Add, Svg_Course, Svg_Delete, Svg_Pen, Svg_Profile, Svg_Student } from '@/components/(icon)/svg'
import { formatDate } from '@/function'
import { attendInfo } from '../student'
import styles from './index.module.css'

// Helper functions để xác định trạng thái buổi học
const buildDate = (d, h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
const statusOf = (session) => {
    if (!session.time || !session.day) return { weight: 2 }; // Mặc định là đã qua nếu thiếu dữ liệu
    const [st, et] = session.time.split('-')
    const [sh, sm] = st.split(':').map(Number)
    const [eh, em] = et.split(':').map(Number)
    const base = new Date(session.day)
    const end = buildDate(base, eh, em)
    const now = new Date()
    if (now > end) return { weight: 2 } // Đã diễn ra
    return { weight: 1 } // Đang hoặc sắp diễn ra
}

// Component Row không đổi
const Row = ({ icon, label, val }) => (
    <div className={styles.row}>
        {icon}
        <span className='text_6'>{label}:</span>
        <span className='text_6_400'>{val || '–––'}</span>
    </div>
)

// Component chính
export default function SessionPopup({ open, onClose, session, student = [], teacher = [], area = [], book = [] }) {
    const router = useRouter()
    const [sec, setSec] = useState(null)
    const [loading, setLoading] = useState(false);
    const [noti, setNoti] = useState({ open: false, ok: false, msg: '' });

    // Xác định xem buổi học đã kết thúc hay chưa
    const isPastSession = useMemo(() => statusOf(session).weight === 2, [session]);

    const timeLabel = useMemo(() => `${formatDate(new Date(session.day))} – ${session.time} – ${session.room?.name || '–––'}`, [session])
    const images = useMemo(() => session.students.flatMap(st => st.images || []), [session])

    const handleSave = async (payload) => {
        // Chặn lưu nếu buổi học đã kết thúc
        if (isPastSession) {
            setNoti({ open: true, ok: false, msg: 'Buổi học đã kết thúc, không thể chỉnh sửa.' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/coursetry', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id, ...payload })
            }).then(r => r.json());
            setNoti({ open: true, ok: res.status, msg: res.message || (res.status ? 'Cập nhật thành công!' : 'Thao tác thất bại.') });
        } catch (error) {
            setNoti({ open: true, ok: false, msg: 'Lỗi kết nối hoặc máy chủ.' });
        } finally {
            router.refresh();
            setLoading(false);
        }
    };

    const handleCloseNoti = () => {
        setNoti({ ...noti, open: false });
    };

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
                <div style={{ flex: 0.5, display: 'flex', gap: 8, height: '100%', justifyContent: 'end' }}>
                    <div className={styles.trigger} style={isPastSession ? { opacity: 0.5, cursor: 'not-allowed' } : {}} onClick={() => !isPastSession && setSec('stu')}>
                        <Svg_Student w={24} h={24} c='var(--text-primary)' />
                        <p className="text_7">Học sinh</p>
                    </div>
                    <div className={styles.trigger} style={isPastSession ? { opacity: 0.5, cursor: 'not-allowed' } : {}} onClick={() => !isPastSession && setSec('info')}>
                        <Svg_Pen w={24} h={24} c='var(--text-primary)' />
                        <p className="text_7">Thông tin</p>
                    </div>
                </div>
            </div>
        </section>
    );

    const StudentTable = () => ( /* Giữ nguyên không thay đổi */
        <section className={styles.block}>
            <header className={styles.blockHead}><p className='text_4'>Danh sách học sinh</p></header>
            {session.students.length === 0 ? <p className='text_6_400' style={{ paddingTop: 16 }}>Chưa có học sinh.</p> : (
                <div className={styles.table}>
                    <div className={styles.headerwrap} style={{ background: 'var(--hover)', borderRadius: '5px 5px 0 0' }}>
                        <p className='text_6'>ID</p><p className='text_6'>Họ và tên</p><p className='text_6'>Liên hệ</p>
                        <p className='text_6'>Trạng thái học</p><p className='text_6'>Chăm sóc</p><p className='text_6'>Hđ</p>
                    </div>
                    {session.students.map(st => {
                        const care = st.statuses?.find(v => v.topic === session._id)?.status ?? 1;
                        const careTxt = care === 2 ? 'Đã theo học' : care === 0 ? 'Không theo' : 'Chưa chăm sóc';
                        const stt = attendInfo(session, st).label;
                        return (
                            <div className={styles.headerwrap} key={st.studentId}>
                                <p className='text_6_400'>{st.id}</p><p className='text_6_400'>{st.name}</p><p className='text_6_400'>{st.phone || ''}</p>
                                <p className='text_6_400'>{stt}</p><p className='text_6_400'>{careTxt}</p><p className='text_6_400'>–</p>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    );

    const ImageBlock = ({ all = false }) => ( /* Giữ nguyên không thay đổi */
        <section className={styles.block}>
            <p className='text_4' style={{ marginBottom: 16 }}>Hình ảnh</p>
            {images.length === 0 ? <p className='text_6_400' style={{ paddingTop: 16 }}>Không có hình ảnh.</p> : (
                <div className={all ? styles.galleryAll : styles.galleryThumb}>
                    {(all ? images : images.slice(0, 4)).map(i => (<img key={i.id} src={`https://lh3.googleusercontent.com/d/${i.id}`} alt='' />))}
                </div>
            )}
        </section>
    );

    const EditStudents = ({ onSave, loading, isPast }) => {
        const original = useMemo(() => new Set(session.students.map(s => s.studentId)), [session]);
        const [pick, setPick] = useState(original);
        const [filter, setFilter] = useState('');
        const hasChange = useMemo(() => { if (isPast) return false; if (pick.size !== original.size) return true; for (const id of pick) if (!original.has(id)) return true; return false; }, [pick, original, isPast]);
        const toggle = id => setPick(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
        const addStu = id => setPick(prev => new Set(prev).add(id));
        const candidates = useMemo(() => student.filter(st => !pick.has(st._id) && st.Name.toLowerCase().includes(filter.toLowerCase().trim())), [student, pick, filter]);
        const save = () => { if (hasChange) onSave({ students: [...pick] }); };

        return (
            <div className={styles.editWrap} style={{ opacity: loading ? 0.5 : 1 }}>
                {isPast && <p className={styles.warning}>Buổi học đã kết thúc, không thể chỉnh sửa.</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                        <Menu disabled={isPast} customButton={<div className="input" style={{ display: 'flex', gap: 8, cursor: isPast ? 'not-allowed' : 'pointer', opacity: isPast ? 0.6 : 1 }}><Svg_Add w={16} h={16} c='var(--text-primary)' /><p className="text_6_400">Thêm học sinh</p></div>} menuItems={<div className={styles.menuBox}><input className="input" placeholder="Tìm theo tên…" value={filter} onChange={e => setFilter(e.target.value)} style={{ marginBottom: 6, width: '100%' }} />{candidates.length > 0 ? candidates.map(st => <p key={st._id} className={styles.item} onClick={() => addStu(st._id)}>{st.ID} – {st.Name}</p>) : <p className="text_6_400" style={{ padding: 4 }}>Không có kết quả</p>}</div>} />
                    </div>
                    <button className="input" style={{ background: 'var(--red)', display: 'flex', gap: 8, cursor: 'pointer' }} onClick={() => setPick(new Set())} disabled={loading || isPast}><Svg_Delete w={16} h={16} c="white" /><p className="text_6_400" style={{ color: 'white' }}>Bỏ chọn tất cả</p></button>
                </div>
                <p className="text_4" style={{ margin: '16px 0' }}>Danh sách học sinh tham gia buổi học</p>
                <div className={styles.scrollBox}>
                    {[...pick].map(id => {
                        console.log(student);

                        const info = student.find(s => s._id === id) || {};
                        return (<div key={id} className={styles.chkLine}><span className="text_6_400">{info.ID} – {info.Name}</span><WrapIcon icon={<Svg_Delete w={16} h={16} c="white" />} click={() => !(loading || isPast) && toggle(id)} content="Bỏ khỏi danh sách" placement="left" style={{ padding: 8, background: 'var(--red)', cursor: 'pointer' }} /></div>);
                    })}
                    {pick.size === 0 && <p className="text_6_400" style={{ padding: 8 }}>Chưa chọn học sinh.</p>}
                </div>
                <button className="btn" disabled={!hasChange || loading || isPast} style={{ marginTop: 16, borderRadius: 5, width: '100%', padding: '10px 0', justifyContent: 'center', background: hasChange && !isPast ? 'var(--green)' : 'var(--text-disabled)', cursor: hasChange && !isPast ? 'pointer' : 'not-allowed', opacity: hasChange && !isPast ? 1 : 0.6 }} onClick={save}>{isPast ? 'Buổi học đã kết thúc' : (loading ? 'Đang lưu...' : 'Lưu thay đổi')}</button>
            </div>
        );
    };

    const EditInfo = ({ onSave, loading, isPast }) => {
        const roomList = useMemo(() => { const m = new Map(); area.forEach(a => (a.rooms || []).forEach(r => m.set(r._id, r.name))); return [...m].map(([id, name]) => ({ id, name })); }, [area]);
        const bookMap = useMemo(() => Object.fromEntries(book.map(b => [b._id, b])), [book]);
        const teacherRaw = useMemo(() => teacher.filter(t => t.role.includes('Teacher')), [teacher]);
        const [form, setForm] = useState(() => ({ day: session.day.slice(0, 10), time: session.time || '08:00-10:00', room: session.room?._id || '', book: session.book?._id || '', topicId: session.topic?._id || '', teacher: session.teacher?._id || '', teachingAs: session.teachingAs?._id || '', note: session.note || '' }));
        const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap]);
        const normalizeTime = useCallback((v) => { const m = v.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/); if (!m) return form.time; const pad = (x, lim) => String(Math.min(lim, +x)).padStart(2, '0'); const s = `${pad(m[1], 23)}:${pad(m[2] || 0, 59)}`; const e = `${pad(m[3], 23)}:${pad(m[4] || 0, 59)}`; return s < e ? `${s}-${e}` : `${s}-${e}`; }, [form.time]);
        const save = () => onSave(form);

        // Sửa lại cách dùng Menu theo mẫu
        const Select = ({ label, value, menu }) => (
            <div className={styles.field}>
                <p className='text_6'>{label}</p>
                <Menu
                    buttonContent={value}
                    menuItems={menu}
                    disabled={loading || isPast}
                    customButton={<div className='input' style={{ cursor: 'pointer' }}><span className='text_6_400'>{value || 'Tùy chọn'}</span></div>}
                />
            </div>
        );
        const wrap = arr => <div className={styles.wrapitem}>{arr}</div>;
        const bookM = wrap(book.map(b => <p key={b._id} className={styles.item} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>));
        const topicM = wrap(topics.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>));
        const roomM = wrap(roomList.map(r => <p key={r.id} className={styles.item} onClick={() => setForm({ ...form, room: r.id })}>{r.name}</p>));
        const teachM = wrap(teacherRaw.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>));
        const asstM = wrap(teacherRaw.map(t => <p key={t._id} className={styles.item} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>));

        return (
            <div className={styles.editWrap} style={{ opacity: loading ? 0.5 : 1 }}>
                {isPast && <p className={styles.warning}>Buổi học đã kết thúc, không thể chỉnh sửa.</p>}
                <div className={styles.field}><p className='text_6'>Ngày học:</p><input type='date' className='input' value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} disabled={loading || isPast} /></div>
                <div className={styles.field}><p className='text_6'>Giờ:</p><input className='input' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} onBlur={e => setForm({ ...form, time: normalizeTime(e.target.value) })} disabled={loading || isPast} /></div>
                <Select label='Chương trình' value={bookMap[form.book]?.Name} menu={bookM} />
                <Select label='Chủ đề' value={topics.find(t => t._id === form.topicId)?.Name} menu={topicM} />
                <Select label='Phòng' value={roomList.find(r => r.id === form.room)?.name} menu={roomM} />
                <Select label='Giáo viên' value={teacher.find(t => t._id === form.teacher)?.name} menu={teachM} />
                <Select label='Trợ giảng' value={teacher.find(t => t._id === form.teachingAs)?.name} menu={asstM} />
                <div className={styles.field}><p className='text_6'>Ghi chú:</p><textarea rows={3} className='input' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} disabled={loading || isPast} /></div>
                <button className='btn' style={{ width: '100%', marginTop: 16, borderRadius: 5, justifyContent: 'center', cursor: isPast ? 'not-allowed' : 'pointer' }} onClick={save} disabled={loading || isPast}>
                    {isPast ? 'Buổi học đã kết thúc' : (loading ? 'Đang lưu...' : 'Lưu thay đổi')}
                </button>
            </div>
        );
    };

    const renderSecondaryView = () => {
        let content;
        let loadingMessage = "Đang xử lý...";
        if (sec === 'img') return <ImageBlock all />;
        if (sec === 'stu') { content = <EditStudents onSave={handleSave} loading={loading} isPast={isPastSession} />; loadingMessage = "Đang lưu danh sách..."; }
        if (sec === 'info') { content = <EditInfo onSave={handleSave} loading={loading} isPast={isPastSession} />; loadingMessage = "Đang cập nhật..."; }
        if (!content) return null;
        return (
            <>
                <Noti open={noti.open} onClose={handleCloseNoti} status={noti.ok} mes={noti.msg} button={<button className='btn' style={{ width: '100%', justifyContent: 'center', borderRadius: 5 }} onClick={handleCloseNoti}>Đóng</button>} width={500} />
                {loading && <div className={styles.loading}><Loading content={<p className='text_6_400' style={{ color: 'white' }}>{loadingMessage}</p>} /></div>}
                {content}
            </>
        )
    }

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title='Chi tiết buổi học'
            renderItemList={() => (<div className={styles.container}><InfoBlock /><StudentTable /><ImageBlock /></div>)}
            secondaryOpen={!!sec}
            onCloseSecondary={() => setSec(null)}
            secondaryTitle={sec === 'img' ? 'Tất cả hình ảnh' : sec === 'stu' ? 'Chỉnh sửa học sinh' : 'Cập nhật buổi học'}
            renderSecondaryList={renderSecondaryView}
            width={'calc(100vw - 500px)'}
            globalZIndex={1400}
        />
    )
}