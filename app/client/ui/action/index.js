'use client';
import { useState, useEffect, useMemo, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation'; 
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { cancelScheduleAction } from '@/app/actions/schedule.actions'; // Import action mới

function formatRemainingTime(ms) {
    if (ms <= 0) return 'Đã hoàn thành';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let result = 'Còn lại ';
    if (hours > 0) result += `${hours} giờ `;
    if (minutes > 0) result += `${minutes} phút`;
    if (hours === 0 && minutes === 0) result += `${totalSeconds} giây`;
    return result.trim();
}
const getActionTypeName = (type) => {
    switch (type) {
        case 'findUid': return 'Tìm UID';
        case 'sendMessage': return 'Gửi Tin';
        case 'addFriend': return 'Kết bạn';
        default: return 'Hành động';
    }
}
const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
function SubmitButton({ text = 'Thực hiện' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className='btn'>
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}
function ActionDetailItem({ job, onShowDetails, onCancel }) {
    const [remainingTime, setRemainingTime] = useState('');
    const { total, completed, failed } = job.statistics;
    const successPercent = total > 0 ? (completed / total) * 100 : 0;
    const failedPercent = total > 0 ? (failed / total) * 100 : 0;
    useEffect(() => {
        const completionDate = new Date(job.estimatedCompletionTime);
        const updateTimer = () => {
            const msLeft = completionDate.getTime() - new Date().getTime();
            setRemainingTime(formatRemainingTime(msLeft));
        };
        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [job.estimatedCompletionTime]);
    return (
        <div className={styles.detailItem}>
            <div className={styles.detailHeader}><h5>{job.jobName}</h5><h6>{getActionTypeName(job.actionType)}</h6></div>
            <div className={styles.progressInfo}><h6>Tiến độ: {completed}/{total}</h6><h6 className={styles.timer}>{remainingTime}</h6></div>
            <div className={styles.progressBar}><div className={styles.success} style={{ width: `${successPercent}%` }}></div><div className={styles.failed} style={{ width: `${failedPercent}%` }}></div></div>
            <div className={styles.jobMetaGrid}>
                <div><h6>Tài khoản chạy</h6><h5>{job.zaloAccount?.name || 'Không rõ'}</h5></div>
                <div><h6>Người tạo</h6><h5>{job.createdBy?.name || 'Không rõ'}</h5></div>
                <div><h6>Thời gian tạo</h6><h5>{formatDateTime(job.createdAt)}</h5></div>
                <div><h6>Dự kiến xong</h6><h5>{formatDateTime(job.estimatedCompletionTime)}</h5></div>
            </div>
            {job.actionType === 'sendMessage' && job.config.messageTemplate && (<div className={styles.messageContent}><h6>Nội dung tin nhắn:</h6><blockquote>{job.config.messageTemplate}</blockquote></div>)}
            <div className={styles.detailActions}>
                <button className='btn_s' onClick={() => onShowDetails(job)}><h6>Chi tiết danh sách</h6></button>
                <button className='btn_s_w' onClick={() => onCancel(job)}><h6>Hủy bỏ lịch</h6></button>
            </div>
        </div>
    );
}
function TaskItem({ task }) {
    const getStatus = () => {
        if (task.processedAt) { return task.resultMessage ? { key: 'failed', text: 'Thất bại' } : { key: 'success', text: 'Thành công' }; }
        return { key: 'pending', text: 'Đang chờ' };
    };
    const status = getStatus();
    return (
        <div className={styles.taskItem}>
            <div className={styles.taskInfo}><h5>{task.person.name}</h5><h6>{task.person.phone}</h6>{status.key === 'failed' && <h6 className={styles.errorMessage}>Lỗi: {task.resultMessage}</h6>}</div>
            <div className={styles.taskStatusContainer}><div className={`${styles.statusIndicator} ${styles[status.key]}`}></div><h6>{status.text}</h6><h6>{new Date(task.scheduledFor).toLocaleTimeString('vi-VN')}</h6></div>
        </div>
    );
}
export default function RunningActions({ user }) {
    const router = useRouter();
    const actions = user?.[0]?.zalo?.action || [];
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [viewingDetailsFor, setViewingDetailsFor] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [jobToCancel, setJobToCancel] = useState(null);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [cancelState, cancelAction, isCancelPending] = useActionState(cancelScheduleAction, { success: null, message: null, error: null });
    const categorizedTasks = useMemo(() => {
        if (!viewingDetailsFor) return { pending: [], success: [], failed: [], all: [] };
        const pending = []; const success = []; const failed = [];
        viewingDetailsFor.tasks.forEach(task => {
            if (task.processedAt) {
                if (task.resultMessage) failed.push(task); else success.push(task);
            } else { pending.push(task); }
        });
        return { pending, success, failed, all: [...pending, ...success, ...failed] };
    }, [viewingDetailsFor]);
    const filteredTasks = useMemo(() => {
        if (activeFilter === 'all') return categorizedTasks.all;
        return categorizedTasks[activeFilter] || [];
    }, [activeFilter, categorizedTasks]);
    useEffect(() => {
        const result = cancelState.message || cancelState.error;
        if (result) {
            setNotification({ open: true, status: cancelState.success, mes: result });
            if (cancelState.success) {
                setJobToCancel(null);
                setIsPopupOpen(false);
                router.refresh();
            }
        }
    }, [cancelState, router]);
    if (actions.length === 0) return null;
    const firstJob = actions[0];
    const totalActions = actions.length;
    const { total, completed } = firstJob.statistics;
    const handleShowDetails = (job) => { setActiveFilter('all'); setViewingDetailsFor(job); };
    const handleCloseDetails = () => setViewingDetailsFor(null);
    const handleOpenCancelConfirm = (job) => setJobToCancel(job);
    const handleCloseCancelConfirm = () => setJobToCancel(null);
    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));
    return (
        <>
            <button className={styles.compactButton} onClick={() => setIsPopupOpen(true)}>
                <h5>{getActionTypeName(firstJob.actionType)}: {firstJob.jobName}</h5><div className={styles.separator}></div><h6>{completed}/{total}</h6><div className={styles.separator}></div><h6>Chi tiết +{totalActions}</h6>
            </button>
            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title={`Hành động đang chạy (${totalActions})`}
                width={'500px'}
                renderItemList={() => (<div className={styles.popupList}>{actions.map(job => (<ActionDetailItem key={job._id} job={job} onShowDetails={handleShowDetails} onCancel={handleOpenCancelConfirm} />))}</div>)}
                secondaryOpen={!!viewingDetailsFor}
                onCloseSecondary={handleCloseDetails}
                secondaryTitle={`Danh sách (${viewingDetailsFor?.tasks?.length || 0})`}
                dataSecondary={viewingDetailsFor}
                width2={'550px'}
                renderSecondaryList={(job) => (
                    <div className={`${styles.popupList} scroll`}>
                        <div className={styles.filterControls}>
                            <button className={activeFilter === 'all' ? styles.activeFilter : ''} onClick={() => setActiveFilter('all')}><h6>Tất cả ({categorizedTasks.all.length})</h6></button>
                            <button className={activeFilter === 'pending' ? styles.activeFilter : ''} onClick={() => setActiveFilter('pending')}><h6>Đang chờ ({categorizedTasks.pending.length})</h6></button>
                            <button className={activeFilter === 'success' ? styles.activeFilter : ''} onClick={() => setActiveFilter('success')}><h6>Thành công ({categorizedTasks.success.length})</h6></button>
                            <button className={activeFilter === 'failed' ? styles.activeFilter : ''} onClick={() => setActiveFilter('failed')}><h6>Thất bại ({categorizedTasks.failed.length})</h6></button>
                        </div>
                        {filteredTasks.map(task => (<TaskItem key={task._id} task={task} />))}
                    </div>
                )}
            />
            <AlertPopup
                open={!!jobToCancel}
                onClose={handleCloseCancelConfirm}
                title="Xác nhận hủy lịch trình"
                type="warning"
                content={jobToCancel && (<h5>Bạn có chắc chắn muốn hủy vĩnh viễn lịch trình <strong>"{jobToCancel.jobName}"</strong>? Hành động này không thể hoàn tác.</h5>)}
                actions={
                    <form action={cancelAction}>
                        <input type="hidden" name="jobId" value={jobToCancel?._id || ''} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={handleCloseCancelConfirm} className='btn_s'><h5>Quay lại</h5></button>
                            <SubmitButton text="Xác nhận Hủy" />
                        </div>
                    </form>
                }
            />
            {isCancelPending && (<div className='loadingOverlay'><Loading content={<h5>Đang hủy lịch...</h5>} /></div>)}
            <Noti open={notification.open} onClose={handleCloseNoti} status={notification.status} mes={notification.mes} />
        </>
    );
}