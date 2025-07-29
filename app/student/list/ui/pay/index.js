'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { student_data, invoices_data } from '@/data/actions/get';
import { reloadInvoice } from '@/data/actions/reload';

const PopupContent = React.memo(({ data, onConfirmClick, onDetailClick }) => {
    // This component remains unchanged as the data passed to it is already filtered.
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
                            <p>Khóa học: {course.ID}</p>
                            <p>{formatCurrencyVN(course.Book.Price)}</p>
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
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text_4' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white', borderRadius: '5px 5px 0 0' }}>Lịch sử đóng học phí</p>
                {tuitiondone.length > 0 ? (
                    tuitiondone.map((course, index) => (
                        <div key={index} className='text_6_400' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                            <p>Khóa học: {course.ID}</p>
                            <p>{formatCurrencyVN(course.Book.Price)}</p>
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

const InvoiceDetailContent = React.memo(({ invoiceState, onClose }) => {
    if (invoiceState.isLoading) {
        return (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loading content="Đang tải dữ liệu hóa đơn..." />
            </div>
        );
    }
    if (invoiceState.error) {
        return (
            <>
                <Title content='Lỗi' click={onClose} />
                <div style={{ padding: 32, textAlign: 'center' }}>
                    <p className='text_5' style={{ color: 'var(--red)' }}>Không thể tải dữ liệu</p>
                    <p className='text_6_400'>{invoiceState.error}</p>
                </div>
            </>
        );
    }
    const invoice = invoiceState.data;
    if (!invoice) {
        return (
            <>
                <Title content='Thông báo' click={onClose} />
                <div style={{ padding: 32, textAlign: 'center' }}>
                    <p className='text_5'>Không có dữ liệu hóa đơn để hiển thị.</p>
                </div>
            </>
        );
    }
    return (
        <>
            <Title content='Chi tiết hóa đơn thanh toán' click={onClose} />
            <div className={styles.invoice_container}>
                {/* Invoice Metadata */}
                <div style={{ padding: '8px 16px', display: 'flex', gap: 24, borderBottom: 'thin solid var(--border-color)' }}>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Mã HĐ: {invoice._id}</p>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Ngày tạo: {formatDate(new Date(invoice.createdAt))}</p>
                    <p className='text_6_400' style={{ fontStyle: 'italic' }}>Người tạo: {invoice.createBy.name}</p>
                </div>
                {/* Company Info */}
                <div style={{ display: 'flex', gap: 16, padding: 16 }}>
                    <Image src="https://lh3.googleusercontent.com/d/1GyUaLTq4NiqHg_9jX3PP6eb9N8jekNdt" alt="Logo" width={90} height={90} style={{ borderRadius: 5 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p className='text_4'>AI Robotic</p>
                        <p className='text_6_400'><strong>Địa chỉ: </strong>Số 10, Huỳnh Văn Nghệ, P. Bửu Long, Tp. Biên Hòa - Tỉnh Đồng Nai</p>
                        <p className='text_6_400'><strong>Liên hệ: </strong>0946734111</p>
                        <p className='text_6_400'><strong>Email: </strong>nmson@lhu.edu.vn</p>
                    </div>
                </div>
                {/* Student Info */}
                <div style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', padding: '8px 0' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p className='text_6_400'><strong>ID học sinh: </strong>{invoice.studentId.ID}</p>
                            <p className='text_6_400'><strong>Học sinh: </strong>{invoice.studentId.Name}</p>
                            <p className='text_6_400'><strong>Địa chỉ: </strong>{invoice.studentId.Address}</p>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p className='text_6_400'><strong>Liên hệ: </strong>{invoice.studentId.Phone}</p>
                            <p className='text_6_400'><strong>Email: </strong>{invoice.studentId.Email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                {/* Course & Payment Details */}
                <div style={{ padding: '8px 16px', paddingTop: 0 }}>
                    <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', borderBottom: 'thin solid var(--border-color)', borderTop: 'thin solid var(--border-color)' }}>
                        <p className='text_6' style={{ flex: 2 }}>CHƯƠNG TRÌNH</p>
                        <p className='text_6' style={{ flex: 1 }}>KHÓA HỌC</p>
                        <p className='text_6' style={{ flex: 1 }}>ĐƠN GIÁ</p>
                        <p className='text_6' style={{ flex: 1 }}>THÀNH TIỀN</p>
                    </div>
                    <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center' }}>
                        <p className='text_6_400' style={{ flex: 2 }}>{invoice.courseId.Book.Name}</p>
                        <p className='text_6_400' style={{ flex: 1 }}>{invoice.courseId.ID}</p>
                        <p className='text_6_400' style={{ flex: 1 }}>{formatCurrencyVN(invoice.amountInitial)}</p>
                        <p className='text_6_400' style={{ flex: 1 }}>{formatCurrencyVN(invoice.amountPaid)}</p>
                    </div>
                </div>
            </div>
        </>
    );
});
InvoiceDetailContent.displayName = 'InvoiceDetailContent';

const promotionsData = [{ description: "Không áp dụng", value: 0 }, { description: "Giảm giá khai trương", value: 10 }, { description: "Học sinh cũ", value: 15 }, { description: "Hè 2025", value: 25 }];
const paymentMethodsData = [{ description: 'Tiền mặt', value: 0 }, { description: 'Chuyển khoản', value: 1 }];

// Changed: Added optional 'courseId' prop with a default null value.
export default function Pay({ _id, courseId = null, status = false }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isConfirmPopupOpen, setConfirmPopupOpen] = useState(false);
    const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [invoiceState, setInvoiceState] = useState({ isLoading: false, data: null, error: null });
    const [selectedPromotion, setSelectedPromotion] = useState(promotionsData[0]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethodsData[0]);
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });
    const handleFetchStudentData = useCallback(async () => {
        if (!_id) throw new Error("ID học sinh không hợp lệ.");
        const data = await student_data(_id);
        let finalData = (Array.isArray(data) && data.length > 0) ? data[0] : data;
        if (courseId && finalData?.Course) {
            const filteredCourses = finalData.Course.filter(
                course => course._id === courseId
            );
            finalData = { ...finalData, Course: filteredCourses };
        }
        setStudentData(finalData);
        return finalData;
    }, [_id, courseId]);
    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
        setStudentData(null);
    }, []);

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
            setInvoiceState({ isLoading: false, data: null, error: "Dữ liệu hóa đơn không hợp lệ." });
            return;
        }
        setInvoiceState({ isLoading: true, data: null, error: null });
        try {
            const response = await invoices_data(invoiceId);
            setInvoiceState({ isLoading: false, data: response, error: null });
        } catch (error) {
            setInvoiceState({ isLoading: false, data: null, error: "Lỗi kết nối máy chủ." });
        }
    }, []);

    const handleCloseDetailPopup = () => setIsDetailPopupOpen(false);

    const handleCloseNoti = useCallback(() => {
        setNoti(prev => ({ ...prev, open: false }));
        if (noti.status) {
            handleCloseConfirmPopup();
            handleClosePopup();
        }
    }, [noti.status, handleCloseConfirmPopup, handleClosePopup]);

    const handleConfirmAction = () => {
        if (!selectedCourse || !studentData) return;
        startTransition(async () => {
            const originalPrice = selectedCourse.Book.Price;
            const finalPrice = originalPrice - (originalPrice * selectedPromotion.value) / 100;
            const payload = {
                studentId: studentData._id,
                courseId: selectedCourse._id,
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
                if (response.ok) router.refresh();
                setNoti({ open: true, status: response.ok, mes: result.mes });
            } catch (error) {
                setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
            }
        });
    };

    const originalPrice = selectedCourse?.Book.Price || 0;
    const finalPrice = originalPrice - (originalPrice * selectedPromotion.value) / 100;

    const promotionMenuItems = <div className={styles.menu_container}>{promotionsData.map((promo, index) => (<div key={index} className={styles.menu_item} onClick={() => { setSelectedPromotion(promo); }}> <p className='text_6_400'>{promo.description}</p> <p className='text_6_400'>Giảm: {promo.value}%</p> </div>))}</div>;
    const customPromotionButton = <div className='btn' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}> <p className='text_6_400'>{selectedPromotion.description} ({selectedPromotion.value}%)</p> </div>;
    const paymentMenuItems = <div className={styles.menu_container}>{paymentMethodsData.map((method, index) => (<div key={index} className={styles.menu_item} onClick={() => { setSelectedPaymentMethod(method); }}> <p className='text_6_400'>{method.description}</p> </div>))}</div>;
    const customPaymentButton = <div className='btn' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}> <p className='text_6_400'>{selectedPaymentMethod.description}</p> </div>;

    return (
        <>
            <div onClick={handleOpenPopup} className="wrapicon" style={{ background: status ? 'var(--green)' : 'var(--red)', cursor: 'pointer', display: 'inline-flex' }} aria-label="Mở Popup" role="button">
                <Svg_Pay w={16} h={16} c={'white'} />
            </div>
            <FlexiblePopup open={isPopupOpen} onClose={handleClosePopup} title="Học phí" width={500} fetchData={handleFetchStudentData} renderItemList={(data) => (data ? <PopupContent data={data} onConfirmClick={handleOpenConfirmPopup} onDetailClick={handleOpenDetailPopup} /> : null)} />
            <CenterPopup open={isConfirmPopupOpen} onClose={handleCloseConfirmPopup} size="md">
                {isPending ? (<div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loading content="Đang xử lý giao dịch..." /></div>) : (
                    selectedCourse && studentData && (
                        <>
                            <Title content='Xác nhận đóng học phí' click={handleCloseConfirmPopup} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 16 }}>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin học sinh</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                    <p className='text_6'>ID học sinh: <span className='text_6_400'>{studentData.ID}</span></p>
                                    <p className='text_6'>Họ và tên học sinh: <span className='text_6_400'>{studentData.Name}</span></p>
                                    <p className='text_6'>Liên hệ: <span className='text_6_400'>{studentData.Phone}</span></p>
                                </div>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin khóa học</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                    <p className='text_6'>Chương trình học: <span className='text_6_400'>{selectedCourse.Book.Name}</span></p>
                                    <p className='text_6'>Khóa học: <span className='text_6_400'>{selectedCourse.ID}</span></p>
                                    <p className='text_6'>Học phí: <span className='text_6_400'>{formatCurrencyVN(selectedCourse.Book.Price)}</span></p>
                                </div>
                                <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin thanh toán</p>
                                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p className='text_6' style={{ minWidth: 120 }}>Loại giảm giá:</p>
                                        <Menu menuItems={promotionMenuItems} customButton={customPromotionButton} menuPosition="top" style={{ flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <p className='text_6' style={{ minWidth: 120 }}>Hình thức thanh toán:</p>
                                        <Menu menuItems={paymentMenuItems} customButton={customPaymentButton} menuPosition="top" style={{ flex: 1 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: 'thin solid var(--border-color)' }}>
                                <p className='text_4'>Thành tiền: <span className='text_5' style={{ color: 'var(--red)' }}>{formatCurrencyVN(finalPrice)}</span></p>
                                <div className='btn' onClick={handleConfirmAction} style={{ borderRadius: 5, margin: 0 }}>Xác nhận học phí</div>
                            </div>
                        </>
                    )
                )}
            </CenterPopup>
            <CenterPopup open={isDetailPopupOpen} onClose={handleCloseDetailPopup} size="lg">
                <InvoiceDetailContent invoiceState={invoiceState} onClose={handleCloseDetailPopup} />
            </CenterPopup>
            <Noti open={noti.open} onClose={handleCloseNoti} status={noti.status} mes={noti.mes} button={<div className='btn' onClick={handleCloseNoti} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }}><p className='text_6_400' style={{ color: 'white' }}>Tắt thông báo</p></div>} />
        </>
    );
}