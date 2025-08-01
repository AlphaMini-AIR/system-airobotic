'use client';

import React, { useState, forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Svg_Add } from "@/components/(icon)/svg";
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import styles from './index.module.css';
import { area_data } from '@/data/actions/get';
import { useRouter } from 'next/navigation';

const AddStudentForm = forwardRef(({
    onClose,
    onShowNotification,
    onShowCloseConfirm,
    data_area,
    setIsLoading
}, ref) => {
    const [formData, setFormData] = useState({
        studentName: '', dob: '', school: '', parentName: '',
        area: '', areaId: '',
        phone: '', email: '', address: ''
    });
    const router = useRouter();
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setIsDirty(true);
    };

    const handleImageClick = () => fileInputRef.current.click();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setIsDirty(true);
        } else if (file) {
            onShowNotification('Định dạng ảnh không hợp lệ. Vui lòng chọn .jpg, .jpeg, hoặc .png', false);
        }
    };

    const validateForm = () => {
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
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            onShowNotification('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số và bắt đầu bằng số 0.', false);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
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
            const response = await fetch('/api/student', {
                method: 'POST',
                body: submissionData,
            });
            const result = await response.json();
            router.refresh();
            if (!response.ok) {
                throw new Error(result.mes || 'Có lỗi xảy ra trong quá trình tạo học sinh.');
            }
            onShowNotification(result.mes, true);
            onClose();
        } catch (error) {
            onShowNotification(error.message, false);
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const handleAttemptClose = () => {
        if (isDirty) {
            onShowCloseConfirm();
        } else {
            onClose();
        }
    };

    useImperativeHandle(ref, () => ({
        triggerAttemptClose: handleAttemptClose
    }));

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const areaMenuItems = (
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
    );

    return (
        <>
            <div className={styles.sectionPadding}>
                <TextNoti mes={<p>Các thông tin có đánh dấu <span className={styles.requiredMark}>*</span> là bắt buộc.</p>} title={'Lưu ý khi thêm học sinh'} color={'yellow'} />
            </div>
            <div className={styles.formRow}>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" className={styles.hiddenInput} />
                <div onClick={handleImageClick} className={styles.imageUploadBox} style={{ background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'transparent' }}>
                    {!avatarPreview && (
                        <>
                            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#9b9b9b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
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
                        <Menu
                            isOpen={isAreaMenuOpen}
                            onOpenChange={setIsAreaMenuOpen}
                            menuItems={areaMenuItems}
                            menuPosition="top"
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
                    <Svg_Add w={18} h={18} c={'white'} />
                    <p className={`text_6_400`} style={{ color: 'white' }}>Tạo học sinh</p>
                </div>
            </div>
        </>
    );
});
AddStudentForm.displayName = 'AddStudentForm';

export default function Create() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef(null);

    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = () => setIsPopupOpen(false);

    const handleShowNotification = (mes, status) => {
        setNotification({ open: true, mes, status });
    };

    const handleShowCloseConfirm = () => {
        setShowCloseConfirm(true);
    };

    const alertActions = (
        <div className={styles.alertActions}>
            <div className={`btn`} style={{ background: 'gray', borderRadius: 5 }} onClick={() => setShowCloseConfirm(false)}>
                <p className={`text_6_400`} style={{ color: 'white' }}>Ở lại</p>
            </div>
            <div className={`btn`} style={{ background: 'var(--red)', borderRadius: 5 }} onClick={() => {
                setShowCloseConfirm(false);
                handleClosePopup();
            }}>
                <p className={`text_6_400`} style={{ color: 'white' }}>Xác nhận</p>
            </div>
        </div>
    );

    const triggerFormCloseCheck = () => {
        if (formRef.current) {
            formRef.current.triggerAttemptClose();
        }
    };

    return (
        <>
            <div
                className={`btn ${styles.createButton}`}
                onClick={handleOpenPopup}
                style={{ margin: 0, background: 'var(--main_d)' }}
            >
                <Svg_Add w={18} h={18} c={'var(--bg-primary)'} />
                <p className={`text_6_400`} style={{ color: 'white' }}>Thêm học sinh mới</p>
            </div>

            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}

            <FlexiblePopup
                open={isPopupOpen}
                onClose={triggerFormCloseCheck}
                title="Thêm học sinh mới"
                width={700}
                fetchData={area_data}
                renderItemList={(fetchedAreaData) => (
                    <AddStudentForm
                        ref={formRef}
                        onClose={handleClosePopup}
                        onShowNotification={handleShowNotification}
                        onShowCloseConfirm={handleShowCloseConfirm}
                        data_area={fetchedAreaData}
                        setIsLoading={setIsLoading}
                    />
                )}
            />

            <Noti
                open={notification.open}
                status={notification.status}
                mes={notification.mes}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                button={
                    <div className={`btn`} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNotification(prev => ({ ...prev, open: false }))}>
                        <p className={`text_6_400`} style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />
            <AlertPopup
                open={showCloseConfirm}
                onClose={() => setShowCloseConfirm(false)}
                title="Cảnh báo"
                content={<p className='text_5'>Dữ liệu đã nhập sẽ không được lưu. Bạn có chắc chắn muốn thoát?</p>}
                type="warning"
                actions={alertActions}
            />
        </>
    );
}