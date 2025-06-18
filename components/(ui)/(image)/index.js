'use client';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import styles from './index.module.css';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { Svg_Delete, Svg_Pen, Svg_Download } from '@/components/(icon)/svg';

import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { Re_lesson } from '@/data/course';

// FileUploadModal không còn được sử dụng trong component này nữa,
// nhưng tôi giữ nguyên định nghĩa của nó nếu nó được sử dụng ở các nơi khác
const FileUploadModal = ({ isOpen, onClose, onFileSelect, imageId }) => {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file, imageId);
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>Chọn ảnh mới để thay thế</h3>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className={styles.fileInput}
                />
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.modalCancelButton}>
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageComponent = ({ width, imageInfo, refreshData }) => {
    // Sửa URL Googleusercontent: "0" -> "1" để nó hoạt động đúng.
    // Nếu bạn muốn dùng ảnh thật từ Googleusercontent.com thì URL thường có định dạng khác,
    // ví dụ: https://lh3.googleusercontent.com/d/YOUR_FILE_ID=s220
    // Hoặc nếu bạn đang tự host ảnh từ Google Drive thì có thể dùng API của Drive.
    // Hiện tại tôi giữ theo cấu trúc bạn đang dùng và giả định "1" là tiền tố hợp lệ.
    const src = `https://lh3.googleusercontent.com/d/${imageInfo.id}`;

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingContent, setLoadingContent] = useState('');
    const [noti, setNoti] = useState({ open: false, status: false, mes: '', button: null });
    const [alertPopup, setAlertPopup] = useState({ open: false, title: '', content: '', type: 'warning', actions: null });

    // Tạo một ref cho input file ẩn
    const hiddenFileInput = useRef(null);

    const handleImageClick = useCallback(() => {
        setIsPopupOpen(true);
    }, []);

    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
    }, []);

    const showLoading = (content) => {
        setLoadingContent(content);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
        setLoadingContent('');
    };

    const showNoti = (status, mes) => {
        setNoti({
            open: true,
            status: status,
            mes: mes,
            button: <div className='btn' style={{ background: 'var(--main_d)', width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti({ ...noti, open: false })}>Tắt thông báo</div>,
        });
    };

    const closeNoti = () => {
        setNoti({ ...noti, open: false });
    };

    const showAlertPopup = (title, content, onConfirm) => {
        setAlertPopup({
            open: true,
            title: title,
            content: content,
            type: 'warning',
            actions: (
                <>
                    <div onClick={() => setAlertPopup({ ...alertPopup, open: false })}
                        style={{ background: 'gray', color: 'white' }} className='btn' > Hủy </div>
                    <div className='btn' style={{ background: 'var(--red)', color: 'white' }}
                        onClick={() => { onConfirm(); setAlertPopup({ ...alertPopup, open: false }); }}  >  Xác nhận </div>
                </>
            ),
        });
    };

    const closeAlertPopup = () => {
        setAlertPopup({ ...alertPopup, open: false });
    };
    const handleReplaceImage = useCallback(async (newImageFile, idToUpdate) => {
        showLoading('Đang cập nhật hình ảnh...');
        try {
            const formData = new FormData();
            formData.append('id', idToUpdate);
            formData.append('newImage', newImageFile);

            const response = await fetch('/api/image', {
                method: 'PUT',
                body: formData,
            });

            const result = await response.json();
            result.data.forEach(element => {
                Re_lesson(element)
            });
            if (response.ok && result.status === 2) {
                showNoti(true, result.mes);
            } else {
                showNoti(false, result.mes);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API PUT:', error);
            showNoti(false, 'Đã xảy ra lỗi khi cập nhật ảnh. Vui lòng thử lại.');
        } finally {
            await refreshData();
            hideLoading();
        }
    }, [refreshData]);
    // Hàm mới để xử lý việc chọn tệp từ input ẩn
    const handleFileChangeForUpdate = useCallback(async (event) => {
        const file = event.target.files[0];
        if (file) {
            await handleReplaceImage(file, imageInfo.id);
            // Quan trọng: Đặt lại giá trị của input để cho phép chọn lại cùng một tệp
            event.target.value = '';
        }
        handleClosePopup(); // Đóng popup sau khi chọn tệp và bắt đầu cập nhật
    }, [handleReplaceImage, imageInfo.id, handleClosePopup]);

    // Thay đổi duy nhất ở đây: Kích hoạt click vào input file ẩn
    const handleEdit = useCallback(() => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    }, []);



    const handleDelete = useCallback(() => {
        showAlertPopup(
            'Xác nhận xóa',
            <>
                <TextNoti mes='Việc xóa hình ảnh lớp học cũng sẽ đồng thời xóa hình ảnh này khỏi phần hình ảnh riêng cho các học sinh.' title='Xóa hình ảnh lớp học' color={'yellow'} />
                <p className='text_6_400' style={{ marginTop: 8 }}> Bạn có chắc chắn muốn xóa hình ảnh này không? Hành động này không thể hoàn tác.</p>
            </>,
            async () => {
                showLoading('Đang xóa hình ảnh...');
                try {
                    const response = await fetch(`/api/image?id=${imageInfo.id}`, {
                        method: 'DELETE',
                    });

                    const result = await response.json();
                    result.data.forEach(element => {
                        Re_lesson(element)
                    });
                    if (response.ok && result.status === 2) {
                        showNoti(true, result.mes);
                    } else {
                        showNoti(false, result.mes);
                    }
                } catch (error) {
                    console.error('Lỗi khi gọi API DELETE:', error);
                    showNoti(false, 'Đã xảy ra lỗi khi xóa ảnh. Vui lòng thử lại.');
                } finally {
                    await refreshData();
                    hideLoading();
                    handleClosePopup();
                }
            }
        );
    }, [imageInfo.id, handleClosePopup, refreshData]);

    const handleDownload = useCallback(() => {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${imageInfo.id}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `file_${imageInfo.id}.${imageInfo.type === 'image' ? 'png' : imageInfo.type === 'video' ? 'mp4' : 'bin'}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [imageInfo.id, imageInfo.type]);

    const containerStyle = useMemo(() => {
        const parsedWidth = typeof width === 'number' ? `${width}px` : width;
        return {
            width: parsedWidth,
            aspectRatio: '1 / 1',
        };
    }, [width]);

    return (
        <>
            <div className={styles.imageContainer} style={containerStyle} onClick={handleImageClick}>
                {imageInfo.type === 'image' ? (
                    <img src={src} alt={`Image ${imageInfo.id}`} className={styles.image} />
                ) : imageInfo.type === 'video' ? (
                    <video src={src} controls className={styles.image} />
                ) : (
                    <div className={styles.filePlaceholder}>
                        File: {imageInfo.type} (ID: {imageInfo.id})
                    </div>
                )}
            </div>

            {isPopupOpen && (
                <div className={styles.popupOverlay} onClick={handleClosePopup}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        {imageInfo.type === 'image' ? (
                            <img src={src} alt={`Detail ${imageInfo.id}`} className={styles.popupImage} />
                        ) : imageInfo.type === 'video' ? (
                            <video src={src} controls className={styles.popupImage} />
                        ) : (
                            <div className={styles.popupFileContent}>
                                <h3>File: {imageInfo.type}</h3>
                                <p>ID: {imageInfo.id}</p>
                                <a href={src} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>Mở File</a>
                            </div>
                        )}

                        <div className={styles.popupActions}>
                            <WrapIcon
                                icon={<Svg_Pen w={17} h={17} c="white" />}
                                content={'Cập nhật'}
                                placement={'right'}
                                style={{ background: 'var(--yellow)', color: 'white', cursor: 'pointer' }}
                                click={handleEdit} // Gọi hàm handleEdit mới
                            />

                            <WrapIcon
                                icon={<Svg_Delete w={16} h={16} c="white" />}
                                content={'Xóa'}
                                placement={'right'}
                                style={{ background: 'var(--red)', color: 'white', cursor: 'pointer' }}
                                click={handleDelete}
                            />

                            {imageInfo.type === 'image' || imageInfo.type === 'video' ? (
                                <WrapIcon
                                    icon={<Svg_Download w={16} h={16} c="white" />}
                                    content={'Tải xuống'}
                                    placement={'right'}
                                    style={{ background: 'var(--green)', color: 'white', cursor: 'pointer' }}
                                    click={handleDownload}
                                />
                            ) : null}
                        </div>
                        <button className={styles.closeButton} onClick={handleClosePopup}>×</button>
                    </div>
                </div>
            )}

            {/* Input file ẩn, chỉ dùng để kích hoạt chọn tệp */}
            <input
                type="file"
                ref={hiddenFileInput}
                onChange={handleFileChangeForUpdate}
                accept="image/*" // Chỉ chấp nhận hình ảnh
                style={{ display: 'none' }} // Ẩn khỏi giao diện người dùng
            />

            {isLoading && (
                <div className={styles.fullscreenOverlay}>
                    <Loading content={loadingContent} />
                </div>
            )}

            <Noti
                open={noti.open}
                onClose={closeNoti}
                status={noti.status}
                mes={noti.mes}
                button={noti.button}
            />

            <AlertPopup
                open={alertPopup.open}
                onClose={closeAlertPopup}
                title={alertPopup.title}
                content={alertPopup.content}
                type={alertPopup.type}
                actions={alertPopup.actions}
            />
        </>
    );
};

export default ImageComponent;