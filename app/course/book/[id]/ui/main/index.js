'use client';
import React, { useState, useMemo, useCallback } from 'react';
import styles from './index.module.css';
import { Svg_Delete, Svg_Add, Svg_Pen, Svg_Slide } from '@/components/svg';
import Loading from '@/components/(loading)/loading';
import Noti from '@/components/(noti)/noti';
import FlexiblePopup from '@/components/(popup)/popup_right';
import EditBookForm from '../EditBookForm';
import AddTopicForm from '../AddTopicForm';
import EditTopicForm from '../EditTopicForm';
import { Re_book, Re_book_one } from '@/data/book';

// Hàm trợ giúp để sắp xếp lại các chủ đề trong MẢNG
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const BookDetail = ({ data: initialData }) => {
    // Đảm bảo Topics luôn là một mảng
    const [bookData, setBookData] = useState({ ...initialData, Topics: initialData.Topics || [] });
    const [isEditPopupOpen, setEditPopupOpen] = useState(false);
    const [isAddTopicPopupOpen, setAddTopicPopupOpen] = useState(false);
    const [isEditTopicPopupOpen, setEditTopicPopupOpen] = useState(false);
    const [currentEditingTopic, setCurrentEditingTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notiState, setNotiState] = useState({ open: false, status: true, mes: '' });

    // State cho chức năng kéo-thả
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // API Endpoint chuẩn hóa
    const API_ENDPOINT = `/api/book/${bookData._id}`;

    const formattedPrice = useMemo(() => new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND',
    }).format(bookData.Price), [bookData.Price]);

    const handleCloseNoti = useCallback(() => {
        setNotiState(prev => ({ ...prev, open: false }));
    }, []);

    // --- Xử lý kéo-thả ---
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
            handleDragEnd();
            return;
        }

        const reorderedTopics = reorder(bookData.Topics, draggedIndex, dragOverIndex);
        // Cập nhật UI trước để tạo cảm giác nhanh chóng
        setBookData(prevData => ({ ...prevData, Topics: reorderedTopics }));
        handleDragEnd();

        // Gọi API để lưu thứ tự mới
        const orderedTopicIds = reorderedTopics.map(t => t._id);
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedTopicIds }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes);

            setNotiState({ open: true, status: true, mes: 'Cập nhật thứ tự chủ đề thành công!' });
            Re_book();
            Re_book_one(initialData._id);
        } catch (error) {
            console.error('Lỗi khi sắp xếp chủ đề:', error);
            setNotiState({ open: true, status: false, mes: `Lỗi: ${error.message}` });
            // Hoàn tác lại nếu có lỗi
            setBookData(prevData => ({ ...prevData, Topics: bookData.Topics }));
        } finally {
            setIsLoading(false);
        }
    };

    // --- API Handlers ---
    const callApi = async (method, body) => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes || 'Lỗi không xác định.');

            // Cập nhật state với dữ liệu mới nhất từ server
            if (result.data) {
                setBookData({ ...result.data, Topics: result.data.Topics || [] });
            }
            setNotiState({ open: true, status: true, mes: result.mes });

            // Revalidate data
            Re_book_one(initialData._id);
            Re_book();
            return true; // Thành công
        } catch (error) {
            console.error(`Lỗi khi ${method} API:`, error);
            setNotiState({ open: true, status: false, mes: error.message });
            return false; // Thất bại
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBook = async (updatedFormData) => {
        const success = await callApi('PUT', updatedFormData);
        if (success) setEditPopupOpen(false);
    };

    const handleSaveTopic = async (newTopicData) => {
        const success = await callApi('POST', { topics: [newTopicData] });
        if (success) setAddTopicPopupOpen(false);
    };

    const handleSaveEditedTopic = async (updatedTopicData) => {
        if (!currentEditingTopic) return;
        const body = {
            topicId: currentEditingTopic._id,
            updateData: updatedTopicData
        };
        const success = await callApi('PUT', body);
        if (success) handleCloseEditTopicPopup();
    };

    const handleDeleteTopic = async (topicId, topicName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicName}"?`)) {
            const success = await callApi('DELETE', { topicId });
            if (success) {
                setBookData(prev => ({
                    ...prev,
                    Topics: prev.Topics.filter(t => t._id !== topicId)
                }));
            }
        }
    };

    const handleOpenEditTopicPopup = useCallback((topic) => {
        setCurrentEditingTopic(topic);
        setEditTopicPopupOpen(true);
    }, []);

    const handleCloseEditTopicPopup = useCallback(() => {
        setEditTopicPopupOpen(false);
        setCurrentEditingTopic(null);
    }, []);

    // Placeholder cho vị trí sẽ được thả vào
    const DropPlaceholder = () => (<div style={{ height: '70px', background: 'rgba(0, 123, 255, 0.1)', border: '2px dashed var(--main_b, #007bff)', borderRadius: '8px', margin: '4px 0' }} />);

    return (
        <>
            <div className={styles.container}>
                <aside className={styles.infoPanel}>
                    {/* Phần thông tin sách không thay đổi */}
                    <div className={styles.imageContainer}> <img src={bookData.Image} alt={bookData.Name} className={styles.bookImage} /> </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}> <p className='text_2'>{bookData.Name}</p> <p className='text_7' style={{ padding: '4px 16px', borderRadius: 12, background: 'var(--border-color)' }}>{bookData.Type}</p> </div>
                    <div className={styles.metaInfo} style={{ marginBottom: 16 }}>
                        <p className='text_6_400'><strong>Học phí:</strong> {formattedPrice}</p>
                        <p className='text_6_400'><strong>Số chủ đề:</strong> {bookData.Topics.length} chủ đề</p>
                        <p className='text_6_400'><strong>Số tiết quy định:</strong> {bookData.Topics.reduce((total, item) => total + item.Period, 0)} tiết</p>
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
                            const isDragging = draggedIndex === index;
                            return (
                                <React.Fragment key={topic._id}>
                                    {dragOverIndex === index && !isDragging && <DropPlaceholder />}
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragEnd={handleDragEnd}
                                        style={{ display: 'flex', gap: 8, marginBottom: 8, cursor: 'move', opacity: isDragging ? 0.5 : 1, transform: isDragging ? 'scale(1)' : 'scale(0.99)', boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }}
                                    >
                                        <div style={{ width: 100, aspectRatio: '4/3', overflow: 'hidden', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)' }}>
                                            <p className='text_7'>Chủ đề: {index + 1}</p>
                                        </div>
                                        <li className={styles.topicItem}>
                                            <div className={styles.topicInfo}>
                                                <p className='text_4'>{topic.Name}</p>
                                                <p className={styles.topicPeriod}>Thời lượng: {topic.Period || 'N/A'} tiết</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <div className='wrapicon' style={{ background: 'var(--yellow)' }} onClick={() => handleOpenEditTopicPopup(topic)}>
                                                    <Svg_Pen w={18} h={18} c={'white'} />
                                                </div>
                                                <a href={topic.Slide} target="_blank" rel="noopener noreferrer" className='wrapicon' style={{ background: 'var(--main_b)' }}>
                                                    <Svg_Slide w={18} h={18} c={'white'} />
                                                </a>
                                                <div className='wrapicon' style={{ background: 'var(--red)' }} onClick={() => handleDeleteTopic(topic._id, topic.Name)}>
                                                    <Svg_Delete w={15} h={15} c={'white'} />
                                                </div>
                                            </div>
                                        </li>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </ul>
                </main>
            </div>

            <FlexiblePopup open={isEditPopupOpen} onClose={() => setEditPopupOpen(false)} title="Chỉnh sửa thông tin sách" width={500}
                renderItemList={() => (<EditBookForm initialData={bookData} onSave={handleSaveBook} onCancel={() => setEditPopupOpen(false)} />)}
            />
            <FlexiblePopup open={isAddTopicPopupOpen} onClose={() => setAddTopicPopupOpen(false)} title="Thêm chủ đề mới" width={500}
                renderItemList={() => (<AddTopicForm onSave={handleSaveTopic} onCancel={() => setAddTopicPopupOpen(false)} />)}
            />
            {currentEditingTopic && (
                <FlexiblePopup open={isEditTopicPopupOpen} onClose={() => setEditTopicPopupOpen(false)} title={`Chỉnh sửa: ${currentEditingTopic.Name}`} width={500}
                    renderItemList={() => (<EditTopicForm initialData={currentEditingTopic} onSave={handleSaveEditedTopic} onCancel={() => setEditTopicPopupOpen(false)} />)}
                />
            )}

            {isLoading && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
                    <Loading content="Đang xử lý..." />
                </div>
            )}
            <Noti open={notiState.open} onClose={handleCloseNoti} status={notiState.status} mes={notiState.mes} />
        </>
    );
};

export default BookDetail;