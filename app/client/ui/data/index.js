'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createAreaAction, updateAreaAction, deleteAreaAction, syncCustomersFromSheetAction } from '@/app/actions/data.actions';
import AlertPopup from '@/components/(features)/(noti)/alert';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Add, Svg_Data, Svg_Area, Svg_Delete, Svg_Coppy, Svg_Download } from '@/components/(icon)/svg';
import styles from './index.module.css';
import Title from '@/components/(features)/(popup)/title';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { formatDate } from '@/function';
import { revalidateData } from '@/app/actions/customer.actions';

function SubmitButton({ text = 'Thực hiện' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className='btn' style={{ transform: 'none', margin: 0 }}>
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}

// AreaForm được đơn giản hóa, không cần chứa LoadingOverlay nữa
function AreaForm({ formAction, formState, initialData = null, submitText }) {
    const [name, setName] = useState(initialData?.name || '');
    const [describe, setDescribe] = useState(initialData?.describe || '');

    useEffect(() => {
        if (formState.status === true && !initialData) {
            setName('');
            setDescribe('');
        }
    }, [formState, initialData]);

    useEffect(() => {
        setName(initialData?.name || '');
        setDescribe(initialData?.describe || '');
    }, [initialData]);

    return (
        <form action={formAction} className={styles.createForm}>
            {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}
            <div className={styles.inputGroup}>
                <label htmlFor="name">Tên nguồn</label>
                <input
                    className='input'
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Ví dụ: Dữ liệu Marketing"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="describe">Mô tả nguồn nhận dữ liệu</label>
                <textarea
                    style={{ resize: 'none', height: 100 }}
                    className='input'
                    id="describe"
                    name="describe"
                    rows={3}
                    placeholder="Mô tả ngắn về nguồn dữ liệu này"
                    value={describe}
                    onChange={(e) => setDescribe(e.target.value)}
                />
            </div>
            <SubmitButton text={submitText} />
        </form>
    );
}

export default function SettingData({ data }) {
    const router = useRouter();
    const [isRightPopupOpen, setIsRightPopupOpen] = useState(false);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [copyStatus, setCopyStatus] = useState('idle');
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });

    // Thay đổi 1: Lấy trạng thái pending từ mỗi action
    const [createState, createAction, isCreatePending] = useActionState(createAreaAction, { message: null, status: null });
    const [updateState, updateAction, isUpdatePending] = useActionState(updateAreaAction, { message: null, status: null });
    const [deleteState, deleteAction, isDeletePending] = useActionState(deleteAreaAction, { message: null, status: null });
    const [syncState, syncAction, isSyncPending] = useActionState(syncCustomersFromSheetAction, { message: null, status: null });

    const handleActionComplete = (state, closePopupCallback) => {
        if (state.message) {
            setNotification({ open: true, status: state.status, mes: state.message });
            if (state.status === true) {
                revalidateData();
                router.refresh();
                if (closePopupCallback) closePopupCallback();
            }
        }
    };

    useEffect(() => handleActionComplete(createState, () => setIsCreatePopupOpen(false)), [createState]);
    useEffect(() => {
        handleActionComplete(updateState, () => {
            if (updateState.status) {
                setIsUpdatePopupOpen(false);
                setEditingItem(null);
            }
        });
    }, [updateState]);
    useEffect(() => {
        handleActionComplete(deleteState, () => {
            setIsDeleteConfirmOpen(false);
            if (deleteState.status) {
                setIsUpdatePopupOpen(false);
                setItemToDelete(null);
            }
        });
    }, [deleteState]);
    useEffect(() => handleActionComplete(syncState, null), [syncState]);

    const handleOpenUpdatePopup = (item) => {
        setEditingItem(item);
        setIsUpdatePopupOpen(true);
    };

    const handleOpenDeleteConfirm = (item) => {
        setItemToDelete(item);
        setIsDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => setIsDeleteConfirmOpen(false);
    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));

    const handleCopyToClipboard = async (textToCopy) => {
        if (!navigator.clipboard) {
            setCopyStatus('error');
            setTimeout(() => setCopyStatus('idle'), 2000);
            return;
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopyStatus('copied');
        } catch (err) {
            setCopyStatus('error');
        } finally {
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    };

    return (
        <>
            <button className='btn_s' onClick={() => setIsRightPopupOpen(true)}>
                <Svg_Data w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                <h5 className='text_w_400'>Dữ liệu</h5>
            </button>

            <FlexiblePopup
                open={isRightPopupOpen}
                onClose={() => setIsRightPopupOpen(false)}
                title="Cài đặt nguồn dữ liệu"
                width={'600px'}
                renderItemList={() => (
                    <div className={styles.popupContentWrapper}>
                        <div className={styles.actionsHeader}>
                            <button className='btn_s' onClick={() => setIsCreatePopupOpen(true)}>
                                <Svg_Add w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                <h5 className='text_w_400'>Tạo Form mới</h5>
                            </button>
                            <form action={syncAction}>
                                <button type="submit" className='btn_s_b' disabled={isCreatePending || isUpdatePending || isDeletePending || isSyncPending}>
                                    <Svg_Download w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                    <h5 className='text_w_400'>Nhận data từ ggsheet</h5>
                                </button>
                            </form>
                        </div>
                        <div className={styles.wraplistForms}>
                            <div className={styles.title}>
                                <Svg_Area w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                                <h4>Danh sách sự kiện - nguồn dữ liệu</h4>
                            </div>
                            <div className={styles.itemsContainer}>
                                {data.map((item) => (
                                    <div key={item._id} className={styles.item} onClick={() => handleOpenUpdatePopup(item)}>
                                        <h5 style={{ textTransform: 'uppercase' }}>{item.name}</h5>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <h6>Ngày tạo: {formatDate(new Date(item.createdAt)) || 'Không rõ'}</h6>
                                            <h6>Được tạo bởi: {item.createdBy?.name || 'Không rõ'}</h6>
                                            <h6>Số khách hàng: 0</h6>
                                        </div>
                                        <h5 className="text_w_400">{item.describe}</h5>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            />

            <CenterPopup open={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} size="md">
                <Title content="Tạo Form mới" click={() => setIsCreatePopupOpen(false)} />
                <div className={styles.mainform}>
                    <AreaForm
                        formAction={createAction}
                        formState={createState}
                        submitText="Tạo form mới"
                    />
                </div>
            </CenterPopup>

            <CenterPopup
                key={editingItem?._id || 'update-popup'}
                open={isUpdatePopupOpen}
                onClose={() => { setIsUpdatePopupOpen(false) }}
                size="md"
            >
                {editingItem && (
                    <>
                        <Title content="Chỉnh sửa Form" click={() => { setIsUpdatePopupOpen(false) }} />
                        <div className={styles.mainform}>
                            <div className={styles.inputGroup}>
                                <h5>Đường dẫn tới form</h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderRadius: 3, border: ' thin solid var(--border-color)', alignItems: 'center', padding: 3, paddingLeft: 8 }}>
                                    <h5> {`https://airobotic.edu.vn/form/${editingItem._id}`}</h5>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <WrapIcon
                                            icon={<Svg_Coppy w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'var(--text-primary)'} />}
                                            click={() => handleCopyToClipboard(`https://airobotic.edu.vn/form/${editingItem._id}`)}
                                            className='mainIcon'
                                            content={copyStatus === 'copied' ? 'Đã sao chép!' : copyStatus === 'error' ? 'Sao chép lỗi!' : 'Sao chép đường dẫn'}
                                        />
                                        <WrapIcon
                                            icon={<Svg_Delete w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'white'} />}
                                            click={() => handleOpenDeleteConfirm(editingItem)}
                                            className='deleteIcon'
                                            content="Xóa form này"
                                        />
                                    </div>
                                </div>
                            </div>
                            <AreaForm
                                formAction={updateAction}
                                formState={updateState}
                                initialData={editingItem}
                                submitText="Cập nhật"
                            />
                        </div>
                    </>
                )}
            </CenterPopup>

            <AlertPopup
                open={isDeleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
                title="Bạn có chắc chắn muốn xóa form này?"
                type="warning"
                width={600}
                content={
                    itemToDelete && (
                        <h5>
                            Hành động này sẽ xóa vĩnh viễn form <strong>"{itemToDelete.name}"</strong>.
                            Bạn sẽ không thể hoàn tác hành động này.
                        </h5>
                    )
                }
                actions={
                    <form action={deleteAction}>
                        {/* LoadingOverlay đã được xóa khỏi đây */}
                        <input type="hidden" name="id" value={itemToDelete?._id || ''} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" style={{ whiteSpace: 'nowrap' }} onClick={handleCloseDeleteConfirm} className='btn_s'>
                                <h5>Quay lại</h5>
                            </button>
                            <SubmitButton text="Tiếp tục xóa" />
                        </div>
                    </form>
                }
            />

            {/* Thay đổi 2: Đặt một loading overlay duy nhất ở cấp cao nhất */}
            {(isCreatePending || isUpdatePending || isDeletePending || isSyncPending) && (
                <div className='loadingOverlay'>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}

            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
                button={<button onClick={handleCloseNoti} className="btn" style={{width:'100%'}}>Tắt thông báo</button>}
            />
        </>
    );
}