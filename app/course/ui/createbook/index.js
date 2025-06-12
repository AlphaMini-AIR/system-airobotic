'use client';

import React, { useState, useCallback } from 'react';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(popup)/popup_right';
import TextNoti from '@/components/(noti)/textnoti';
import Loading from '@/components/(loading)/loading';
import Noti from '@/components/(noti)/noti';
import { Re_book } from '@/data/book';
import TopicForm from '@/app/course/book/[id]/ui/AddTopicForm';
import { useRouter } from 'next/navigation';
import { Svg_Add, Svg_Slide, Svg_Pen, Svg_Delete } from '@/components/svg';
import Link from 'next/link';

export default function Create() {
    const router = useRouter();
    const [openPopup, setOpenPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // State cho form chương trình chính
    const [programData, setProgramData] = useState({
        ID: '',
        Name: '',
        Price: '',
        Image: '',
    });

    // State quản lý danh sách chủ đề
    const [topics, setTopics] = useState([]);

    // State cho popup phụ (thêm/sửa chủ đề)
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState('add'); // 'add' | 'edit'
    const [editingIndex, setEditingIndex] = useState(null);

    // State cho thông báo
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMessage, setNotiMessage] = useState('');

    /* ----------------------------------------------------------------
     * HANDLERS & LOGIC
     * ---------------------------------------------------------------- */
    const openPopupHandler = useCallback(() => setOpenPopup(true), []);
    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setProgramData({ ID: '', Name: '', Price: '', Image: '' });
        setTopics([]);
        setErrorMsg('');
        setNotiOpen(false);
    }, []);

    const closeSecondary = () => {
        setSecondaryOpen(false);
        setEditingIndex(null);
    };

    const handleProgramDataChange = (e) => {
        const { name, value } = e.target;
        setProgramData(prev => ({ ...prev, [name]: value }));
    };

    const addTopic = (topic) => setTopics((prev) => [...prev, topic]);
    const updateTopic = (index, updatedTopic) => {
        setTopics((prev) => prev.map((topic, i) => (i === index ? updatedTopic : topic)));
    };
    const deleteTopic = (index) => {
        setTopics((prev) => prev.filter((_, i) => i !== index));
    };

    const openAddTopicForm = () => {
        setSecondaryType('add');
        setSecondaryOpen(true);
    };

    const openEditTopicForm = (index) => {
        setEditingIndex(index);
        setSecondaryType('edit');
        setSecondaryOpen(true);
    };

    const TopicList = () => {
        if (topics.length === 0) {
            return <p className={styles.scheduleHint}>Chưa có chủ đề nào được thêm</p>;
        }
        return (
            <div className={styles.scheduleList}>
                {topics.map((topic, i) => (
                    <div key={i} className={styles.scheduleItem}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.scheduleIndex}>{i + 1}. {topic.Name}</span>
                            <span className={styles.scheduleText}>
                                {topic.Period ? `${topic.Period} tiết` : 'Chưa có thời lượng'}
                                {' – '}
                                {topic.Slide ? <a href={topic.Slide} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Link slide</a> : 'Chưa có slide'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Link target='_blank' href={`${topic.Slide}`} className='wrapicon' style={{ background: 'var(--main_b)', cursor: 'pointer' }}>
                                <Svg_Slide w={16} h={16} c="white" /> </Link>
                            <div className='wrapicon' style={{ background: 'var(--yellow)', cursor: 'pointer' }} onClick={() => openEditTopicForm(i)}>
                                <Svg_Pen w={16} h={16} c="white" />
                            </div> 
                            <div className='wrapicon' style={{ background: 'var(--red)', cursor: 'pointer' }} onClick={() => deleteTopic(i)}>
                                <Svg_Delete w={16} h={16} c="white" /> </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    /* ----------------------------------------------------------------
     * HANDLE SUBMIT CHƯƠNG TRÌNH
     * ---------------------------------------------------------------- */
    const handleSaveProgram = (e) => {
        e.preventDefault();

        if (!programData.ID || !programData.Name || programData.ID.length != 3) {
            setErrorMsg('Vui lòng nhập ID và Tên chương trình. ID phải có 3 ký tự.');
            return;
        }
        setErrorMsg('');

        const payload = { ...programData, Price: Number(programData.Price) || 0, Topics: topics };
        payload.Type = 'AI Robotic'
        setIsLoading(true);
        fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(async (r) => {
                if (!r.ok) {
                    const errorData = await r.json().catch(() => ({ mes: 'Lỗi không xác định' }));
                    throw errorData;
                }
                return r.json();
            })
            .then(() => {
                setNotiStatus(true);
                setNotiMessage('Đã tạo chương trình thành công!');
                setNotiOpen(true);
                Re_book()
                router.refresh();
            })
            .catch((err) => {
                setNotiStatus(false);
                setNotiMessage(err.mes || 'Lỗi từ server, không thể tạo chương trình.');
                setNotiOpen(true);
            })
            .finally(() => setIsLoading(false));
    };

    /* ----------------------------------------------------------------
     * RENDER FORM CHÍNH
     * ---------------------------------------------------------------- */
    const renderProgramForm = () => (
        <form className={styles.form} onSubmit={handleSaveProgram}>
            <TextNoti title="Thông tin chương trình học" color="blue" mes="Điền thông tin và thêm các chủ đề cấu thành nên chương trình. ID quy định phải có 3 kí tự" />
            <input name="ID" value={programData.ID} onChange={handleProgramDataChange} type='text' className='input' placeholder='ID chương trình (ví dụ: FZ1)' required />
            <input name="Name" value={programData.Name} onChange={handleProgramDataChange} type='text' className='input' placeholder='Tên chương trình (ví dụ: Lập trình Scratch cấp độ 1)' required />
            <input name="Price" value={programData.Price} onChange={handleProgramDataChange} type='number' className='input' placeholder='Học phí' />
            <input name="Image" value={programData.Image} onChange={handleProgramDataChange} type='text' className='input' placeholder='Link ảnh bìa' />

            {errorMsg && <p className={styles.error} style={{ marginTop: 8 }}>{errorMsg}</p>}

            <TextNoti title="Danh sách chủ đề" color="blue" mes="Thêm các chủ đề sẽ có trong chương trình này." />
            <div className={styles.scheduleAction}>
                <button type="button" style={{ display: 'flex', gap: 8, alignItems: 'center' }} className={styles.addBtn} onClick={openAddTopicForm}>
                    <Svg_Add w={16} h={16} c="white" />
                    <span className='text_6_400' style={{ color: 'white' }}>Thêm chủ đề</span>
                </button>
            </div>
            <TopicList />
            <button type="submit" className={styles.submit} disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu chương trình'}
            </button>
        </form>
    );

    return (
        <>
            <div className={styles.button} onClick={openPopupHandler}>
                <Svg_Add w={16} h={16} c="white" />
                <p className='text_6_400' style={{ color: 'white' }}>Thêm chương trình</p>
            </div>

            <FlexiblePopup
                open={openPopup}
                onClose={closePopupHandler}
                title="Tạo chương trình học mới"
                width={600}
                renderItemList={renderProgramForm}
                secondaryOpen={secondaryOpen}
                onCloseSecondary={closeSecondary}
                renderSecondaryList={() => {
                    // Sử dụng component TopicForm đã import
                    if (secondaryType === 'edit') {
                        return (
                            <TopicForm
                                initialData={topics[editingIndex]}
                                onSave={(updatedTopic) => {
                                    updateTopic(editingIndex, updatedTopic);
                                    closeSecondary();
                                }}
                                onCancel={closeSecondary}
                                isLoading={isLoading}
                            />
                        );
                    }
                    return (
                        <TopicForm
                            onSave={(newTopic) => {
                                addTopic(newTopic);
                                closeSecondary();
                            }}
                            onCancel={closeSecondary}
                            isLoading={isLoading}
                        />
                    );
                }}
                secondaryTitle={secondaryType === 'edit' ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
            />

            {isLoading && <div className={styles.loadingOverlay}><Loading content="Đang xử lý..." /></div>}

            <Noti
                open={notiOpen}
                onClose={() => setNotiOpen(false)}
                status={notiStatus}
                mes={notiMessage}
                button={
                    <div className={styles.bnt} onClick={() => {
                        setNotiOpen(false);
                        if (notiStatus) closePopupHandler();
                    }}>
                        Đóng
                    </div>
                }
            />
        </>
    );
}