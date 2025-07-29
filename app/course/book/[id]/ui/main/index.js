'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './index.module.css';
import { Svg_Delete, Svg_Add, Svg_Pen, Svg_Slide } from '@/components/(icon)/svg';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import EditBookForm from '../EditBookForm';
import AddTopicForm from '../AddTopicForm';
import EditTopicForm from '../EditTopicForm';
import AlertPopup from '@/components/(features)/(noti)/alert';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { driveImage } from '@/function';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

// --- Sub-components for better structure ---

const InfoPanel = React.memo(({ bookData, formattedPrice, onEditClick }) => (
    <aside className={styles.infoPanel}>
        <div className={styles.imageContainer}>
            <Image
                src={driveImage(bookData.Image)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.bookImage}
                style={{ width: bookData.Badge ? 'calc(50% - 4px)' : '100%' }}
            />
            {bookData.Badge && <Image
                src={driveImage(bookData.Badge)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className={styles.bookImage}
            />}
        </div>
        <p className='text_2' style={{ marginBottom: '8px' }}>{bookData.Name}</p>
        <div className={styles.metaInfo}>
            <p className='text_6_400'><strong>Loại chương trình:</strong> {bookData.Type}</p>
            <p className='text_6_400'><strong>Học phí:</strong> {formattedPrice}</p>
            <p className='text_6_400'><strong>Số chủ đề:</strong> {bookData.Topics.length} chủ đề</p>
            <p className='text_6_400'><strong>Số tiết quy định:</strong> {bookData.Topics.reduce((total, item) => total + (item.Period || 0), 0)} tiết</p>
            <p className='text_6_400'><strong>Mô tả:</strong> {bookData.Describe}</p>
        </div>
        <button onClick={onEditClick} className={`${styles.btn} ${styles.editBtn}`}>
            <Svg_Pen w={18} h={18} c='white' />
            <p className='text_6_400' style={{ color: 'white' }}>Chỉnh sửa thông tin</p>
        </button>
    </aside>
));
InfoPanel.displayName = 'InfoPanel';

const TopicItem = React.memo(({ topic, index, i, dragHandlers, actionHandlers }) => {
    const isDragging = dragHandlers.draggedIndex === index;
    const dragItemClass = `${styles.dragItem} ${isDragging ? styles.isDragging : ''}`;

    return (
        <React.Fragment>
            {dragHandlers.dragOverIndex === index && !isDragging && <div className={styles.dropPlaceholder} />}
            <div
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, index)}
                onDragEnter={(e) => dragHandlers.onDragEnter(e, index)}
                onDragEnd={dragHandlers.onDragEnd}
                className={dragItemClass}
            >
                <div className={styles.topicImageContainer}><p className='text_7'>Chủ đề: {i}</p></div>
                <li className={styles.topicItem}>
                    <div className={styles.topicInfo}>
                        <p className='text_4'>{topic.Name}</p>
                        <p className={styles.topicPeriod}>Thời lượng: {topic.Period || 'N/A'} tiết</p>
                    </div>
                    <div className={styles.topicActions}>
                        <div className={`wrapicon ${styles.btnYellow}`} onClick={() => actionHandlers.onEdit(topic)}><Svg_Pen w={18} h={18} c='white' /></div>
                        <a href={topic.Slide} target="_blank" rel="noopener noreferrer" className={`wrapicon ${styles.btnMain}`}><Svg_Slide w={18} h={18} c='white' /></a>
                        <div className={`wrapicon ${styles.btnRed}`} onClick={() => actionHandlers.onDelete(topic._id, topic.Name)}><Svg_Delete w={15} h={15} c='white' /></div>
                    </div>
                </li>
            </div>
        </React.Fragment>
    );
});
TopicItem.displayName = 'TopicItem';

const TopicsPanel = React.memo(({ topics, dragHandlers, actionHandlers, onAddTopic }) => {
    let i = 0;
    return (
        <main className={styles.topicsPanel} onDrop={dragHandlers.onDrop} onDragOver={(e) => e.preventDefault()}>
            <div className={styles.topicsHeader}>
                <p className='text_2'>Danh sách chủ đề</p>
                <button onClick={onAddTopic} className={`${styles.btn} ${styles.addBtn}`}>
                    <Svg_Add w={18} h={18} c='white' />
                    <p className='text_6_400' style={{ color: 'white' }}>Thêm chủ đề</p>
                </button>
            </div>
            <ul className={styles.topicList}>
                {topics.map((topic, index) => {
                    if (topic.Status === false) return null;
                    i++;
                    return <TopicItem key={topic._id} topic={topic} index={index} i={i} dragHandlers={dragHandlers} actionHandlers={actionHandlers} />;
                })}
            </ul>
        </main>
    );
});
TopicsPanel.displayName = 'TopicsPanel';

const ActionPopups = React.memo(({ popups, handlers, bookData, currentEditingTopic }) => (
    <>
        <FlexiblePopup open={popups.isEditPopupOpen} onClose={handlers.onCloseEditBook} title="Chỉnh sửa thông tin sách" width={500}
            renderItemList={() => <EditBookForm initialData={bookData} onSave={handlers.onSaveBook} onCancel={handlers.onCloseEditBook} isLoading={handlers.isLoading} />}
        />
        <FlexiblePopup open={popups.isAddTopicPopupOpen} onClose={handlers.onCloseAddTopic} title="Thêm chủ đề mới" width={500}
            renderItemList={() => <AddTopicForm onSave={handlers.onSaveTopic} onCancel={handlers.onCloseAddTopic} isLoading={handlers.isLoading} />}
        />
        {currentEditingTopic && (
            <FlexiblePopup open={popups.isEditTopicPopupOpen} onClose={handlers.onCloseEditTopic} title={`Chỉnh sửa: ${currentEditingTopic.Name}`} width={500}
                renderItemList={() => <EditTopicForm initialData={currentEditingTopic} onSave={handlers.onSaveEditedTopic} onCancel={handlers.onCloseEditTopic} isLoading={handlers.isLoading} />}
            />
        )}
    </>
));
ActionPopups.displayName = 'ActionPopups';

// --- Main Component ---
const BookDetail = ({ data: initialData }) => {
    const router = useRouter();
    const [bookData, setBookData] = useState({ ...initialData, Topics: initialData.Topics || [] });
    const [popups, setPopups] = useState({ isEditPopupOpen: false, isAddTopicPopupOpen: false, isEditTopicPopupOpen: false });
    const [currentEditingTopic, setCurrentEditingTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notiState, setNotiState] = useState({ open: false, status: true, mes: '' });
    const [alertConfig, setAlertConfig] = useState({ open: false, title: '', content: null, actions: null, type: 'info' });
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const API_ENDPOINT = useMemo(() => `/api/book/${bookData._id}`, [bookData._id]);
    const formattedPrice = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookData.Price), [bookData.Price]);

    useEffect(() => { setBookData({ ...initialData, Topics: initialData.Topics || [] }); }, [initialData]);

    const handleCloseNoti = useCallback(() => setNotiState(prev => ({ ...prev, open: false })), []);
    const handleCloseAlert = useCallback(() => setAlertConfig(prev => ({ ...prev, open: false })), []);

    const callApi = useCallback(async (method, body, endpoint = API_ENDPOINT) => {
        setIsLoading(true);
        const fetchOptions = { method };
        if (body) {
            if (body instanceof FormData) {
                fetchOptions.body = body;
            } else {
                fetchOptions.headers = { 'Content-Type': 'application/json' };
                fetchOptions.body = JSON.stringify(body);
            }
        }
        try {
            const response = await fetch(endpoint, fetchOptions);
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes || `Lỗi ${response.status}`);
            setNotiState({ open: true, status: true, mes: result.mes });
            router.refresh();
            return true;
        } catch (error) {
            setNotiState({ open: true, status: false, mes: error.message });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [API_ENDPOINT, router]);

    const handleDragStart = useCallback((e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; }, []);
    const handleDragEnter = useCallback((e, index) => { e.preventDefault(); if (index !== dragOverIndex) setDragOverIndex(index); }, [dragOverIndex]);
    const handleDragEnd = useCallback(() => { setDraggedIndex(null); setDragOverIndex(null); }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) return handleDragEnd();
        const originalTopics = [...bookData.Topics];
        const reorderedTopics = reorder(originalTopics, draggedIndex, dragOverIndex);
        setBookData(prev => ({ ...prev, Topics: reorderedTopics }));
        handleDragEnd();
        const success = await callApi('PUT', { orderedTopicIds: reorderedTopics.map(t => t._id) });
        if (!success) setBookData(prev => ({ ...prev, Topics: originalTopics }));
    }, [draggedIndex, dragOverIndex, bookData.Topics, handleDragEnd, callApi]);

    const handleSaveBook = useCallback(async (formData) => {
        const success = await callApi('PUT', formData, '/api/book');
        if (success) setPopups(prev => ({ ...prev, isEditPopupOpen: false }));
    }, [callApi, bookData._id]);

    const handleSaveTopic = useCallback(async (newTopicData) => {
        const success = await callApi('POST', { topics: [newTopicData] });
        if (success) setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false }));
    }, [callApi]);

    const handleOpenEditTopic = useCallback((topic) => {
        setCurrentEditingTopic(topic);
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: true }));
    }, []);

    const handleCloseEditTopic = useCallback(() => {
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: false }));
        setCurrentEditingTopic(null);
    }, []);

    const handleSaveEditedTopic = useCallback(async (updatedTopicData) => {
        if (!currentEditingTopic) return;
        const success = await callApi('PUT', { topicId: currentEditingTopic._id, updateData: updatedTopicData });
        if (success) handleCloseEditTopic();
    }, [callApi, currentEditingTopic, handleCloseEditTopic]);

    const executeDelete = useCallback(async (topicId) => {
        handleCloseAlert();
        await callApi('DELETE', { topicId });
    }, [callApi, handleCloseAlert]);

    const handleDeleteTopic = useCallback((topicId, topicName) => {
        setAlertConfig({
            open: true,
            type: 'warning',
            title: 'Xác nhận xóa chủ đề',
            content: <p>Bạn có chắc chắn muốn xóa chủ đề <strong>{topicName}</strong>? Hành động này không thể hoàn tác.</p>,
            actions: (
                <>
                    <button onClick={handleCloseAlert} className={`btn ${styles.btnGray}`}>Hủy</button>
                    <button onClick={() => executeDelete(topicId)} className={`btn ${styles.btnRed}`}>Xóa</button>
                </>
            )
        });
    }, [executeDelete, handleCloseAlert]);

    return (
        <>
            <div className={styles.container}>
                <InfoPanel
                    bookData={bookData}
                    formattedPrice={formattedPrice}
                    onEditClick={() => setPopups(prev => ({ ...prev, isEditPopupOpen: true }))}
                />
                <TopicsPanel
                    topics={bookData.Topics}
                    dragHandlers={{
                        draggedIndex, dragOverIndex,
                        onDragStart: handleDragStart, onDragEnter: handleDragEnter,
                        onDragEnd: handleDragEnd, onDrop: handleDrop
                    }}
                    actionHandlers={{ onEdit: handleOpenEditTopic, onDelete: handleDeleteTopic }}
                    onAddTopic={() => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: true }))}
                />
            </div>
            <ActionPopups
                popups={popups}
                handlers={{
                    onCloseEditBook: () => setPopups(prev => ({ ...prev, isEditPopupOpen: false })),
                    onSaveBook: handleSaveBook,
                    onCloseAddTopic: () => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false })),
                    onSaveTopic: handleSaveTopic,
                    onCloseEditTopic: handleCloseEditTopic,
                    onSaveEditedTopic: handleSaveEditedTopic,
                    isLoading: isLoading,
                }}
                bookData={bookData}
                currentEditingTopic={currentEditingTopic}
            />
            {isLoading && <div className='loadingOverlay'><Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            <Noti open={notiState.open} onClose={handleCloseNoti} status={notiState.status} mes={notiState.mes} />
            <AlertPopup {...alertConfig} onClose={handleCloseAlert} />
        </>
    );
};
export default BookDetail;