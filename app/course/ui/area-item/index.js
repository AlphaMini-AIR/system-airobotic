import React, { useState, useEffect } from 'react';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { useRouter } from 'next/navigation';

const ProgramCard = ({ program, onCardClick }) => (
    <div className={styles.card} onClick={() => onCardClick(program)}>
        <div className={styles.content} style={{ borderLeft: `5px solid ${program.color || '#ccc'}` }}>
            <div className={styles.header}>
                <p className={styles.text_4}>Tên khu vực: {program.name}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p className={styles.text_6}>Số phòng học: <span style={{ fontWeight: 400 }}>{program.room.length}</span></p>
            </div>
        </div>
    </div>
);

const ProgramList = ({ programs }) => {
    const router = useRouter();
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#000000', room: [] });
    const [newRoom, setNewRoom] = useState('');
    const [colorError, setColorError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });

    const validateHexColor = (hex) => /^#[0-9a-fA-F]{6}$/.test(hex);

    useEffect(() => {
        if (selectedProgram) {
            setFormData({
                name: selectedProgram.name || '',
                color: selectedProgram.color || '#000000',
                room: Array.isArray(selectedProgram.room) ? selectedProgram.room : []
            });
            setColorError('');
        }
    }, [selectedProgram]);

    if (!programs || programs.length === 0) {
        return <div>Không có khu vực nào để hiển thị.</div>;
    }

    const handleCardClick = (program) => setSelectedProgram(program);
    const handleClosePopup = () => setSelectedProgram(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'color') {
            setColorError(validateHexColor(value) ? '' : 'Định dạng màu HEX không hợp lệ.');
        }
    };

    const handleAddRoom = () => {
        const trimmedRoom = newRoom.trim();
        if (trimmedRoom && !formData.room.includes(trimmedRoom)) {
            setFormData(prev => ({ ...prev, room: [...prev.room, trimmedRoom] }));
            setNewRoom('');
        }
    };

    const handleDeleteRoom = (roomToDelete) => {
        setFormData(prev => ({ ...prev, room: formData.room.filter(room => room !== roomToDelete) }));
    };

    const handleSaveChanges = async () => {
        if (!formData.name.trim() || colorError) {
            setNotification({ open: true, status: false, mes: 'Vui lòng kiểm tra lại dữ liệu đã nhập.' });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/area/${selectedProgram._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    color: formData.color,
                    room: formData.room,
                }),
            });
            const result = await response.json();

            if (result.status !== 2) {
                setNotification({ open: true, status: false, mes: result.mes });
            } else {
                router.refresh();
                setNotification({ open: true, status: true, mes: result.mes });
            }
            handleClosePopup();
        } catch (error) {
            setNotification({ open: true, status: false, mes: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderPopupContent = () => {
        if (!selectedProgram) return null;
        return (
            <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text_6'>Tên khu vực</p>
                    <input
                        type='text' name='name' className='input'
                        placeholder='Nhập tên khu vực...' value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text_6'>Màu hiển thị</p>
                    <div className={`${styles.colorInputWrapper} input`}>
                        <label
                            htmlFor="color-picker-input-create"
                            className={styles.colorSwatch}
                            style={{ backgroundColor: formData.color }}
                        />
                        <input
                            id="color-picker-input-create" type="color" name="color"
                            value={formData.color} onChange={handleInputChange}
                            className={styles.hiddenColorInput}
                        />
                        <input
                            type="text" name="color"
                            value={formData.color.toUpperCase()} onChange={handleInputChange}
                            className={styles.textInput} placeholder="#FFFFFF"
                        />
                    </div>
                    {colorError && <p style={{ color: 'var(--red)', fontSize: '12px', marginTop: 4 }}>{colorError}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text_6'>Phòng học</p>
                    <div className={styles.tagContainer}>
                        {formData.room.map((room) => (
                            <div key={room} className={styles.tag}>
                                <p className='text_6_400'>{room}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input type='text' style={{ flex: 1 }} className='input' placeholder='Thêm phòng mới...' value={newRoom} onChange={(e) => setNewRoom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()} />
                        <button className='btn' style={{ margin: 0 }} onClick={handleAddRoom}>Thêm</button>
                    </div>
                </div>

                <button className='btn' onClick={handleSaveChanges} disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1, width: '100%', marginTop: 24, justifyContent: 'center', padding: 10 }}>
                    <p className='text_6_400    ' style={{ color: 'white' }}>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</p>
                </button>
            </div>
        );
    };

    return (
        <>
            <div className={styles.container}>
                {programs.map(program => (
                    <ProgramCard key={program._id} program={program} onCardClick={handleCardClick} />
                ))}
            </div>

            <FlexiblePopup open={!!selectedProgram} onClose={handleClosePopup} title={selectedProgram ? `Chi tiết khu vực: ${selectedProgram.name}` : ''} renderItemList={renderPopupContent} />

            {isLoading && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', zIndex: 9999 }}>
                    <Loading content={<p style={{ color: 'white' }} className='text_6_400'>Đang cập nhật...</p>} />
                </div>
            )}

            <Noti open={notification.open} onClose={() => setNotification({ ...notification, open: false })} status={notification.status} mes={notification.mes}
                button={<button className='btn' onClick={() => setNotification({ ...notification, open: false })} style={{ width: '100%', justifyContent: 'center', borderRadius: 5 }}>Tắt thông báo</button>}
            />
        </>
    );
};

export default ProgramList;