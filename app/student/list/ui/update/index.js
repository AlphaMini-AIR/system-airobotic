'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { Svg_Pen } from "@/components/(icon)/svg";
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import styles from './index.module.css';
import { useRouter } from 'next/navigation';

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    let date;

    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            date = new Date(year, month - 1, day);
        }
    } else {
        date = new Date(dateString);
    }

    if (date && !isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return '';
};

const UpdateStudentForm = React.memo(forwardRef(({
    onClose,
    onShowNotification,
    onShowCloseConfirm,
    data_area,
    onRefreshData,
    reloadData,
    setIsLoading,
    data
}, ref) => {
    const route = useRouter();
    const [formData, setFormData] = useState({
        studentName: '', dob: '', school: '', parentName: '',
        area: '', areaId: '', phone: '', email: '', address: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (data) {
            setFormData({
                studentName: data.Name || '',
                dob: formatDateForInput(data.BD),
                school: data.School || '',
                parentName: data.ParentName || '',
                area: data.Area?.name || '',
                areaId: data.Area?._id || '',
                phone: data.Phone || '',
                email: data.Email || '',
                address: data.Address || ''
            });
            // SỬA LỖI TẠI ĐÂY: Sử dụng trực tiếp data.Avt
            setAvatarPreview(`https://lh3.googleusercontent.com/d/${data.Avt || null}`);
            setIsDirty(false);
        }
    }, [data]);

    useEffect(() => {
        const previewUrl = avatarPreview;
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [avatarPreview]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        const finalValue = name === 'phone' ? value.replace(/[^0-9]/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        setIsDirty(true);
    }, []);

    const handleImageClick = useCallback(() => fileInputRef.current.click(), []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setIsDirty(true);
        } else if (file) {
            onShowNotification('Định dạng ảnh không hợp lệ. Vui lòng chọn .jpg, .jpeg, hoặc .png', false);
        }
    }, [onShowNotification]);

    const validateForm = useCallback(() => {
        const requiredFields = {
            studentName: 'Tên học sinh',
            dob: 'Ngày sinh',
            parentName: 'Tên phụ huynh',
            areaId: 'Khu vực',
            phone: 'Số điện thoại'
        };
        for (const field in requiredFields) {
            if (!formData[field]) {
                onShowNotification(`Vui lòng điền đầy đủ thông tin: ${requiredFields[field]}.`, false);
                return false;
            }
        }
        if (!/^0\d{9}$/.test(formData.phone)) {
            onShowNotification('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số và bắt đầu bằng số 0.', false);
            return false;
        }
        return true;
    }, [formData, onShowNotification]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        setIsLoading(true);

        const submissionData = new FormData();
        submissionData.append('Name', formData.studentName);
        submissionData.append('BD', formData.dob);
        submissionData.append('School', formData.school);
        submissionData.append('ParentName', formData.parentName);
        submissionData.append('Phone', formData.phone);
        submissionData.append('Email', formData.email);
        submissionData.append('Address', formData.address);
        submissionData.append('Area', formData.areaId);
        if (avatarFile) {
            submissionData.append('Avt', avatarFile);
        }

        try {
            const response = await fetch(`/api/student/${data._id}`, {
                method: 'PUT',
                body: submissionData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.mes || 'Có lỗi xảy ra trong quá trình cập nhật.');
            }
            onShowNotification(result.mes || 'Cập nhật thành công!', true);
            if (onRefreshData) onRefreshData(result.data); // Truyền dữ liệu mới nhất về để cập nhật UI
            onClose();
        } catch (error) {
            onShowNotification(error.message, false);
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
            route.refresh(); // Làm mới trang để cập nhật dữ liệu
            if (reloadData) reloadData();
        }
    }, [validateForm, isSubmitting, setIsLoading, formData, avatarFile, data._id, onShowNotification, onRefreshData, onClose, reloadData]);

    const handleAttemptClose = useCallback(() => {
        if (isDirty) {
            onShowCloseConfirm();
        } else {
            onClose();
        }
    }, [isDirty, onClose, onShowCloseConfirm]);

    useImperativeHandle(ref, () => ({
        triggerAttemptClose: handleAttemptClose
    }), [handleAttemptClose]);

    const areaMenuItems = useMemo(() => (
        <div className={styles.list_menuwrap}>
            <div className={styles.list_menu} style={{ gap: 3, padding: 8 }}>
                {(data_area || []).map((area) => (
                    <p
                        key={area._id}
                        onClick={() => {
                            setFormData(prev => ({ ...prev, area: area.name, areaId: area._id }));
                            setIsDirty(true);
                            setIsAreaMenuOpen(false);
                        }}
                        className='text_6_400'
                    >
                        {area.name}
                    </p>
                ))}
            </div>
        </div>
    ), [data_area]);

    return (
        <>
            <div className={styles.sectionPadding}>
                <TextNoti mes={<p>Các thông tin có đánh dấu <span className={styles.requiredMark}>*</span> là bắt buộc.</p>} title={'Lưu ý khi cập nhật thông tin'} color={'yellow'} />
            </div>
            <div className={styles.formRow}>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" className={styles.hiddenInput} />
                <div onClick={handleImageClick} className={styles.imageUploadBox} style={{ background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'transparent' }}>
                    {!avatarPreview && (
                        <>
                            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#9b9b9b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path>
                            </svg>
                            <p className='text_4_m'>Hình ảnh đại diện</p>
                            <p className={`text_7_400 ${styles.textCenter}`}>Chỉ chấp nhận .jpg, .jpeg, .png</p>
                        </>
                    )}
                </div>
                <div className={styles.inputGroupColumn}>
                    <div className={styles.wrapinput}>
                        <p className='text_6'>Tên học sinh <span className={styles.requiredMark}>*</span></p>
                        <input name="studentName" value={formData.studentName} onChange={handleInputChange} type='text' placeholder='Họ và tên' className={`input ${styles.fullWidthInput}`} />
                    </div>
                    <div className={styles.wrapinput}>
                        <p className='text_6'>Ngày sinh <span className={styles.requiredMark}>*</span></p>
                        <input name="dob" value={formData.dob} onChange={handleInputChange} type='date' className={`input ${styles.fullWidthInput}`} />
                    </div>
                    <div className={styles.wrapinput}>
                        <p className='text_6'>Trường học</p>
                        <input name="school" value={formData.school} onChange={handleInputChange} type='text' placeholder='Trường học' className={`input ${styles.fullWidthInput}`} />
                    </div>
                </div>
            </div>
            <div className={styles.sectionPaddingHorizontal}>
                <TextNoti mes={<p>Thông tin liên hệ như SĐT (Có zalo) và Email sẽ được sử dụng để liên lạc với phụ huynh học sinh, vui lòng nhập chính xác những thông tin này.<br /></p>} title={'Thông tin liên hệ'} color={'yellow'} />
            </div>
            <div className={styles.formSection}>
                <div className={styles.formRowGap}>
                    <div className={`${styles.wrapinput} ${styles.flexInput}`}>
                        <p className='text_6'>Tên phụ huynh <span className={styles.requiredMark}>*</span></p>
                        <input name="parentName" value={formData.parentName} onChange={handleInputChange} type='text' placeholder='Họ và tên' className={`input ${styles.fullWidthInput}`} />
                    </div>
                    <div className={`${styles.wrapinput} ${styles.flexInput}`}>
                        <p className='text_6'>Số điện thoại <span className={styles.requiredMark}>*</span></p>
                        <input name="phone" value={formData.phone} onChange={handleInputChange} type='tel' placeholder='Số điện thoại' className={`input ${styles.fullWidthInput}`} maxLength="10" />
                    </div>
                </div>
                <div className={styles.formRowGap}>
                    <div className={`${styles.wrapinput} ${styles.flexInput}`}>
                        <p className='text_6'>Khu vực <span className={styles.requiredMark}>*</span></p>
                        <Menu isOpen={isAreaMenuOpen} onOpenChange={setIsAreaMenuOpen} menuItems={areaMenuItems} menuPosition="top"
                            customButton={
                                <div onClick={() => setIsAreaMenuOpen(o => !o)} className={`input ${styles.fullWidthInput} ${styles.selectBtn}`}>
                                    {formData.area || 'Chọn khu vực'}
                                </div>
                            }
                        />
                    </div>
                    <div className={`${styles.wrapinput} ${styles.flexInput}`}>
                        <p className='text_6'>Email</p>
                        <input name="email" value={formData.email} onChange={handleInputChange} type='email' placeholder='Email' className={`input ${styles.fullWidthInput}`} />
                    </div>
                </div>
                <div className={`${styles.wrapinput} ${styles.flexInput}`}>
                    <p className='text_6'>Địa chỉ</p>
                    <input name="address" value={formData.address} onChange={handleInputChange} type='text' placeholder='Địa chỉ' className={`input ${styles.fullWidthInput}`} />
                </div>
            </div>
            <div className={styles.actionsContainer}>
                <div className={`btn`} style={{ background: 'gray', borderRadius: 5 }} onClick={isSubmitting ? undefined : handleAttemptClose}>
                    <p className={`text_6_400 `} style={{ color: 'white' }}>Hủy bỏ</p>
                </div>
                <div className={`btn ${styles.submitButton}`} onClick={isSubmitting ? undefined : handleSubmit}>
                    <Svg_Pen w={16} h={16} c={'white'} />
                    <p className={`text_6_400`} style={{ color: 'white' }}>Cập nhật</p>
                </div>
            </div>
        </>
    );
}));
UpdateStudentForm.displayName = 'UpdateStudentForm';

export default function Update({ data_area, onStudentUpdated, reloadData, data }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef(null);

    const handleOpenPopup = useCallback(() => setIsPopupOpen(true), []);
    const handleClosePopup = useCallback(() => setIsPopupOpen(false), []);
    const handleCloseConfirm = useCallback(() => setShowCloseConfirm(false), []);

    const handleShowNotification = useCallback((mes, status) => {
        setNotification({ open: true, mes, status });
    }, []);

    const handleShowCloseConfirm = useCallback(() => {
        setShowCloseConfirm(true);
    }, []);

    const triggerFormCloseCheck = useCallback(() => {
        formRef.current?.triggerAttemptClose();
    }, []);

    const handleConfirmAndClose = useCallback(() => {
        setShowCloseConfirm(false);
        handleClosePopup();
    }, [handleClosePopup]);

    const handleCloseNoti = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);

    const alertActions = useMemo(() => (
        <div className={styles.alertActions}>
            <div className={`btn`} style={{ background: 'gray', borderRadius: 5 }} onClick={handleCloseConfirm}>
                <p className={`text_6_400`} style={{ color: 'white' }}>Ở lại</p>
            </div>
            <div className={`btn`} style={{ background: 'var(--red)', borderRadius: 5 }} onClick={handleConfirmAndClose}>
                <p className={`text_6_400`} style={{ color: 'white' }}>Xác nhận</p>
            </div>
        </div>
    ), [handleCloseConfirm, handleConfirmAndClose]);

    return (
        <>
            <div onClick={handleOpenPopup} className="wrapicon" style={{ background: 'var(--yellow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Svg_Pen w={16} h={16} c={'white'} />
            </div>

            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}

            <FlexiblePopup
                open={isPopupOpen}
                onClose={triggerFormCloseCheck}
                title="Cập nhật thông tin học sinh"
                renderItemList={() => (
                    <UpdateStudentForm
                        ref={formRef}
                        onClose={handleClosePopup}
                        onShowNotification={handleShowNotification}
                        onShowCloseConfirm={handleShowCloseConfirm}
                        data_area={data_area}
                        onRefreshData={onStudentUpdated}
                        reloadData={reloadData}
                        setIsLoading={setIsLoading}
                        data={data}
                    />
                )}
                width={700}
            />

            <Noti open={notification.open} status={notification.status} mes={notification.mes} onClose={handleCloseNoti}
                button={
                    <div className={`btn`} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={handleCloseNoti}>
                        <p className={`text_6_400`} style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />

            <AlertPopup open={showCloseConfirm} onClose={handleCloseConfirm} title="Cảnh báo"
                content={<p className='text_5'>Dữ liệu đã thay đổi sẽ không được lưu. Bạn có chắc chắn muốn thoát?</p>}
                type="warning" actions={alertActions}
            />
        </>
    );
}