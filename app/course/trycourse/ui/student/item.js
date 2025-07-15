'use client'

import { useState, useEffect, useCallback } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import { formatDate } from '@/function'
import styles from './index.module.css'

/* ánh xạ status → nhãn */
const STATUS = [
    { value: 1, label: 'Chưa CS' },
    { value: 3, label: 'Đang CS' },
    { value: 2, label: 'Theo học' },
    { value: 0, label: 'Không theo' }
]

export default function CareSessionPopup({ open, onClose, session, onChangeStatus }) {
    const [status, setStatus] = useState(session?.careStatus ?? 1)
    const [note, setNote] = useState(session?.note || '')
    const [msg, setMsg] = useState('')

    /* đồng bộ khi props thay đổi */
    useEffect(() => {
        if (session) {
            setStatus(session.careStatus)
            setNote(session.note || '')
            setMsg('')
        }
    }, [session])

    /* đổi trạng thái */
    const handleChangeStatus = val => {
        if (val === status) return
        setStatus(val)
        onChangeStatus?.(val)           // call API ở cha
    }

    /* gợi ý tin nhắn = gộp nhận xét */
    const suggestion = `Chào PH, buổi ${session?.topicName ?? ''} HS đã ${session?.attendLabel?.toLowerCase()}. Nhận xét: HS tập trung tốt, cần củng cố từ vựng.`

    /* UI chính trả về cho FlexiblePopup */
    const renderForm = useCallback(
        ([s]) => (
            <div className={styles.wrapper}>
                {/* Thông tin buổi */}
                <section className={styles.infoBox}>
                    <p className='text_4'><b>Chủ đề:</b> {s.topicName}</p>
                    <p className='text_4'><b>Thời gian:</b> {s.time} – {formatDate(new Date(s.day))}</p>
                    <p className='text_4'><b>Trạng thái buổi:</b> {s.attendLabel}</p>
                </section>

                {/* Nút trạng thái chăm sóc */}
                <section className={styles.statusGroup}>
                    {STATUS.map(st => (
                        <button
                            key={st.value}
                            className={`btn ${styles.stBtn} ${status === st.value ? styles.active : ''}`}
                            onClick={() => handleChangeStatus(st.value)}
                        >
                            {st.label}
                        </button>
                    ))}
                </section>

                {/* Nhận xét & hình ảnh */}
                <section className={styles.section}>
                    <p className='text_4'><b>Nhận xét</b></p>
                    <ul className={styles.commentList}>
                        <li>HS tập trung tốt</li>
                        <li>Cần củng cố từ vựng chủ đề “Food”</li>
                    </ul>

                    <p className='text_4' style={{ marginTop: 12 }}><b>Hình ảnh</b></p>
                    <div className={styles.imgWrap}>
                        <img src='/placeholder.jpg' alt='' />
                        <img src='/placeholder.jpg' alt='' />
                    </div>
                </section>

                {/* Note */}
                <section className={styles.section}>
                    <p className='text_4'><b>Ghi chú nội bộ</b></p>
                    <textarea
                        className='input'
                        rows={3}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </section>

                {/* Tin nhắn phụ huynh */}
                <section className={styles.section}>
                    <p className='text_4'><b>Tin nhắn phụ huynh</b></p>
                    <textarea
                        className='input'
                        rows={4}
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        placeholder='Nhập nội dung...'
                    />
                    <div className={styles.msgActions}>
                        <button className='btn' onClick={() => setMsg(suggestion)}>Gợi ý nhận xét</button>
                        <button className='btn' style={{ background: 'var(--main_b)', color: '#fff' }}>Gửi</button>
                    </div>
                </section>
            </div>
        ),
        [status, note, msg]
    )

    if (!session) return null

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            data={[session]}
            title={`Chăm sóc: ${session.name}`}
            renderItemList={renderForm}
            width={520}
            globalZIndex={1200}
        />
    )
}
