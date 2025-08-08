'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { addZaloAccountAction, selectZaloAccountAction } from '@/app/actions/zalo.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Add, Svg_Logout, Svg_Out, Svg_Setting } from '@/components/(icon)/svg';
import styles from './index.module.css';
import Title from '@/components/(features)/(popup)/title';
import { truncateString } from '@/function';
import Image from 'next/image';

// --- Các component con (SubmitButton, TokenForm, SelectableZaloItem) không thay đổi ---

function SubmitButton({ text = 'Thực hiện' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className='btn' style={{ transform: 'none', margin: 0 }}>
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}

function TokenForm({ formAction, formState, submitText }) {
    const [token, setToken] = useState('');
    useEffect(() => { if (formState.status === true) { setToken('') } }, [formState]);
    return (
        <form action={formAction} className={styles.createForm}>
            <div className={styles.inputGroup}>
                <label htmlFor="token">Zalo Access Token</label>
                <textarea
                    className='input'
                    id="token"
                    name="token"
                    placeholder="Dán Access Token của bạn vào đây"
                    required
                    value={token}
                    style={{ height: 250 }}
                    onChange={(e) => setToken(e.target.value)}
                />
            </div>
            <SubmitButton text={submitText} />
        </form>
    );
}

function SelectableZaloItem({ item, action }) {
    const { pending } = useFormStatus();
    return (
        <form action={action} className={pending ? styles.itemPending : ''}>
            <input type="hidden" name="zaloAccountId" value={item._id} />
            <button type="submit" className={styles.item} disabled={pending} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={styles.avt}>
                        <Image src={item.avt} alt={item.name} fill />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <h5>{item.name}</h5>
                        <h6 className="text_sm text_w_400">{item.phone}</h6>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--green)' }}></div>
                    <h6>Đang hoạt động</h6>
                </div>
            </button>
        </form>
    );
}


// --- Component chính SettingZalo ---

export default function SettingZalo({ user, zalo }) {
    const router = useRouter();
    const [isRightPopupOpen, setIsRightPopupOpen] = useState(false);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });

    const [addAccountState, addAccountAction, isAddPending] = useActionState(addZaloAccountAction, { message: null, status: null });
    // Thay đổi 1: Lấy thêm `isSelectPending` từ hook
    const [selectState, selectAction, isSelectPending] = useActionState(selectZaloAccountAction, { message: null, status: null });

    useEffect(() => {
        if (addAccountState.message) {
            setNotification({ open: true, status: addAccountState.status, mes: addAccountState.message });
            if (addAccountState.status === true) {
                router.refresh();
                setIsCreatePopupOpen(false);
            }
        }
    }, [addAccountState, router]);

    useEffect(() => {
        if (selectState.message) {
            setNotification({ open: true, status: selectState.status, mes: selectState.message });
            if (selectState.status === true) {
                router.refresh();
                setIsRightPopupOpen(false); // Đóng popup sau khi chọn/thoát thành công
            }
        }
    }, [selectState, router]);

    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 150, border: 'thin solid var(--border-color)', height: 'calc(100% - 2px)', borderRadius: '5px 0 0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <h5>{user?.zalo ? truncateString(user.zalo.name, 10) : 'Chưa chọn'}</h5>
                </div>
                <button className='btn_s' style={{ borderRadius: '0 5px 5px 0' }} onClick={() => setIsRightPopupOpen(true)}>
                    <Svg_Setting w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                    <h5 className='text_w_400'>Cấu hình</h5>
                </button>
            </div>
            <FlexiblePopup
                open={isRightPopupOpen}
                onClose={() => setIsRightPopupOpen(false)}
                title="Cài đặt tài khoản Zalo"
                width={'600px'}
                renderItemList={() => (
                    <div className={styles.popupContentWrapper}>
                        <div className={styles.wraplistForms}>
                            <div className={styles.title}>
                                {user?.zalo ?
                                    <div className={styles.item} style={{ width: '100%', background: 'transparent' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className={styles.avt}>
                                                <Image src={user.zalo.avt} alt={user.zalo.name} fill />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                                                <h5>{user.zalo.name}</h5>
                                                <h6>{user.zalo.phone}</h6>
                                            </div>
                                        </div>
                                        {/* Thay đổi 2: Chuyển thành form để gọi action thoát */}
                                        <form action={selectAction}>
                                            <input type="hidden" name="zaloAccountId" value="" />
                                            <button type="submit" className='btn_s' disabled={isSelectPending}>
                                                <Svg_Logout w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                                                <h5>{isSelectPending ? 'Đang xử lý...' : 'Thoát tài khoản'}</h5>
                                            </button>
                                        </form>
                                    </div> :
                                    <div style={{ padding: '12px 16px', width: 'calc(100% - 32px)', border: 'thin dashed var(--border-color)', borderRadius: 5 }}>
                                        <h5>Chưa chọn tài khoản</h5>
                                    </div>
                                }
                            </div>
                            <div className={styles.itemsContainer}>
                                {zalo?.map((item) => {
                                    if (user?.zalo && user.zalo._id == item._id) return null
                                    return (
                                        <SelectableZaloItem key={item._id} item={item} action={selectAction} />
                                    )
                                })}
                                <div className={styles.item} style={{ justifyContent: 'flex-start' }} onClick={() => setIsCreatePopupOpen(true)}>
                                    <div className={styles.avt}>
                                        <Svg_Add w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'var(--text-primary)'} />
                                    </div>
                                    <div>
                                        <h5>Thêm tài khoản Zalo</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            />
            <CenterPopup open={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} size="md">
                <Title content="Thêm tài khoản Zalo mới" click={() => setIsCreatePopupOpen(false)} />
                <div className={styles.mainform}>
                    <TokenForm
                        formAction={addAccountAction}
                        formState={addAccountState}
                        submitText="Thêm tài khoản"
                    />
                </div>
            </CenterPopup>

            {/* Thay đổi 3: Cập nhật điều kiện hiển thị loading */}
            {(isAddPending || isSelectPending) && (
                <div className='loadingOverlay'>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}

            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
            />
        </>
    );
}