import React, { useState } from 'react';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Add } from '@/components/(icon)/svg';
import Noti from '@/components/(features)/(noti)/noti';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';

const CreateArea = () => {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });
    const initialFormData = { name: '', color: '#00D097', rooms: [] };
    const [formData, setFormData] = useState(initialFormData);
    const [newRoom, setNewRoom] = useState('');
    const [colorError, setColorError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateHexColor = (hex) => { return /^#[0-9a-fA-F]{6}$/.test(hex) };

    const handleOpenPopup = () => { setFormData(initialFormData); setColorError(''); setIsPopupOpen(true); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'color') {
            if (!validateHexColor(value)) {
                setColorError('Định dạng màu không hợp lệ (ví dụ: #1A2B3C).');
            } else {
                setColorError('');
            }
        }
    };

    const handleAddRoom = () => {
        const trimmedRoom = newRoom.trim();
        if (trimmedRoom && !formData.rooms.includes(trimmedRoom)) {
            setFormData(prev => ({ ...prev, rooms: [...prev.rooms, trimmedRoom] }));
            setNewRoom('');
        }
    };

    const handleRemoveRoom = (roomToRemove) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter(room => room !== roomToRemove)
        }));
    };

    const handleCreateArea = async () => {
        if (!formData.name.trim()) {
            setNotification({ open: true, status: false, mes: 'Tên khu vực không được để trống.' });
            return;
        }
        if (colorError) {
            setNotification({ open: true, status: false, mes: 'Vui lòng sửa định dạng màu sắc.' });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/area`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.status) {
                router.refresh();
                setNotification({ open: true, status: true, mes: result.mes });
            } else {
                setNotification({ open: true, status: false, mes: result.mes });
            }
            setIsPopupOpen(false)
        } catch (error) {
            setNotification({ open: true, status: false, mes: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderPopupContent = () => {
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
                        {formData.rooms.map((room, index) => (
                            <div key={index} className={styles.tag}>
                                <p className='text_6_400'>{room}</p>
                                <span className={styles.removeTag} onClick={() => handleRemoveRoom(room)}>×</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                            type='text' className='input' placeholder='Thêm phòng mới...'
                            value={newRoom} onChange={(e) => setNewRoom(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()} style={{ flex: 1 }}
                        />
                        <button className='btn' onClick={handleAddRoom} style={{ flexShrink: 0, margin: 0, borderRadius: 5, transform: 'none' }}>Thêm</button>
                    </div>
                </div>

                <button
                    className='btn'
                    onClick={handleCreateArea}
                    disabled={isLoading}
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 5, padding: 10, marginTop: 32, opacity: isLoading ? 0.6 : 1 }}
                >
                    {isLoading ? 'Đang tạo...' : 'Tạo khu vực'}
                </button>
            </div>
        );
    };

    return (
        <>
            <div className={styles.button} onClick={handleOpenPopup}>
                <Svg_Add w={16} h={16} c="white" />
                <p className='text_6_400' style={{ color: 'white' }}>Thêm khu vực</p>
            </div>

            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title={'Thêm khu vực'}
                renderItemList={renderPopupContent}
            />
            {isLoading && <div className='loadingOverlay'>
                <Loading content={<p style={{ color: 'white', }} className='text_6_400'>Đang tạo khu vực mới...</p>} />
            </div>}
            <Noti
                open={notification.open}
                onClose={() => setNotification({ ...notification, open: false })}
                status={notification.status}
                mes={notification.mes}
                button={
                    <button
                        className='btn'
                        onClick={() => setNotification({ ...notification, open: false })}
                        style={{ width: '100%', justifyContent: 'center', borderRadius: 5, transform: 'none' }}
                    >
                        Đóng
                    </button>
                }
            />
        </>
    );
};

export default CreateArea;