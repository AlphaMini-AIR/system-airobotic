'use client';
import React, { useState, useMemo, useCallback } from 'react';
import styles from './index.module.css';
import { Svg_Delete, Svg_Add, Svg_Pen, Svg_Slide } from '@/components/(icon)/svg';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import EditBookForm from '../EditBookForm';
import AddTopicForm from '../AddTopicForm';
import EditTopicForm from '../EditTopicForm';
import { Re_book, Re_book_one } from '@/data/book';
import AlertPopup from '@/components/(features)/(noti)/alert';
import TextNoti from '@/components/(features)/(noti)/textnoti';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const DropPlaceholder = React.memo(() => (
    <div style={{ height: '70px', background: 'rgba(0, 123, 255, 0.1)', border: '2px dashed var(--main_b, #007bff)', borderRadius: '8px', margin: '4px 0' }} />
));
DropPlaceholder.displayName = 'DropPlaceholder';

const loadingOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 };
const topicImageContainerStyle = { width: 100, aspectRatio: '4/3', overflow: 'hidden', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)' };
const topicActionsStyle = { display: 'flex', gap: 4 };

const BookDetail = ({ data: initialData }) => {
    const [bookData, setBookData] = useState({ ...initialData, Topics: initialData.Topics || [] });

    const [isEditPopupOpen, setEditPopupOpen] = useState(false);
    const [isAddTopicPopupOpen, setAddTopicPopupOpen] = useState(false);
    const [isEditTopicPopupOpen, setEditTopicPopupOpen] = useState(false);
    const [currentEditingTopic, setCurrentEditingTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notiState, setNotiState] = useState({ open: false, status: true, mes: '' });

    // 2. THÊM STATE CHO ALERT
    const [alertConfig, setAlertConfig] = useState({ open: false, title: '', content: null, actions: null, type: 'info' });

    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const API_ENDPOINT = useMemo(() => `/api/book/${bookData._id}`, [bookData._id]);

    const formattedPrice = useMemo(() => new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND',
    }).format(bookData.Price), [bookData.Price]);

    const handleCloseNoti = useCallback(() => setNotiState(prev => ({ ...prev, open: false })), []);
    const handleCloseAlert = useCallback(() => setAlertConfig(prev => ({ ...prev, open: false })), []);


    const handleDragStart = useCallback((e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragEnter = useCallback((e, index) => {
        e.preventDefault();
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    }, [dragOverIndex]);

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
            handleDragEnd();
            return;
        }

        const originalTopics = [...bookData.Topics];
        const reorderedTopics = reorder(originalTopics, draggedIndex, dragOverIndex);

        setBookData(prev => ({ ...prev, Topics: reorderedTopics }));
        handleDragEnd();

        const orderedTopicIds = reorderedTopics.map(t => t._id);
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedTopicIds }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes || 'Lỗi không xác định');

            setNotiState({ open: true, status: true, mes: result.mes || 'Cập nhật thứ tự thành công!' });
            Re_book();
            Re_book_one(initialData._id);
        } catch (error) {
            console.error('Lỗi khi sắp xếp chủ đề:', error);
            setNotiState({ open: true, status: false, mes: `Lỗi: ${error.message}` });
            setBookData(prev => ({ ...prev, Topics: originalTopics }));
        } finally {
            setIsLoading(false);
        }
    }, [draggedIndex, dragOverIndex, bookData.Topics, handleDragEnd, API_ENDPOINT, initialData._id]);

    const callApi = useCallback(async (method, body) => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (result.status === 2) {
                setNotiState({ open: true, status: true, mes: result.mes });
                if (method !== 'DELETE') {
                    setBookData({ ...result.data, Topics: result.data.Topics || [] });
                }
                Re_book_one(initialData._id);
                Re_book();
                return true;
            } else {
                setNotiState({ open: true, status: false, mes: result.mes });
                return false;
            }
        } catch (error) {
            console.error(`Lỗi khi ${method} API:`, error);
            setNotiState({ open: true, status: false, mes: error.message });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [API_ENDPOINT, initialData._id]);

    const handleSaveBook = useCallback(async (formData) => {
        const success = await callApi('PUT', formData);
        if (success) setEditPopupOpen(false);
    }, [callApi]);

    const handleSaveTopic = useCallback(async (newTopicData) => {
        const success = await callApi('POST', { topics: [newTopicData] });
        if (success) setAddTopicPopupOpen(false);
    }, [callApi]);

    const handleCloseEditTopicPopup = useCallback(() => {
        setEditTopicPopupOpen(false);
        setCurrentEditingTopic(null);
    }, []);

    const handleSaveEditedTopic = useCallback(async (updatedTopicData) => {
        if (!currentEditingTopic) return;
        const body = {
            topicId: currentEditingTopic._id,
            updateData: updatedTopicData
        };
        const success = await callApi('PUT', body);
        if (success) handleCloseEditTopicPopup();
    }, [callApi, currentEditingTopic, handleCloseEditTopicPopup]);

    // 4. HÀM THỰC THI VIỆC XÓA
    const executeDelete = useCallback(async (topicId) => {
        handleCloseAlert();
        const success = await callApi('DELETE', { topicId });
        if (success) {
            setBookData(prev => ({
                ...prev, Topics: prev.Topics.filter(t => t._id !== topicId)
            }));
        }
    }, [callApi, handleCloseAlert]);

    // 3. CẬP NHẬT HÀM XỬ LÝ XÓA
    const handleDeleteTopic = useCallback((topicId, topicName) => {
        setAlertConfig({
            open: true,
            type: 'warning',
            title: 'Xác nhận vô hiệu hóa',
            content: (
                <>
                    <TextNoti color={'yellow'} title={`Xóa chủ đề khỏi chương trình học`} mes={`Xóa chủ đề học sẽ loại bỏ chủ đề này khỏi chương trình học, các học sinh đã học chủ đề này vẫn lưu thông tin chủ đề nhưng không thể tạo khóa mới với chủ đề này.`} />
                    <p className='text_6_400' style={{ marginTop: 16 }}>
                        Bạn có chắc chắn muốn xóa hóa chủ đề {topicName}? Chủ đề sẽ bị ẩn khỏi giao diện người dùng và không thể khôi phục lại sau khi xóa.
                    </p>
                </>
            ),
            actions: (
                <>
                    <button onClick={handleCloseAlert} className='btn' style={{ background: 'var(--gray_b, #6c757d)', margin: 0 }}>Hủy</button>
                    <button onClick={() => executeDelete(topicId)} className='btn' style={{ background: 'var(--red, #dc3545)', margin: 0 }}>Tiếp tục</button>
                </>
            )
        });
    }, [executeDelete, handleCloseAlert]);

    const handleOpenEditTopicPopup = useCallback((topic) => {
        setCurrentEditingTopic(topic);
        setEditTopicPopupOpen(true);
    }, []);
    let i = 0
    return (
        <>
            <div className={styles.container}>
                <aside className={styles.infoPanel}>
                    <div className={styles.imageContainer}> <img src={bookData.Image} alt={bookData.Name} className={styles.bookImage} /> </div>
                    <p className='text_2' style={{ marginBottom: 8 }}>{bookData.Name}</p>
                    <div className={styles.metaInfo} style={{ marginBottom: 16 }}>
                        <p className='text_6_400'><strong>Loại chương trình:</strong> {bookData.Type}</p>
                        <p className='text_6_400'><strong>Học phí:</strong> {formattedPrice}</p>
                        <p className='text_6_400'><strong>Số chủ đề:</strong> {bookData.Topics.length} chủ đề</p>
                        <p className='text_6_400'><strong>Số tiết quy định:</strong> {bookData.Topics.reduce((total, item) => total + (item.Period || 0), 0)} tiết</p>
                    </div>
                    <button onClick={() => setEditPopupOpen(true)} className={`${styles.btn} ${styles.editBtn}`}> <Svg_Pen w={18} h={18} c={'white'} /> <p className='text_6_400' style={{ color: 'white' }}>Chỉnh sửa thông tin</p> </button>
                </aside>

                <main className={styles.topicsPanel} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                    <div className={styles.topicsHeader}>
                        <p className='text_2'>Danh sách chủ đề</p>
                        <button onClick={() => setAddTopicPopupOpen(true)} className={`${styles.btn} ${styles.editBtn}`}> <Svg_Add w={18} h={18} c={'white'} /> <p className='text_6_400' style={{ color: 'white' }}>Thêm chủ đề</p> </button>
                    </div>
                    <ul className={styles.topicList}>
                        {bookData.Topics.map((topic, index) => {
                            if (topic.Status === false) return null;
                            i++;
                            const isDragging = draggedIndex === index;
                            const dragStyle = {
                                display: 'flex', gap: 8, marginBottom: 8, cursor: 'move',
                                opacity: isDragging ? 0.5 : 1,
                                transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                                boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : 'none',
                                transition: 'all 0.2s ease-in-out'
                            };
                            return (
                                <React.Fragment key={topic._id}>
                                    {dragOverIndex === index && !isDragging && <DropPlaceholder />}
                                    <div draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} style={dragStyle}>
                                        <div style={topicImageContainerStyle}>
                                            <p className='text_7'>Chủ đề: {i}</p>
                                        </div>
                                        <li className={styles.topicItem}>
                                            <div className={styles.topicInfo}>
                                                <p className='text_4'>{topic.Name}</p>
                                                <p className={styles.topicPeriod}>Thời lượng: {topic.Period || 'N/A'} tiết</p>
                                            </div>
                                            <div style={topicActionsStyle}>
                                                <div className='wrapicon' style={{ background: 'var(--yellow)' }} onClick={() => handleOpenEditTopicPopup(topic)}><Svg_Pen w={18} h={18} c={'white'} /></div>
                                                <a href={topic.Slide} target="_blank" rel="noopener noreferrer" className='wrapicon' style={{ background: 'var(--main_b)' }}><Svg_Slide w={18} h={18} c={'white'} /></a>
                                                <div className='wrapicon' style={{ background: 'var(--red)' }} onClick={() => handleDeleteTopic(topic._id, topic.Name)}><Svg_Delete w={15} h={15} c={'white'} /></div>
                                            </div>
                                        </li>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </ul>
                </main>
            </div >

            <FlexiblePopup open={isEditPopupOpen} onClose={() => setEditPopupOpen(false)} title="Chỉnh sửa thông tin sách" width={500} renderItemList={() => (<EditBookForm initialData={bookData} onSave={handleSaveBook} onCancel={() => setEditPopupOpen(false)} />)} />
            <FlexiblePopup open={isAddTopicPopupOpen} onClose={() => setAddTopicPopupOpen(false)} title="Thêm chủ đề mới" width={500} renderItemList={() => (<AddTopicForm onSave={handleSaveTopic} onCancel={() => setAddTopicPopupOpen(false)} />)} />

            {
                currentEditingTopic && (
                    <FlexiblePopup open={isEditTopicPopupOpen} onClose={handleCloseEditTopicPopup} title={`Chỉnh sửa: ${currentEditingTopic.Name}`} width={500} renderItemList={() => (<EditTopicForm initialData={currentEditingTopic} onSave={handleSaveEditedTopic} onCancel={handleCloseEditTopicPopup} />)} />
                )
            }

            {isLoading && (<div style={loadingOverlayStyle}><Loading content="Đang xử lý..." /></div>)}

            <Noti open={notiState.open} onClose={handleCloseNoti} status={notiState.status} mes={notiState.mes} button={(<button onClick={handleCloseNoti} className='btn' style={{ width: '100%', justifyContent: 'center' }}>Đóng</button>)} />

            <AlertPopup
                open={alertConfig.open}
                onClose={handleCloseAlert}
                type={alertConfig.type}
                title={alertConfig.title}
                content={alertConfig.content}
                actions={alertConfig.actions}
            />
        </>
    );
};

export default BookDetail;