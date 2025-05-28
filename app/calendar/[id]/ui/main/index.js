'use client';

import BoxFile from '@/components/(box)/file'
import CenterPopup from '@/components/(popup)/popup_center'
import CommentForm from './CommentPopup'
import styles from './index.module.css'
import { useState } from 'react'

export default function Main({ data }) {
    const { course, session, slide } = data

    const [showCommentPopup, setShowCommentPopup] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [attendanceData, setAttendanceData] = useState({});
    const [comments, setComments] = useState({});

    // build danh sách điểm danh cho buổi này
    const rollCall = (course.Student || []).map((stu) => {
        const checkinValue = stu.Learn?.[session.id]?.Checkin
        let checkin = '1' // mặc định có mặt

        // Xử lý giá trị checkin từ data
        if (checkinValue === 1 || checkinValue === '1') {
            checkin = '1' // Có mặt
        } else if (checkinValue === 0 || checkinValue === '0') {
            checkin = '0' // Vắng không phép  
        } else if (checkinValue === 2 || checkinValue === '2') {
            checkin = '2' // Vắng có phép
        }

        return {
            ID: stu.ID,
            Name: stu.Name,
            Checkin: checkin,
            _id: stu._id,
            originalComment: stu.Learn?.[session.id]?.Cmt || ''
        }
    })

    const handleAttendanceChange = (studentId, value) => {
        console.log(studentId, value);
        
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleCommentClick = (student) => {
        setSelectedStudent(student);
        setShowCommentPopup(true);
    };

    const handleSaveComment = (comment) => {
        if (selectedStudent) {
            setComments(prev => ({
                ...prev,
                [selectedStudent.ID]: comment
            }));
        }
        setShowCommentPopup(false);
        setSelectedStudent(null);
    };

    // Hàm lưu tất cả thay đổi
    const handleSaveAll = () => {
        console.log('Saving attendance data:', attendanceData);
        console.log('Saving comments:', comments);
        alert('Đã lưu thành công!');
    };

    const getActualAttendance = (student) => {
        return attendanceData[student.ID] !== undefined ? attendanceData[student.ID] : student.Checkin;
    };

    const cm = rollCall.filter((s) => getActualAttendance(s) === '1').length
    const vk = rollCall.filter((s) => getActualAttendance(s) === '0').length
    const vc = rollCall.filter((s) => getActualAttendance(s) === '2').length

    return (
        <div className={styles.root}>
            {/* Header */}
            <header className={styles.header}>
                <p className='text_3' style={{ color: 'white' }}>
                    {course.ID ?? '-'} – Chủ đề:{' '}
                    {session.topic ?? '-'}
                </p>
                <div className={styles.statsContainer}>
                    <div className={`${styles.statBox} ${styles.present} text_6_400`}>
                        Có mặt: {cm}
                    </div>
                    <div className={`${styles.statBox} ${styles.absent} text_6_400`}>
                        Vắng không phép: {vk}
                    </div>
                    <div className={`${styles.statBox} ${styles.excused} text_6_400`}>
                        Vắng có phép: {vc}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className={styles.content}>
                <aside className={styles.sidebar}>
                    <p className='text_4'> Tài liệu buổi học</p>
                    {session.image && (
                        <BoxFile
                            type="Img"
                            name="Hình ảnh"
                            href={`https://drive.google.com/drive/u/0/folders/${session.image}`}
                        />
                    )}
                    {slide && (
                        <BoxFile type="Ppt" name="Slide giảng dạy" href={slide} />
                    )}
                </aside>
                <main className={styles.main}>
                    <p className='text_4' style={{ marginBottom: 16 }}>Thông tin buổi học</p>
                    <section className={styles.infoSection}>
                        <div className={styles.infoHeader}>
                            <div className='text_6_400' style={{ color: 'white' }}>
                                Thời gian:{' '}
                                <span className={styles.infoValue}>{session.time}</span>
                            </div>
                            <div className='text_6_400' style={{ color: 'white' }}>
                                Giáo viên:{' '}
                                <span className={styles.infoValue}>{session.teacher}</span>
                            </div>
                            <div className='text_6_400' style={{ color: 'white' }}>
                                Trợ giảng:{' '}
                                <span className={styles.infoValue}>
                                    {session.teachingAs || '–'}
                                </span>
                            </div>
                        </div>                        <div className={styles.divider} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <p className='text_4'>Sổ điểm danh</p>
                            <button
                                onClick={handleSaveAll}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--green)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    outline: 'none'

                                }}
                                className='text_6_400'
                            >
                                Lưu tất cả thay đổi
                            </button>
                        </div>{rollCall.length > 0 ? (
                            <>
                                {/* header row */}
                                <div className={`${styles.row} ${styles.headerRow}`}>
                                    <div className='text_6_400' style={{ flex: 2, color: 'white', padding: 8 }}>
                                        Học sinh
                                    </div>
                                    <div className='text_6_400' style={{ flex: 1, color: 'white', padding: '8px 0', textAlign: 'center' }}>
                                        Có mặt
                                    </div>
                                    <div className='text_6_400' style={{ flex: 1, color: 'white', padding: '8px 0', textAlign: 'center' }}>
                                        Vắng mặt
                                    </div>
                                    <div className='text_6_400' style={{ flex: 1, color: 'white', padding: '8px 0', textAlign: 'center' }}>
                                        Có phép
                                    </div>
                                    <div className='text_6_400' style={{ flex: 1, color: 'white', padding: '8px 0', textAlign: 'center' }}>
                                        Nhận xét
                                    </div>
                                </div>

                                {/* data rows */}
                                {rollCall.map((stu) => {
                                    const currentAttendance = getActualAttendance(stu);
                                    const hasComment = comments[stu.ID] || stu.originalComment;

                                    return (
                                        <div key={stu.ID} className={styles.row} style={{
                                            borderBottom: '1px solid #e9ecef',
                                            backgroundColor: 'white'
                                        }}>
                                            {/* Tên học sinh */}
                                            <div className='text_6_400' style={{
                                                flex: 2,
                                                padding: '12px 8px',
                                                fontWeight: '500'
                                            }}>
                                                <div>{stu.Name}</div>
                                            </div>

                                            {/* Radio buttons cho điểm danh */}
                                            <div style={{
                                                flex: 3,
                                                display: 'flex',
                                                gap: '16px',
                                                alignItems: 'center'
                                            }}>
                                                <label style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    justifyContent: 'center',
                                                    padding: '12px 0'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="1"
                                                        checked={currentAttendance === '1'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '1')}
                                                        style={{ margin: 0, transform: 'scale(1.1)', cursor: 'pointer' }}
                                                    />

                                                </label>

                                                <label style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    justifyContent: 'center',
                                                    padding: '12px 0'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="0"
                                                        checked={currentAttendance === '0'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '0')}
                                                        style={{ margin: 0, transform: 'scale(1.1)', cursor: 'pointer' }}
                                                    />

                                                </label>

                                                <label style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    justifyContent: 'center',
                                                    padding: '12px 0'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="2"
                                                        checked={currentAttendance === '2'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '2')}
                                                        style={{ margin: 0, transform: 'scale(1.1)', cursor: 'pointer' }}
                                                    />

                                                </label>
                                            </div>

                                            {/* Nút nhận xét */}
                                            <button
                                                onClick={() => handleCommentClick(stu)}
                                                style={{
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    flex: 1,
                                                    background: 'none',
                                                    padding: 0
                                                }}
                                            >
                                                <div>
                                                    <svg viewBox="0 0 24 24" height={24} width={24} fill='var(--text-primary)'>
                                                        <path d="M14 11c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h9c.55 0 1 .45 1 1M3 7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1m7 8c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1m8.01-2.13.71-.71c.39-.39 1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71-5.16 5.16c-.09.09-.14.21-.14.35v1.41c0 .28.22.5.5.5h1.41c.13 0 .26-.05.35-.15l5.16-5.16z"></path>
                                                    </svg>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </>
                        ) : (
                            <div className={styles.noData}>
                                <p>Không có học sinh tham gia khóa học</p>
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Popup nhận xét */}
            <CenterPopup
                open={showCommentPopup}
                onClose={() => setShowCommentPopup(false)}
                title={`Nhận xét học sinh`}
                size="lg"
            >
                <CommentForm
                    student={selectedStudent}
                    initialComment={selectedStudent ? (comments[selectedStudent.ID] || selectedStudent.originalComment || '') : ''}
                    onSave={handleSaveComment}
                    onCancel={() => setShowCommentPopup(false)}
                />
            </CenterPopup>
        </div>
    )
}
