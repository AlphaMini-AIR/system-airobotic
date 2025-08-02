import React, { useState, useMemo, useEffect } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import styles from './index.module.css'; // Import CSS Module

// API để tạo nhận xét chung từ AI
const fetchStudentCommentsAPI = async (cmtArray) => {
    try {
        const response = await fetch('/api/cmt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comments: cmtArray })
        });
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Lỗi khi gọi API nhận xét:", error);
        return "Không thể tạo nhận xét. Vui lòng thử lại.";
    }
};

// API gửi nhận xét cho từng học sinh
const sendCommentAPI = async (studentId, comment) => {
    try {
        const response = await fetch('/api/cmt', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: studentId, cmt: comment })
        });
        const result = await response.json();
        if (!response.ok) {
            return { status: false, mes: result.mes || `Lỗi HTTP: ${response.status}` };
        }
        return result;
    } catch (error) {
        console.error(`Lỗi khi gửi nhận xét cho học sinh ${studentId}:`, error);
        return { status: false, mes: error.message || "Lỗi không xác định." };
    }
};

export default function SendCmt({ data, lesson }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [apiComment, setApiComment] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
    const [sendResults, setSendResults] = useState(null);
    const [showResultsPopup, setShowResultsPopup] = useState(false);

    const filteredStudents = useMemo(() => {
        return data?.Student.filter(student => student.Learn?.some(item => item.Lesson === lesson && item.Checkin == 1)) ?? [];
    }, [data, lesson]);

    const baseContentTemplate = useMemo(() => {
        const foundItem = data.Detail.find(item => item._id === lesson);
        if (!foundItem) { return 'Không tìm thấy thông tin buổi học.'; }

        const currentIndex = data.Detail.findIndex(item => item._id === lesson);
        const maxDay = data.Detail.reduce((max, currentItem) => currentItem.Day > max ? currentItem.Day : max, data.Detail[0].Day);

        let nextTopic;
        if (foundItem.Day === maxDay) {
            nextTopic = 'Content Cuối khóa';
        } else {
            const nextLessonInList = data.Detail[currentIndex + 1];
            nextTopic = `📘 Giới thiệu nội dung buổi học tiếp theo: \n${nextLessonInList.LessonDetails.Name}\n${nextLessonInList.LessonDetails.Content}`;
        }

        return `Báo cáo học tập sau buổi học - Khóa AI Robotic\nTiết học: ${foundItem.LessonDetails.Name}\nHọc sinh: {namestudent}\n📌 Nội dung buổi học hôm nay:\n${foundItem.LessonDetails.Content} \n🎯 Nhận xét về quá trình học của bé {namestudent} qua tiết học:\n{detailcomment} \nLink hình ảnh buổi học: https://drive.google.com/drive/folders/${foundItem.Image}\n${nextTopic}`;
    }, [data, lesson]);

    useEffect(() => {
        if (isPopupOpen && filteredStudents.length > 0) {
            const fetchComment = async () => {
                setIsLoading(true);
                setApiComment('');
                const commentsToProcess = filteredStudents.flatMap(student =>
                    student.Learn
                        .filter(item => item.Lesson === lesson && item.Cmt && item.Cmt.length > 0)
                        .flatMap(item => item.Cmt)
                );
                const uniqueComments = [...new Set(commentsToProcess)];
                if (uniqueComments.length > 0) {
                    let comment = await fetchStudentCommentsAPI(uniqueComments);
                    setApiComment(comment);
                } else {
                    setApiComment('Không có nhận xét phù hợp để gửi đi.');
                }
                setIsLoading(false);
                setSelectedStudentId(filteredStudents[0]?._id);
            };
            fetchComment();
        }
    }, [isPopupOpen, filteredStudents, lesson]);

    useEffect(() => {
        if (!selectedStudentId) return;
        const student = filteredStudents.find(s => s._id === selectedStudentId);
        if (student) {
            const detailComment = isLoading ? 'Đang tạo nhận xét...' : (apiComment || 'Chưa có nhận xét.');
            let newContent = baseContentTemplate
                .replace(/{namestudent}/g, student.Name)
                .replace('{detailcomment}', detailComment);
            setTextContent(newContent);
        }
    }, [selectedStudentId, apiComment, isLoading, filteredStudents, baseContentTemplate]);

    const handleSendAllComments = async () => {
        setIsSending(true);
        setSendProgress({ current: 0, total: filteredStudents.length });
        setShowResultsPopup(false);

        const results = { success: [], failure: [] };

        for (let i = 0; i < filteredStudents.length; i++) {
            const student = filteredStudents[i];
            const detailComment = apiComment || 'Chưa có nhận xét.';
            const studentComment = baseContentTemplate
                .replace(/{namestudent}/g, student.Name)
                .replace('{detailcomment}', detailComment);

            const result = await sendCommentAPI(student._id, studentComment);

            if (result.status) {
                results.success.push(student);
            } else {
                results.failure.push({ ...student, mes: result.mes });
            }

            await new Promise(res => setTimeout(res, 50));
            setSendProgress({ current: i + 1, total: filteredStudents.length });
        }

        setSendResults(results);
        setIsSending(false);
        setShowResultsPopup(true);
    };

    const handleOpenPopup = () => setIsPopupOpen(true);

    const handleClosePopup = () => {
        setIsPopupOpen(false);
        setApiComment('');
        setSelectedStudentId(null);
        setTextContent('');
        setIsLoading(false);
        setIsSending(false);
        setShowResultsPopup(false);
        setSendResults(null);
        setSendProgress({ current: 0, total: 0 });
    };

    const ProgressPopup = () => (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h3 className={styles.progressHeader}>Đang gửi nhận xét...</h3>
                <p className={styles.progressText}>{`Đã gửi ${sendProgress.current} / ${sendProgress.total}`}</p>
                <div className={styles.progressContainer}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );

    const ResultsPopup = () => (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h3 className={styles.resultsHeader}>Kết quả gửi nhận xét</h3>
                <div className={styles.summary}>
                    <div className={`${styles.summaryItem} ${styles.success}`}>
                        <svg className={styles.summaryIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm-1.47 14.03l-3.5-3.5 1.41-1.41 2.09 2.09 4.5-4.5 1.41 1.41-5.91 5.92z" fill="var(--green, #28a745)"></path></svg>
                        <span className={`${styles.summaryText} ${styles.success}`}>Thành công: {sendResults.success.length}</span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.failure}`}>
                        <svg className={styles.summaryIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="var(--red, #dc3545)"></path></svg>
                        <span className={`${styles.summaryText} ${styles.failure}`}>Thất bại: {sendResults.failure.length}</span>
                    </div>
                </div>
                <div className={styles.resultsList}>
                    {sendResults.failure.length > 0 && (
                        <div>
                            <h4>Danh sách gửi thất bại:</h4>
                            <ul>
                                {sendResults.failure.map(student => (
                                    <li key={student._id} className={styles.resultItem}>
                                        <span className={styles.studentName}>{student.Name}</span>
                                        <span className={styles.errorMessage}>{student.mes}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {sendResults.success.length > 0 && (
                        <div>
                            <p className='text_6'>Danh sách gửi thành công:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {sendResults.success.map(student => (
                                    <p key={student._id} className={styles.resultItem}>
                                        <span className={styles.studentName}>{student.Name}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => setShowResultsPopup(false)} className={styles.actionButton}>Đóng</button>
            </div>
        </div>
    );

    return (
        <>
            <div className='btn' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)', cursor: 'pointer' }} onClick={handleOpenPopup}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="white"><path d="M256 0c13.3 0 26.3 1 39.1 3l-3.7 23.7C279.9 24.9 268 24 256 24s-23.9 .9-35.4 2.7L216.9 3C229.7 1 242.7 0 256 0zm60.8 7.3l-5.7 23.3c23.4 5.7 45.4 14.9 65.4 27.1l12.5-20.5c-22.1-13.4-46.4-23.6-72.2-29.9zm90.5 42.2L393.1 68.8c19.1 14 36 30.9 50.1 50.1l19.4-14.2C447 83.6 428.4 65 407.3 49.5zm67.5 73.6l-20.5 12.5c12.2 20 21.4 42 27.1 65.4l23.3-5.7c-6.3-25.8-16.5-50.1-29.9-72.2zM509 216.9l-23.7 3.7c1.8 11.5 2.7 23.4 2.7 35.4s-.9 23.9-2.7 35.4l23.7 3.7c1.9-12.7 3-25.8 3-39.1s-1-26.3-3-39.1zM454.3 376.5c12.2-20 21.4-42 27.1-65.4l23.3 5.7c-6.3 25.8-16.5-50.1-29.9 72.2l-20.5-12.5zm-11.1 16.6l19.4 14.2c-15.5 21.1-34.1 39.8-55.2 55.2l-14.2-19.4c19.1-14 36-30.9 50.1-50.1zm-66.7 61.2l12.5 20.5c-22.1 13.4-46.4-23.6-72.2-29.9l-5.7-23.3c23.4-5.7 45.4-14.9 65.4-27.1zm-85.1 31l3.7 23.7c-12.7 1.9-25.8 3-39.1 3s-26.3-1-39.1-3l3.7-23.7c11.5 1.8 23.4 2.7 35.4 2.7s23.9-.9 35.4-2.7zm-90.5-3.9l-5.7 23.3c-19.4-4.7-37.9-11.6-55.3-20.5l-24.3 5.7-5.5-23.4 32.8-7.7 7.8 4c15.7 8 32.5 14.3 50.1 18.6zM90 471.3l5.5 23.4-41.6 9.7C26 510.8 1.2 486 7.6 458.2l9.7-41.6L40.7 422 31 463.7c-2.4 10.4 6.9 19.7 17.3 17.3L90 471.3zM45.5 401.8l-23.4-5.5L27.8 372C18.9 354.7 12 336.1 7.3 316.7l23.3-5.7c4.3 17.6 10.6 34.4 18.6 50.1l4 7.8-7.7 32.8zM26.7 291.4L3 295.1C1 282.3 0 269.3 0 256s1-26.3 3-39.1l23.7 3.7C24.9 232.1 24 244 24 256s.9 23.9 2.7 35.4zm3.9-90.5L7.3 195.2c6.3-25.8 16.5-50.1 29.9-72.2l20.5 12.5c-12.2 20-21.4 42-27.1 65.4zm38.3-82.1L49.5 104.7C65 83.6 83.6 65 104.7 49.5l14.2 19.4c-19.1-14 36-30.9-50.1 50.1zm66.7-61.2L123.1 37.2c22.1-13.4 46.4-23.6 72.2-29.9l5.7 23.3c-23.4 5.7-45.4 14.9-65.4 27.1zM464 256c0 114.9-93.1 208-208 208c-36.4 0-70.7-9.4-100.5-25.8c-2.9-1.6-6.2-2.1-9.4-1.4L53.6 458.4l21.6-92.5c.7-3.2 .2-6.5-1.4-9.4C57.4 326.7 48 292.4 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208z"></path></svg>
                <p className='text_6_400' style={{ color: 'white' }}>Gửi nhận xét</p>
            </div>

            <FlexiblePopup
                open={isPopupOpen}
                onClose={handleClosePopup}
                title="Gửi nhận xét cho học sinh"
                width={600}
                data={filteredStudents}
                renderItemList={students => students.length > 0 ? (
                    <div style={{ padding: '8px 16px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                            <p className='text_6' style={{ padding: '8px 0', flexShrink: 0 }}>Nội dung xem trước</p>
                            <textarea
                                className='input'
                                value={isLoading ? 'Đang tải và tạo nhận xét...' : textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                style={{ flexGrow: 1, resize: 'none', minHeight: '150px' }}
                                readOnly={isLoading || isSending}
                            />
                        </div>
                        <div style={{ width: '100%', overflowY: 'auto', flexGrow: 1, marginTop: '16px' }}>
                            <p className='text_6' style={{ padding: '8px 0', flexShrink: 0 }}>Danh sách học sinh sẽ gửi</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {students.map(student => (
                                    <li key={student._id}
                                        onClick={() => setSelectedStudentId(student._id)}
                                        style={{ padding: '12px 10px', cursor: 'pointer', backgroundColor: selectedStudentId === student._id ? '#e9ecef' : 'transparent', fontWeight: selectedStudentId === student._id ? 'bold' : 'normal', borderBottom: '1px solid #f0f0f0', borderRadius: '4px' }}
                                    >
                                        {student.Name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'right', flexShrink: 0 }}>
                            <button
                                className={styles.actionButton}
                                onClick={handleSendAllComments}
                                disabled={isLoading || isSending || students.length === 0}
                            >
                                {isSending ? `Đang gửi...` : `Xác nhận & Gửi cho tất cả (${students.length})`}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '20px' }}>Không có học sinh nào đã check-in trong buổi học này.</p>
                )}
            />

            {isSending && <ProgressPopup />}
            {showResultsPopup && sendResults && <ResultsPopup />}
        </>
    );
}