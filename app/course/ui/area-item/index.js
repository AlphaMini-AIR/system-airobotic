'use client'

import React, { useState, useEffect } from 'react'
import styles from './index.module.css'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import { useRouter } from 'next/navigation'

/* ────────────────── Card ────────────────── */
const AreaCard = ({ area, onClick }) => (
    <div className={styles.card} onClick={() => onClick(area)}>
        <div className={styles.content} style={{ borderLeft: `5px solid ${area.color || '#ccc'}` }}>
            <p className={styles.text_4}>Tên khu vực: {area.name}</p>
            <p className={styles.text_6}>
                Số phòng học: <span style={{ fontWeight: 400 }}>{area.rooms.length}</span>
            </p>
        </div>
    </div>
)

/* ────────────────── Main list ────────────────── */
export default function ProgramList({ programs = [] }) {
    const router = useRouter()

    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', color: '#000000', rooms: [] })
    const [newRoom, setNewRoom] = useState('')
    const [colorErr, setColorErr] = useState('')
    const [loading, setLoading] = useState(false)
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' })

    const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v)

    /* ─── sync when card opened ─── */
    useEffect(() => {
        if (!selected) return
        setForm({
            name: selected.name,
            color: selected.color || '#000000',
            rooms: selected.rooms || []
        })
        setColorErr('')
    }, [selected])

    /* ─── handlers ─── */
    const addRoom = () => {
        const n = newRoom.trim()
        if (!n || form.rooms.some((r) => r.name === n)) return
        setForm((f) => ({ ...f, rooms: [...f.rooms, { name: n }] }))
        setNewRoom('')
    }

    const delRoom = (name) =>
        setForm((f) => ({ ...f, rooms: f.rooms.filter((r) => r.name !== name) }))

    const save = async () => {
        if (!form.name.trim() || !isHex(form.color)) {
            setNoti({ open: true, status: false, mes: 'Vui lòng kiểm tra dữ liệu.' })
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/area/${selected._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    color: form.color,
                    rooms: form.rooms              // [{name}]
                })
            }).then((r) => r.json())

            setNoti({ open: true, status: res.status === 2, mes: res.mes })
            if (res.status === 2) router.refresh()
            setSelected(null)
        } catch (e) {
            setNoti({ open: true, status: false, mes: e.message })
        } finally {
            setLoading(false)
        }
    }

    /* ─── popup content ─── */
    const popup = selected && (
        <div style={{ padding: 16 }}>
            {/* name */}
            <div className={styles.field}>
                <p className='text_6'>Tên khu vực</p>
                <input
                    className='input'
                    name='name'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
            </div>

            {/* color */}
            <div className={styles.field}>
                <p className='text_6'>Màu hiển thị</p>
                <div className={`${styles.colorInputWrapper} input`}>
                    <label
                        htmlFor='color-picker'
                        className={styles.colorSwatch}
                        style={{ backgroundColor: form.color }}
                    />
                    <input
                        id='color-picker'
                        type='color'
                        className={styles.hiddenColorInput}
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                    <input
                        className={styles.textInput}
                        value={form.color.toUpperCase()}
                        onChange={(e) => {
                            setForm({ ...form, color: e.target.value })
                            setColorErr(isHex(e.target.value) ? '' : 'Mã màu HEX không hợp lệ.')
                        }}
                    />
                </div>
                {colorErr && <p style={{ color: 'var(--red)', fontSize: 12 }}>{colorErr}</p>}
            </div>

            {/* rooms */}
            <div className={styles.field}>
                <p className='text_6'>Phòng học</p>
                <div className={styles.tagContainer}>
                    {form.rooms.map((r) => (
                        <span key={r._id || r.name} className={styles.tag}>
                            {r.name}
                            <button onClick={() => delRoom(r.name)}>✕</button>
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className='input'
                        style={{ flex: 1 }}
                        placeholder='Thêm phòng mới...'
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRoom()}
                    />
                    <button className='btn' style={{ margin: 0 }} onClick={addRoom}>
                        Thêm
                    </button>
                </div>
            </div>

            <button
                className='btn'
                onClick={save}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
            >
                <p className='text_6_400' style={{ color: '#fff' }}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </p>
            </button>
        </div>
    )

    /* ─── render ─── */
    return (
        <>
            {programs.length ? (
                <div className={styles.container}>
                    {programs.map((a) => (
                        <AreaCard key={a._id} area={a} onClick={setSelected} />
                    ))}
                </div>
            ) : (
                <p>Không có khu vực nào để hiển thị.</p>
            )}

            <FlexiblePopup
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected ? `Chi tiết khu vực: ${selected.name}` : ''}
                renderItemList={() => popup}
            />

            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999 }}>
                    <Loading content={<p className='text_6_400' style={{ color: '#fff' }}>Đang cập nhật...</p>} />
                </div>
            )}

            <Noti
                open={noti.open}
                onClose={() => setNoti((n) => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button className='btn' style={{ width: '100%', borderRadius: 5 }} onClick={() => setNoti((n) => ({ ...n, open: false }))}>
                        Tắt thông báo
                    </button>
                }
            />
        </>
    )
}
