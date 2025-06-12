'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Loading from '@/components/(ui)/(loading)/loading'; // Sử dụng component Loading của bạn
import Noti from '@/components/(features)/(noti)/noti'; // Sử dụng component Noti của bạn
import styles from './index.module.css';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { Read_Student_All } from '@/data/student';

const toArr = (v) =>
    Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];

export default function AnnounceStudent({ course }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });
    const [masterStudentList, setMasterStudentList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const studentsInCourse = useMemo(() => toArr(course?.Student), [course]);

    useEffect(() => {
        if (isOpen && masterStudentList.length === 0) {
            setIsLoading(true);
            Read_Student_All()
                .then((res) => {
                    const list = Array.isArray(res) ? res : res.data || [];
                    setMasterStudentList(list);
                })
                .catch(() => {
                    setNoti({ open: true, mes: 'Không thể tải danh sách học sinh.', status: false });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, masterStudentList.length]);

    useEffect(() => {
        if (isOpen) {
            setSelectedStudentIds(studentsInCourse.map(s => s.ID));
        }
    }, [isOpen, studentsInCourse]);

    const handleToggleStudent = useCallback((studentId) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedStudentIds(studentsInCourse.map(s => s.ID));
    }, [studentsInCourse]);

    const handleDeselectAll = useCallback(() => {
        setSelectedStudentIds([]);
    }, []);

    const resetPopup = useCallback(() => {
        setIsOpen(false);
        setMessage('');
        setSelectedStudentIds([]);
    }, []);

    const handleSend = useCallback(async () => {
        if (!message.trim() || selectedStudentIds.length === 0) {
            setNoti({ open: true, mes: 'Vui lòng nhập thông báo và chọn ít nhất một người nhận.', status: false });
            return;
        }

        setIsSending(true);

        const selectedStudentsData = masterStudentList.filter(student =>
            selectedStudentIds.includes(student.ID)
        );

        const payload = {
            courseId: course._id,
            message: message,
            recipients: selectedStudentsData, 
        };

        try {
            const res = await fetch('/api/course/announce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            const isSuccess = res.ok && json.status === 2;

            // Hiển thị thông báo kết quả
            setNoti({ open: true, mes: json.mes, status: isSuccess });

            // Nếu thành công thì đóng popup chính
            if (isSuccess) {
                resetPopup();
            }
            // Nếu thất bại, popup chính vẫn mở để người dùng sửa lại

        } catch (error) {
            // Xử lý lỗi kết nối
            setNoti({ open: true, mes: 'Lỗi kết nối đến máy chủ.', status: false });
        } finally {
            setIsSending(false);
        }

    }, [message, selectedStudentIds, masterStudentList, course._id, resetPopup]);

    const renderForm = () => {
        const studentNameMap = new Map(masterStudentList.map(s => [s.ID, s.Name]));

        return (
            <div className={styles.formContainer}>
                <div>
                    <TextNoti
                        mes={`Gửi thông báo sẽ gửi đoạn tin nhắn bạn nhập tới tài khoản Zalo phụ huynh các học sinh trong danh sách được chọn.`}
                        title='Gửi thông báo'
                        color='blue'
                    />
                    <div style={{ marginTop: 8 }}>
                        <TextNoti
                            mes={`Nhập kí tự {namestudent} để thay thế tên học sinh, kí tự {nameparents} để thay thế tên phụ huynh học sinh khi gửi tin.`}
                            title='Cá nhân hóa tin nhắn'
                            color='yellow'
                        />
                    </div>
                    <p className='text_6' style={{ margin: '16px 0 8px 0' }}>Nội dung gửi đi</p>
                    <textarea
                        id="announcement_message"
                        className={styles.messageTextarea}
                        rows="5"
                        placeholder="Nhập nội dung cần thông báo..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSending}
                    />
                </div>
                <div>
                    <div className={styles.recipientHeader}>
                        <label className='text_6'>Chọn người nhận ({selectedStudentIds.length}/{studentsInCourse.length})</label>
                        <div className={styles.selectionActions}>
                            <button onClick={handleSelectAll} disabled={isSending}>Chọn tất cả</button>
                            <button onClick={handleDeselectAll} disabled={isSending}>Bỏ chọn</button>
                        </div>
                    </div>
                    <div className={styles.recipientList}>
                        {isLoading ? (
                            <Loading content="Đang tải..." />
                        ) : studentsInCourse.length > 0 ? (

                            studentsInCourse.map(student => {

                                const isSelected = selectedStudentIds.includes(student.ID);

                                const name = studentNameMap.get(student.ID) || 'Không tìm thấy tên';

                                return (

                                    <div

                                        key={student.ID}

                                        className={styles.studentItem}

                                        style={{

                                            background: isSelected ? 'var(--main_d)' : 'transparent',

                                            color: isSelected ? 'white' : 'var(--text-primary)',

                                            alignItems: 'center',

                                            justifyContent: 'space-between'

                                        }}

                                        onClick={() => handleToggleStudent(student.ID)}

                                    >

                                        <div style={{ display: 'flex', gap: 32 }}>

                                            <p className='text_6_400' style={{ color: isSelected ? 'var(--background-secondary)' : 'var(--text-secondary)' }}>ID: {student.ID}</p>

                                            <p className='text_6_400' style={{ color: isSelected ? 'var(--background-secondary)' : 'var(--text-secondary)' }}>Họ và Tên: {name}</p>



                                        </div>

                                        {isSelected ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill='white'>

                                            <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />

                                        </svg> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill='var(--red)'>

                                            <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm79 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />

                                        </svg>}

                                    </div>

                                );

                            })

                        ) : (
                            <p className={styles.noStudents}>Khóa học chưa có học sinh.</p>
                        )}
                    </div>
                </div>
                <div className={styles.actionRow}>
                    <button className="btn" onClick={handleSend} style={{ gap: 0, borderRadius: 5, background: 'var(--green)' }} disabled={isSending || !message.trim() || selectedStudentIds.length === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill='white'>
                            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                        </svg>
                        <div className='text_6_400' style={{ color: 'white' }}>    Gửi tin </div>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={styles.trigger} onClick={() => setIsOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='var(--text-primary)'>
                    <path d="M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z" />
                </svg>
                <p className="text_7">Thông báo</p>
            </div>

            <FlexiblePopup
                open={isOpen}
                onClose={resetPopup}
                width={600}
                title="Gửi thông báo đến học sinh"
                renderItemList={renderForm}
            />

            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button
                        className="btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setNoti(n => ({ ...n, open: false }))}
                    >
                        Đã hiểu
                    </button>
                }
            />
        </>
    );
}