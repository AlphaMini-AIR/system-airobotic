'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createScheduleAction } from '@/app/actions/schedule.actions';
import { updateCustomerStatusAction } from '@/app/actions/customer.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Menu from '@/components/(ui)/(button)/menu';
import { Svg_Send } from '@/components/(icon)/svg';
import styles from './index.module.css';

function ProgressPopup({ open, progress, onBackdropClick }) {
    if (!open) return null;
    const successPercent = progress.total > 0 ? (progress.success / progress.total) * 100 : 0;
    const failedPercent = progress.total > 0 ? (progress.failed / progress.total) * 100 : 0;
    return (
        <div className={styles.progressBackdrop} onClick={onBackdropClick}>
            <div className={styles.progressPopup} onClick={(e) => e.stopPropagation()}>
                <h5>Đang xử lý hàng loạt...</h5>
                <div className={styles.progressInfo}>
                    <h6>Hoàn thành: {progress.success + progress.failed}/{progress.total}</h6>
                    <h6>Thành công: <span style={{ color: 'var(--green)' }}>{progress.success}</span> - Thất bại: <span style={{ color: 'var(--red)' }}>{progress.failed}</span></h6>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.success} style={{ width: `${successPercent}%` }}></div>
                    <div className={styles.failed} style={{ width: `${failedPercent}%` }}></div>
                </div>
                <h6>Vui lòng không tắt trang trong khi tiến trình đang chạy.</h6>
            </div>
        </div>
    );
}

function ActionForm({ onSubmit, selectedCustomers, onClose, currentType }) {
    const [actionType, setActionType] = useState('findUid');
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [actionsPerHour, setActionsPerHour] = useState(30);
    const actionOptions = useMemo(() => {
        const baseActions = [{ value: 'findUid', name: 'Tìm kiếm UID' }, { value: 'sendMessage', name: 'Gửi tin nhắn Zalo' }];
        const customerActions = [{ value: 4, name: 'Chuyển trạng thái: Đang chăm sóc' }, { value: 2, name: 'Chuyển trạng thái: Không quan tâm' }, { value: 3, name: 'Chuyển trạng thái: Chăm sóc sau' }];
        return !currentType ? [...baseActions, ...customerActions] : baseActions;
    }, [currentType]);
    const isScheduleAction = useMemo(() => ['findUid', 'sendMessage'].includes(actionType), [actionType]);
    const selectedActionName = useMemo(() => actionOptions.find(opt => opt.value === actionType)?.name, [actionType, actionOptions]);
    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        onSubmit(formData);
    };
    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <input type="hidden" name="actionType" value={actionType} />
            <input type="hidden" name="selectedCustomersJSON" value={JSON.stringify(Array.from(selectedCustomers.values()).map(c => ({ _id: c._id, name: c.name, phone: c.phone })))} />
            <div className={styles.inputGroup}>
                <label>Hành động</label>
                <Menu isOpen={isActionMenuOpen} onOpenChange={setIsActionMenuOpen} customButton={<div className='input text_6_400'>{selectedActionName}</div>} menuItems={<div className={styles.menulist}>{actionOptions.map(opt => <p key={opt.value} className='text_6_400' onClick={() => { setActionType(opt.value); setIsActionMenuOpen(false); }}>{opt.name}</p>)}</div>} menuPosition="bottom" />
            </div>
            {isScheduleAction && (
                <>
                    <div className={styles.inputGroup}><label>Tên lịch trình</label><input name="jobName" className='input' placeholder={`Ví dụ: Gửi tin tháng ${new Date().getMonth() + 1}`} required /></div>
                    <div className={styles.inputGroup}><label>Số lượng gửi / giờ</label><div className={styles.numberInput}><button type="button" onClick={() => setActionsPerHour(p => Math.max(1, p - 5))}>-</button><input type="number" name="actionsPerHour" value={actionsPerHour} onChange={(e) => setActionsPerHour(Number(e.target.value))} /><button type="button" onClick={() => setActionsPerHour(p => p + 5)}>+</button></div></div>
                    {actionType === 'sendMessage' && (
                        <><div className={styles.inputGroup}><label>Chọn nhãn tin nhắn (Tùy chọn)</label><select name="label" className='input'><option value="">-- Chọn nhãn có sẵn --</option></select></div><div className={styles.inputGroup}><label>Nội dung tin nhắn</label><textarea name="messageTemplate" className='input' rows="5" placeholder="Nhập nội dung tin nhắn..."></textarea></div></>
                    )}
                </>
            )}
            <div className={styles.formActions}>
                <button type="button" className='btn_s' onClick={onClose}>Hủy</button>
                <button type="submit" className='btn_s_b'>Xác nhận</button>
            </div>
        </form>
    );
}

export default function BulkActions({ selectedCustomers, onActionComplete }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentType = searchParams.get('type');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ success: 0, failed: 0, total: 0 });
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const stopSignal = useRef(false);
    const startProcessing = async (formData) => {
        const customersArray = JSON.parse(formData.get('selectedCustomersJSON'));
        const actionType = formData.get('actionType');
        setIsPopupOpen(false);
        setIsProcessing(true);
        stopSignal.current = false;
        let successCount = 0, failedCount = 0;
        setProgress({ success: 0, failed: 0, total: customersArray.length });
        for (let i = 0; i < customersArray.length; i++) {
            if (stopSignal.current) break;
            const customer = customersArray[i];
            const singleFormData = new FormData();
            singleFormData.append('customerId', customer._id);
            singleFormData.append('status', actionType);
            const result = await updateCustomerStatusAction(null, singleFormData);
            if (result.success) successCount++; else failedCount++;
            setProgress({ success: successCount, failed: failedCount, total: customersArray.length });
        }
        setIsProcessing(false);
        setNotification({ open: true, status: true, mes: `Hoàn tất! Thành công: ${successCount}, Thất bại: ${failedCount}.` });
        onActionComplete();
    };
    const handleFormSubmit = async (formData) => {
        const actionType = formData.get('actionType');
        if (['findUid', 'sendMessage'].includes(actionType)) {
            const result = await createScheduleAction(null, formData);
            setNotification({ open: true, status: result.success, mes: result.message || result.error });
            if (result.success) {
                onActionComplete();
                setIsPopupOpen(false);
                router.refresh();
            }
        } else {
            await startProcessing(formData);
        }
    };
    const handleStopProcess = () => {
        stopSignal.current = true;
        setIsCancelConfirmOpen(false);
    };
    return (
        <>
            <button className='btn_s' onClick={() => setIsPopupOpen(true)} disabled={selectedCustomers.size === 0}>
                <Svg_Send w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                <h5 className='text_w_400'>Hành động ({selectedCustomers.size})</h5>
            </button>
            <FlexiblePopup open={isPopupOpen} onClose={() => setIsPopupOpen(false)} title="Hành động hàng loạt" width="600px" renderItemList={() => (
                <ActionForm onSubmit={handleFormSubmit} selectedCustomers={selectedCustomers} onClose={() => setIsPopupOpen(false)} currentType={currentType} />
            )} />
            <ProgressPopup open={isProcessing} progress={progress} onBackdropClick={() => setIsCancelConfirmOpen(true)} />
            <AlertPopup
                open={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                title="Dừng xử lý hàng loạt?"
                type="warning"
                content={<h5>Bạn có chắc chắn muốn dừng tiến trình? Các hành động đã thực hiện sẽ không được hoàn tác.</h5>}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setIsCancelConfirmOpen(false)} className='btn_s'><h5>Tiếp tục chạy</h5></button>
                        <button type="button" onClick={handleStopProcess} className='btn'><h5>Xác nhận Dừng</h5></button>
                    </div>
                }
            />
            <Noti open={notification.open} onClose={() => {
                setNotification(p => ({ ...p, open: false }))
                router.refresh();
            }} status={notification.status} mes={notification.mes} />
        </>
    );
}