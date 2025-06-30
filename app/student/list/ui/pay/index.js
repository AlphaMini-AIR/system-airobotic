'use client';

import React, { useState, useCallback, useTransition } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Bill, Svg_Check, Svg_Pay, Svg_Qr } from "@/components/(icon)/svg";
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { formatCurrencyVN, formatDate } from '@/function';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import styles from './index.module.css';
import Image from 'next/image';
import { Data_Invoices } from '@/data/student';
import { useRouter } from 'next/navigation';

const PopupContent = React.memo(({ data, onConfirmClick, onDetailClick }) => {
    const tuition = data?.Course?.filter(course => course.tuition === null) || [];
    const tuitiondone = data?.Course?.filter(course => course.tuition !== null) || [];

    return (
        <>
            <div style={{ padding: 16, paddingBottom: 0 }}>
                <TextNoti title={'Học phí'} mes='Phần xác nhận học phí và xem lịch sử học phí của 1 học sinh liên quan tới các khóa học mà học sinh đã tham gia.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text_4' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white' }}>Thông tin nợ học phí</p>
                {tuition.length > 0 ? (
                    tuition.map((course, index) => (
                        <div key={index} className='text_6_400' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                            <p>Khóa học: {course.course.ID}</p>
                            <p>{formatCurrencyVN(course.course.Book.Price)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <WrapIcon icon={<Svg_Check w={16} h={16} c={'white'} />} content={'Xác nhận học phí'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }} click={() => onConfirmClick(course)} />
                                <WrapIcon icon={<Svg_Qr w={16} h={16} c={'white'} />} content={'Thanh toán'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className='text_6_400' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có thông tin nợ học phí</p>
                )}
            </div>
            <div style={{ padding: '0 16px' }}>
                <TextNoti title={'Lịch sử'} mes='Lịch sử giao dịch sẽ được phép xem lại các hóa đơn đã thanh toán trước đó.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5 }}>
                <p className='text_4' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white', borderRadius: '5px 5px 0 0' }}>Lịch sử đóng học phí</p>
                {tuitiondone.length > 0 ? (
                    tuitiondone.map((course, index) => (
                        <div key={index} className='text_6_400' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                            <p>Khóa học: {course.course.ID}</p>
                            <p>{formatCurrencyVN(course.course.Book.Price)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <WrapIcon icon={<Svg_Bill w={16} h={16} c={'white'} />} content={'Chi tiết giao dịch'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }} click={() => onDetailClick(course)} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className='text_6_400' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có lịch sử đóng học phí</p>
                )}
            </div>
        </>
    );
});
PopupContent.displayName = 'PopupContent';

const InvoiceDetailContent = React.memo(({ isLoading, error, invoices, onClose }) => {

    if (isLoading) {
        return (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loading content="Đang tải dữ liệu hóa đơn..." />
            </div>
        );
    }

    if (error) {
        return (
            <>
                <Title content='Lỗi' click={onClose} />
                <div style={{ padding: 32, textAlign: 'center' }}>
                    <p className='text_5' style={{ color: 'var(--red)' }}>Không thể tải dữ liệu</p>
                    <p className='text_6_400'>{error}</p>
                </div>
            </>
        );
    }

    if (!invoices) {
        return null;
    }
    invoices = invoices[0]
    const paymentMethodText = invoices.paymentMethod === 0 ? 'Tiền mặt' : 'Chuyển khoản';

    return (
        <>
            <Title content='Chi tiết hóa đơn thanh toán' click={onClose} />
            <div className={styles.invoice_container}>
                <div style={{ padding: '8px 16px 8px 16px', display: 'flex', gap: 24, borderBottom: 'thin solid var(--border-color)' }}>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Mã HĐ: {invoices._id}</p>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Ngày tạo: {formatDate(new Date(invoices.createdAt))}</p>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Người tạo: {invoices.createBy.name}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, padding: 16 }}>
                    <Image src="https://lh3.googleusercontent.com/d/1GyUaLTq4NiqHg_9jX3PP6eb9N8jekNdt" alt="Logo" width={90} height={90} style={{ borderRadius: 5 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p className='text_4'>AI Robotic</p>
                        <p className='text_6_400'><strong>Địa chỉ: </strong>Số 10, Huỳnh Văn Nghệ, P. Bửu Long, Tp. Biên Hòa - Tỉnh Đồng Nai</p>
                        <p className='text_6_400'><strong>Liên hệ: </strong>0946734111</p>
                        <p className='text_6_400'><strong>Email: </strong>nmson@lhu.edu.vn</p>
                    </div>
                </div>

                <div style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', padding: '8px 0' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p className='text_6_400'><strong>ID học sinh: </strong>{invoices.studentId.ID}</p>
                            <p className='text_6_400'><strong>Học sinh: </strong>{invoices.studentId.Name}</p>
                            <p className='text_6_400'><strong>Ngày sinh: </strong>{formatDate(new Date(invoices.studentId.BD))}</p>
                            <p className='text_6_400'><strong>Chi tiết thanh toán: </strong></p>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p className='text_6_400'><strong>Liên hệ: </strong>{invoices.studentId.Phone}</p>
                            <p className='text_6_400'><strong>Email: </strong>{invoices.studentId.Email}</p>
                            <p className='text_6_400'><strong>Địa chỉ: </strong>{invoices.studentId.Address}</p>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '8px 16px', paddingTop: 0 }}>
                    <div style={{
                        padding: '8px 0', display: 'flex', alignItems: 'center', borderBottom: 'thin solid var(--border-color)',
                        borderTop: 'thin solid var(--border-color)', width: '100%'
                    }}>
                        <p className='text_6' style={{ flex: 2 }} >CHƯƠNG TRÌNH</p>
                        <p className='text_6' style={{ flex: 1 }} >KHÓA HỌC</p>
                        <p className='text_6' style={{ flex: 1 }} >ĐƠN GIÁ</p>
                        <p className='text_6' style={{ flex: 1 }} >THÀNH TIỀN</p>
                    </div>
                    <div style={{
                        padding: '8px 0', display: 'flex', alignItems: 'center'
                    }}>
                        <p className='text_6_400' style={{ flex: 2 }} >{invoices.courseId.Book.Name}</p>
                        <p className='text_6_400' style={{ flex: 1 }} >{invoices.courseId.Name}</p>
                        <p className='text_6_400' style={{ flex: 1 }} >{formatCurrencyVN(invoices.amountInitial)}</p>
                        <p className='text_6_400' style={{ flex: 1 }} >{formatCurrencyVN(invoices.amountPaid)}</p>
                    </div>
                </div>
            </div>
        </>
    );
});
InvoiceDetailContent.displayName = 'InvoiceDetailContent';

const promotionsData = [{ description: "Không áp dụng", value: 0 }, { description: "Giảm giá khai trương", value: 10 }, { description: "Học sinh cũ", value: 15 }, { description: "Hè 2025", value: 25 },];
const paymentMethodsData = [{ description: 'Tiền mặt', value: 0 }, { description: 'Chuyển khoản', value: 1 },];

export default function Pay({ data }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isConfirmPopupOpen, setConfirmPopupOpen] = useState(false);
    const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [invoiceDetailData, setInvoiceDetailData] = useState(null);
    const [detailError, setDetailError] = useState(null);
    const [isPromotionMenuOpen, setPromotionMenuOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(promotionsData[0]);
    const [isPaymentMenuOpen, setPaymentMenuOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethodsData[0]);
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });

    const handleOpenPopup = useCallback(() => setIsPopupOpen(true), []);
    const handleClosePopup = useCallback(() => setIsPopupOpen(false), []);

    const handleOpenConfirmPopup = useCallback((course) => {
        setSelectedCourse(course);
        setConfirmPopupOpen(true);
    }, []);

    const handleCloseConfirmPopup = useCallback(() => {
        setConfirmPopupOpen(false);
        setTimeout(() => {
            setSelectedCourse(null);
            setSelectedPromotion(promotionsData[0]);
            setSelectedPaymentMethod(paymentMethodsData[0]);
        }, 300);
    }, []);

    const handleOpenDetailPopup = useCallback(async (courseData) => {
        const invoiceId = courseData?.tuition;
        setIsDetailPopupOpen(true);
        if (!invoiceId) {
            setDetailError("Dữ liệu hóa đơn không hợp lệ.");
            return;
        }
        setIsDetailLoading(true);
        setInvoiceDetailData(null);
        setDetailError(null);
        try {
            const response = await Data_Invoices(invoiceId);
            setInvoiceDetailData(response)
        } catch (error) {
            console.error("Failed to fetch invoice details:", error);
            setDetailError("Lỗi kết nối máy chủ.");
        } finally {
            setIsDetailLoading(false);
        }
    }, []);

    const handleCloseDetailPopup = useCallback(() => {
        setIsDetailPopupOpen(false);
    }, []);

    const handleCloseNoti = useCallback(() => {
        setNoti({ open: false, status: false, mes: '' });
        if (noti.status) {
            handleCloseConfirmPopup();
            handleClosePopup();
        }
    }, [noti.status, handleCloseConfirmPopup, handleClosePopup]);

    const originalPrice = selectedCourse?.course.Book.Price || 0;
    const discountAmount = (originalPrice * selectedPromotion.value) / 100;
    const finalPrice = originalPrice - discountAmount;

    const handleConfirmAction = () => {
        if (!selectedCourse) return;

        startTransition(async () => {
            const payload = {
                studentId: data._id,
                courseId: selectedCourse.course._id,
                amountInitial: originalPrice,
                amountPaid: finalPrice,
                paymentMethod: selectedPaymentMethod.value,
                discount: selectedPromotion.value
            };

            try {
                const response = await fetch('/api/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    router.refresh();
                }

                setNoti({ open: true, status: result.status === 2, mes: result.mes });

            } catch (error) {
                console.error("API call failed:", error);
                setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
            }
        });
    };

    const promotionMenuItems = (<div className={styles.menu_container}> {promotionsData.map((promo, index) => (<div key={index} className={styles.menu_item} onClick={() => { setSelectedPromotion(promo); setPromotionMenuOpen(false); }}> <p className='text_6_400'>{promo.description}</p> <p className='text_6_400'>Giảm: {promo.value}%</p> </div>))} </div>);
    const customPromotionButton = (<div className='btn' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}> <p className='text_6_400'>{selectedPromotion.description} ({selectedPromotion.value}%)</p> </div>);
    const paymentMenuItems = (<div className={styles.menu_container}> {paymentMethodsData.map((method, index) => (<div key={index} className={styles.menu_item} onClick={() => { setSelectedPaymentMethod(method); setPaymentMenuOpen(false); }}> <p className='text_6_400'>{method.description}</p> </div>))} </div>);
    const customPaymentButton = (<div className='btn' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}> <p className='text_6_400'>{selectedPaymentMethod.description}</p> </div>);

    return (
        <>
            <div onClick={handleOpenPopup} className="wrapicon" style={{ background: 'var(--yellow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Mở Popup" role="button">
                <Svg_Pay w={16} h={16} c={'white'} />
            </div>

            <FlexiblePopup open={isPopupOpen} onClose={handleClosePopup} title="Học phí" renderItemList={() => <PopupContent data={data} onConfirmClick={handleOpenConfirmPopup} onDetailClick={handleOpenDetailPopup} />} width={500} />

            <CenterPopup open={isConfirmPopupOpen} onClose={handleCloseConfirmPopup} size="md">
                {isPending ? (
                    <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loading content="Đang xử lý giao dịch..." />
                    </div>
                ) : (
                    selectedCourse && (
                        <>
                            <Title content='Xác nhận đóng học phí' click={handleCloseConfirmPopup} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 16 }}>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin học sinh</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                    <p className='text_6'>ID học sinh: <span className='text_6_400'>{data.ID}</span></p>
                                    <p className='text_6'>Họ và tên học sinh: <span className='text_6_400'>{data.Name}</span></p>
                                    <p className='text_6'>Liên hệ: <span className='text_6_400'>{data.Phone}</span></p>
                                </div>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin khóa học</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                    <p className='text_6'>Chương trình học: <span className='text_6_400'>{selectedCourse.course.Book.Name}</span></p>
                                    <p className='text_6'>Khóa học: <span className='text_6_400'>{selectedCourse.course.ID}</span></p>
                                    <p className='text_6'>Học phí: <span className='text_6_400'>{formatCurrencyVN(selectedCourse.course.Book.Price)}</span></p>
                                </div>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin thanh toán</p>
                                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p className='text_6' style={{ minWidth: 120 }}>Loại giảm giá:</p>
                                        <Menu isOpen={isPromotionMenuOpen} onOpenChange={setPromotionMenuOpen} menuItems={promotionMenuItems} customButton={customPromotionButton} menuPosition="top" style={{ flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p className='text_6' style={{ minWidth: 120 }}>Hình thức thanh toán:</p>
                                        <Menu isOpen={isPaymentMenuOpen} onOpenChange={setPaymentMenuOpen} menuItems={paymentMenuItems} customButton={customPaymentButton} menuPosition="top" style={{ flex: 1 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: 'thin solid var(--border-color)' }}>
                                <p className='text_4'>Thành tiền: <span className='text_5' style={{ color: 'var(--red)' }}>{formatCurrencyVN(finalPrice)}</span></p>
                                <div className='btn' onClick={handleConfirmAction} style={{ borderRadius: 5, margin: 0 }}>
                                    Xác nhận học phí
                                </div>
                            </div>
                        </>
                    )
                )}
            </CenterPopup>

            <CenterPopup open={isDetailPopupOpen} onClose={handleCloseDetailPopup} size="lg">
                <InvoiceDetailContent
                    isLoading={isDetailLoading}
                    error={detailError}
                    invoices={invoiceDetailData}
                    onClose={handleCloseDetailPopup}
                />
            </CenterPopup>

            <Noti
                open={noti.open}
                onClose={handleCloseNoti}
                status={noti.status}
                mes={noti.mes}
                button={
                    <div className='btn' onClick={handleCloseNoti} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }}>
                        <p className='text_6_400' style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />
        </>
    );
}