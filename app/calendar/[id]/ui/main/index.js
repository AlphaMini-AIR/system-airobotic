'use client';

import BoxFile from '@/components/(box)/file'
import CenterPopup from '@/components/(popup)/popup_center'
import CommentForm from './CommentPopup'
import styles from './index.module.css'
import { useState } from 'react'

export default function Main({ data }) {
    const { course, session, slide } = data

    // State cho popup và form data
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

    // Hàm xử lý thay đổi điểm danh
    const handleAttendanceChange = (studentId, value) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    // Hàm mở popup nhận xét
    const handleCommentClick = (student) => {
        setSelectedStudent(student);
        setShowCommentPopup(true);
    };

    // Hàm lưu nhận xét
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
        // TODO: Gọi API để lưu dữ liệu
        alert('Đã lưu thành công!');
    };

    // tính thống kê dựa trên attendanceData hoặc dữ liệu gốc
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
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                            >
                                💾 Lưu tất cả thay đổi
                            </button>
                        </div>{rollCall.length > 0 ? (
                            <div className={styles.table}>
                                {/* header row */}
                                <div className={`${styles.row} ${styles.headerRow}`}>
                                    <div className='text_6_400' style={{ flex: 2, color: 'white', padding: 8 }}>
                                        Học sinh
                                    </div>
                                    <div className='text_6_400' style={{ flex: 3, color: 'white', padding: 8 }}>
                                        Điểm danh
                                    </div>
                                    <div className='text_6_400' style={{ flex: 1, color: 'white', padding: 8 }}>
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
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: '#6c757d',
                                                    marginTop: '2px'
                                                }}>
                                                    {stu.ID}
                                                </div>
                                            </div>

                                            {/* Radio buttons cho điểm danh */}
                                            <div style={{ 
                                                flex: 3, 
                                                padding: '12px 8px',
                                                display: 'flex', 
                                                gap: '16px',
                                                alignItems: 'center'
                                            }}>
                                                <label style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px', 
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="1"
                                                        checked={currentAttendance === '1'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '1')}
                                                        style={{ margin: 0, transform: 'scale(1.1)' }}
                                                    />
                                                    <span style={{ color: '#28a745', fontWeight: '500' }}>
                                                        ✓ Có mặt
                                                    </span>
                                                </label>
                                                
                                                <label style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px', 
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="0"
                                                        checked={currentAttendance === '0'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '0')}
                                                        style={{ margin: 0, transform: 'scale(1.1)' }}
                                                    />
                                                    <span style={{ color: '#dc3545', fontWeight: '500' }}>
                                                        ✗ Vắng không phép
                                                    </span>
                                                </label>
                                                
                                                <label style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px', 
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={`attendance_${stu.ID}`}
                                                        value="2"
                                                        checked={currentAttendance === '2'}
                                                        onChange={() => handleAttendanceChange(stu.ID, '2')}
                                                        style={{ margin: 0, transform: 'scale(1.1)' }}
                                                    />
                                                    <span style={{ color: '#ffc107', fontWeight: '500' }}>
                                                        ~ Vắng có phép
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {/* Nút nhận xét */}
                                            <div style={{ flex: 1, padding: '12px 8px' }}>
                                                <button
                                                    onClick={() => handleCommentClick(stu)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: hasComment ? '#28a745' : '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.backgroundColor = hasComment ? '#218838' : '#0056b3'
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.backgroundColor = hasComment ? '#28a745' : '#007bff'
                                                    }}
                                                >
                                                    {hasComment ? '✓ Có nhận xét' : '📝 Nhận xét'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className={styles.noData}>
                                <p>Không có học sinh tham gia khóa học</p>
                            </div>
                        )}                    </section>
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
