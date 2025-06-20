'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'; // <-- Hãy chắc chắn đường dẫn này là chính xác
import styles from './index.module.css';
import Loading from '@/components/(ui)/(loading)/loading'; // <-- Hãy chắc chắn đường dẫn này là chính xác
import { Re_course_one, Re_lesson } from '@/data/course'; // <-- Hãy chắc chắn đường dẫn này là chính xác
import Noti from '@/components/(features)/(noti)/noti'; // <-- Hãy chắc chắn đường dẫn này là chính xác
import { Svg_Pen } from '@/components/(icon)/svg';
import Link from 'next/link';


// ================================================================
// COMPONENT Lightbox và MediaGallery (KHÔNG THAY ĐỔI)
// ... (Giữ nguyên code của Lightbox và MediaGallery như bạn đã cung cấp)
// ================================================================

function Lightbox({ mediaItem, onClose, onUpdateSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        status: false,
        mes: ''
    });
    const fileInputRef = useRef(null);

    if (!mediaItem) return null;

    let fileUrl = '';
    if (mediaItem.type === 'image') {
        fileUrl = `https://lh3.googleusercontent.com/d/${mediaItem.id}=w800`;
    } else if (mediaItem.type === 'video') {
        fileUrl = `https://drive.google.com/file/d/${mediaItem.id}/preview`;
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (!file) return;

        if (mediaItem.type === 'image' && !file.type.startsWith('image/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file HÌNH ẢNH để thay thế.'
            });
            return;
        }
        if (mediaItem.type === 'video' && !file.type.startsWith('video/')) {
            setNotification({
                open: true,
                status: false,
                mes: 'Loại file không hợp lệ. Vui lòng chọn một file VIDEO để thay thế.'
            });
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('id', mediaItem.id);
        formData.append('newImage', file);

        try {
            const response = await fetch('/api/updateimage', {
                method: 'PUT',
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mes || 'Có lỗi xảy ra khi cập nhật.');
            }

            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }

            onClose();

        } catch (err) {
            console.error('Lỗi cập nhật media:', err);
            setNotification({
                open: true,
                status: false,
                mes: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`/api/updateimage?id=${mediaItem.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.mes || 'Xóa file thất bại.');
            }

            if (onUpdateSuccess) {
                await onUpdateSuccess();
            }
            onClose();

        } catch (err) {
            console.error('Lỗi xóa media:', err);
            setNotification({
                open: true,
                status: false,
                mes: err.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const closeNotification = () => {
        setNotification({ open: false, status: false, mes: '' });
    };

    return (
        <>
            <Noti
                open={notification.open}
                onClose={closeNotification}
                status={notification.status}
                mes={notification.mes}
                button={
                    <button
                        onClick={closeNotification}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: 'var(--main_d, #007bff)',
                            color: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: '500',
                            marginTop: '8px'
                        }}
                    >
                        Đã hiểu
                    </button>
                }
            />
            <div className={styles.lightboxOverlay} onClick={onClose}>
                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <Loading size={50} content={<p style={{ color: 'white' }}>Đang xử lý...</p>} />
                    </div>
                )}
                <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={mediaItem.type === 'image' ? 'image/*' : 'video/*'}
                        style={{ display: 'none' }}
                    />
                    <button className={styles.lightboxClose} onClick={onClose}>×</button>
                    <div className={styles.lightboxClose1} onClick={triggerFileSelect}>
                        <Svg_Pen w={30} h={30} c={'var(--yellow)'} />
                    </div>
                    <button className={styles.lightboxClose2} onClick={handleDelete}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16" fill='white'>
                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                        </svg>
                    </button>
                    {mediaItem.type === 'image' ? (
                        <img src={fileUrl} alt="Ảnh phóng to" />
                    ) : (
                        <iframe
                            src={fileUrl}
                            width="640"
                            height="480"
                            allow="autoplay"
                            allowFullScreen
                            style={{ width: 'auto', height: '100%', aspectRatio: '16/9' }}
                        ></iframe>
                    )}
                </div>
            </div>
        </>
    );
}

function MediaGallery({ session, mediaItems = [], onAdd, onMediaClick }) {
    const getDriveImageUrl = (id) => `https://lh3.googleusercontent.com/d/${id}=w400`;

    return (
        <div className={styles.galleryContainer}>
            <div className={styles.galleryHeader}>
                <p className='text_5'>Thư viện hình ảnh & video</p>

                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`https://drive.google.com/drive/folders/${session.Image}`} className='btn' target="_blank" rel="noopener noreferrer">
                        <p className='text_6_400' style={{ color: 'white' }}> Đi tới Drive</p>
                    </Link>
                    <button className={'btn'} onClick={onAdd}>
                        <p className='text_6_400' style={{ color: 'white' }}> + Thêm file</p>
                    </button>
                </div>
            </div>

            {
                mediaItems.length === 0 ? (
                    <div className={styles.emptyGallery}>
                        <p>Chưa có hình ảnh hoặc video nào.</p>
                    </div>
                ) : (
                    <div className={styles.gallerywarp}>
                        <div className={styles.galleryGrid}>
                            {mediaItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onMediaClick(item)}
                                    className={styles.galleryItem}
                                >
                                    <img src={getDriveImageUrl(item.id)} alt={`File từ Google Drive`} loading="lazy" />
                                    {item.type === 'video' && (
                                        <div className={styles.playIconOverlay}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4V20L20 12L7 4Z"></path></svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}


//================================================================
// 2. COMPONENT TẢI FILE LÊN (POPUP 2) - ĐÃ CẬP NHẬT
//================================================================
const UploadManager = forwardRef(({
    session,
    onClose,
    onUploadFinish,
    onStartUpload,
    onProgressUpdate,
    onUploadComplete,
    isUploading // Nhận trạng thái isUploading từ cha
}, ref) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const uploadCancelled = useRef(false);

    useImperativeHandle(ref, () => ({
        requestClose: () => {
            if (isUploading && !uploadCancelled.current) {
                const confirmClose = window.confirm(
                    'Đang trong quá trình tải lên. Bạn có chắc chắn muốn hủy bỏ? Những file đã tải lên thành công sẽ được giữ lại.'
                );
                if (confirmClose) {
                    uploadCancelled.current = true;
                    onClose();
                }
            } else {
                onClose();
            }
        }
    }));

    useEffect(() => {
        const newPreviews = selectedFiles.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image'
        }));
        setPreviews(newPreviews);
        return () => newPreviews.forEach(p => URL.revokeObjectURL(p.url));
    }, [selectedFiles]);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        const acceptedFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
        setError(acceptedFiles.length !== files.length ? 'Một số tệp không được hỗ trợ và đã bị loại bỏ.' : '');
        setSelectedFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    };

    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = async () => {
        if (selectedFiles.length === 0) {
            setError('Vui lòng chọn ít nhất một file.');
            return;
        }

        // Đóng popup tải file và bắt đầu hiển thị progress ngoài màn hình chính
        onClose();
        onStartUpload(selectedFiles.length);
        uploadCancelled.current = false;

        let successCount = 0;
        let failedCount = 0;
        let fileIndex = 0;

        for (const file of selectedFiles) {
            if (uploadCancelled.current) {
                onProgressUpdate({ lastError: 'Quá trình tải lên đã bị hủy bởi người dùng.' });
                break;
            }

            fileIndex++;
            onProgressUpdate({ currentFile: `(${fileIndex}/${selectedFiles.length}) ${file.name}`, lastError: '' });

            try {
                const fileType = file.type.startsWith('video') ? 'video' : 'image';
                const formData = new FormData();
                formData.append('folderId', session.Image);
                formData.append('images', file);
                formData.append('fileType', fileType);

                const response = await fetch('/api/updateimage', { method: 'POST', body: formData });
                const result = await response.json();

                if (!response.ok || result.status !== 2) throw new Error(result.mes || 'Lỗi không xác định từ server');

                const uploadedId = result.data[0];
                if (uploadedId) {
                    successCount++;
                    onProgressUpdate({ success: successCount });
                } else {
                    throw new Error("API không trả về ID của file.");
                }

            } catch (err) {
                console.error(`Lỗi tải lên file ${file.name}:`, err);
                failedCount++;
                onProgressUpdate({ failed: failedCount, lastError: `Tệp "${file.name}": ${err.message}` });
            }
        }

        await onUploadFinish(); // Refresh dữ liệu
        onUploadComplete(); // Báo cho cha biết đã hoàn tất để ẩn progress bar
    };

    // Component này chỉ hiển thị giao diện chọn file, không hiển thị progress nữa
    return (
        <div className={styles.managerContainer}>
            <div className={styles.dropzone} onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <p className='text_6'>Nhấn để chọn hoặc kéo thả file</p>
                <p className='text_7_400'>Hỗ trợ hình ảnh và video</p>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            {previews.length > 0 && (
                <>
                    <p className='text_5'>Đã chọn: {previews.length} file</p>
                    <div className={styles.previewGrid}>
                        {previews.map((p, index) => (
                            <div key={index} className={styles.previewItem}>
                                {p.type === 'image' ? (
                                    <img src={p.url} alt={`Preview ${index}`} />
                                ) : (
                                    <video src={p.url} muted />
                                )}
                                <button className={styles.deleteButton} onClick={() => handleRemoveFile(index)}>×</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className={styles.actions}>
                <button className={'btn'} onClick={handleSave} style={{ background: 'var(--main_d)' }} disabled={selectedFiles.length === 0}>
                    Tải lên ({selectedFiles.length}) file
                </button>
            </div>
        </div>
    );
});


//================================================================
// 3. COMPONENT CHÍNH ĐIỀU KHIỂN - ĐÃ CẬP NHẬT
//================================================================
export default function ImageUploader({ session, courseId, Version }) {


    const router = useRouter();
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [isUploaderOpen, setUploaderOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState(session?.DetailImage || []);
    const [lightboxMedia, setLightboxMedia] = useState(null);

    // *** STATE MỚI ĐỂ QUẢN LÝ TIẾN TRÌNH UPLOAD Ở CẤP CAO NHẤT ***
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({
        total: 0, success: 0, failed: 0, currentFile: '', lastError: ''
    });

    const uploaderRef = useRef();

    useEffect(() => {
        setMediaItems(session?.DetailImage || []);
    }, [session?.DetailImage]);

    const handleUploadFinish = async () => {
        await Re_course_one(courseId);
        await Re_lesson(session._id);
        router.refresh();
    };

    // *** CÁC HÀM MỚI ĐỂ KIỂM SOÁT UI TIẾN TRÌNH ***
    const handleStartUpload = (totalFiles) => {
        setIsUploading(true);
        setUploadProgress({ total: totalFiles, success: 0, failed: 0, currentFile: '', lastError: '' });
    };

    const handleProgressUpdate = (update) => {
        setUploadProgress(prev => ({ ...prev, ...update }));
    };

    const handleUploadComplete = () => {
        // Giữ UI thêm vài giây để người dùng thấy kết quả, sau đó ẩn đi
        setTimeout(() => {
            setIsUploading(false);
        }, 3000);
    };

    const renderUploadManager = () => (
        <UploadManager
            ref={uploaderRef}
            session={session}
            onClose={() => setUploaderOpen(false)}
            onUploadFinish={handleUploadFinish}
            // Truyền các hàm điều khiển xuống
            onStartUpload={handleStartUpload}
            onProgressUpdate={handleProgressUpdate}
            onUploadComplete={handleUploadComplete}
            isUploading={isUploading}
        />
    );

    const renderMediaGallery = () => (
        <MediaGallery
            session={session}
            mediaItems={mediaItems}
            onAdd={() => setUploaderOpen(true)}
            onMediaClick={setLightboxMedia}
        />
    );

    // *** LOGIC CHO GIAO DIỆN TIẾN TRÌNH TẢI LÊN ***
    const isComplete = isUploading && (uploadProgress.success + uploadProgress.failed === uploadProgress.total);
    const progressPercentage = uploadProgress.total > 0 ? ((uploadProgress.success + uploadProgress.failed) / uploadProgress.total) * 100 : 0;

    const renderFloatingProgress = () => {
        if (!isUploading) return null;

        return (
            <div className={styles.progressContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p className='text_7_400'>{Math.round(progressPercentage)}%</p>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <div className={styles.dotx}></div>
                        <p className='text_7'>{uploadProgress.success}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <div className={styles.dotx} style={{ background: 'var(--red)' }}></div>
                        <p className='text_7'>{uploadProgress.failed}</p>
                    </div>
                    <p className='text_7_400'>Tổng: {uploadProgress.total}</p>
                </div>
                <div className={styles.progressBarOuter}>
                    <div className={styles.progressBarInner} style={{ width: `${progressPercentage}%` }}></div>
                </div>
                {uploadProgress.lastError && (
                    <p className={`${styles.errorText} ${styles.lastError}`}>{uploadProgress.lastError}</p>
                )}
            </div>
        );
    };


    if (!session?.Image) return null;

    return (
        <>
            <div className={styles.container} onClick={() => setPopupOpen(true)}>
                <img src={'https://assets.minimals.cc/public/assets/icons/files/ic-img.svg'} alt="icon" loading="lazy" className={styles.icon} />
                <div className={styles.name}>Hình ảnh & Video</div>
            </div>

            {/* Popup thư viện và popup chọn file */}
            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setPopupOpen(false)}
                title="Thư viện hình ảnh & video"
                renderItemList={renderMediaGallery}
                width={700}
                secondaryOpen={isUploaderOpen}
                onCloseSecondary={() => {
                    if (uploaderRef.current) {
                        uploaderRef.current.requestClose();
                    } else {
                        setUploaderOpen(false);
                    }
                }}
                secondaryTitle="Tải lên file mới"
                renderSecondaryList={renderUploadManager}
            />

            {/* Lightbox xem chi tiết file */}
            <Lightbox
                mediaItem={lightboxMedia}
                onClose={() => setLightboxMedia(null)}
                onUpdateSuccess={handleUploadFinish}
            />

            {/* GIAO DIỆN TIẾN TRÌNH TẢI LÊN NỔI BÊN NGOÀI */}
            {renderFloatingProgress()}
        </>
    );
}