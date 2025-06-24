'use client';

import React, { useState, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Check, Svg_Pay, Svg_Qr } from "@/components/(icon)/svg";
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { formatCurrencyVN } from '@/function';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import styles from './index.module.css';

const PopupContent = React.memo(({ data, onConfirmClick }) => {
    const tuition = data.Course.filter(course => course.tuition === null);
    const tuitiondone = data.Course.filter(course => course.tuition !== null);

    return (
        <>
            <div style={{ padding: 16, paddingBottom: 0 }}>
                <TextNoti title={'Học phí'} mes='Phần xác nhận học phí và xem lịch sử học phí của 1 học sinh liên quan tới các khóa học mà học sinh đã tham gia.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text_4' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white' }}>Thông tin nợ học phí</p>
                <>
                    {tuition.length > 0 ? (
                        tuition.map((course, index) => {
                            return (
                                <div key={index} className='text_6_400' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                                    <p className='text_6_400'>Khóa học: {course.course.ID}</p>
                                    <p className='text_6_400'>{formatCurrencyVN(course.course.Book.Price)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <WrapIcon
                                            icon={<Svg_Check w={16} h={16} c={'white'} />}
                                            content={'Xác nhận học phí'}
                                            placement={'bottom'}
                                            style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                                            click={() => onConfirmClick(course)}
                                        />
                                        <WrapIcon
                                            icon={<Svg_Qr w={16} h={16} c={'white'} />}
                                            content={'Thanh toán'}
                                            placement={'bottom'}
                                            style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className='text_6_400' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có thông tin nợ học phí</p>
                    )}
                </>
            </div>
            <div style={{ padding: '0 16px' }}>
                <TextNoti title={'Lịch sử'} mes='Lịch sử giao dịch sẽ được phép xem lại các hóa đơn đã thanh toán trước đó.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text_4' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white' }}>Lịch sử đóng học phí</p>
                <>
                    {tuitiondone.length > 0 ? (
                        tuitiondone.map((course, index) => {
                            return (
                                <div key={index} className='text_6_400' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                                    <p className='text_6_400'>Khóa học: {course.course.ID}</p>
                                    <p className='text_6_400'>{formatCurrencyVN(course.course.Book.Price)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <WrapIcon
                                            icon={<Svg_Check w={16} h={16} c={'white'} />}
                                            content={'Chi tiết giao dịch'}
                                            placement={'bottom'}
                                            style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className='text_6_400' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có lịch sử đóng học phí</p>
                    )}
                </>
            </div>
        </>
    );
});

PopupContent.displayName = 'PopupContent';

// 2. Dữ liệu mẫu cho các chương trình khuyến mãi
const promotionsData = [
    { description: "Không áp dụng khuyến mãi", value: 0 },
    { description: "Giảm giá mừng khai trương", value: 10 },
    { description: "Giảm giá cho học sinh cũ", value: 15 },
    { description: "Khuyến mãi đặc biệt hè 2025", value: 25 },
];

export default function Pay({ data }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isConfirmPopupOpen, setConfirmPopupOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    // 3. Thêm các trạng thái mới để quản lý Menu
    const [isMenuOpen, setMenuOpen] = useState(false); // Trạng thái đóng/mở của menu
    const [selectedPromotion, setSelectedPromotion] = useState(promotionsData[0]); // Lưu khuyến mãi đã chọn, mặc định là "Không áp dụng"

    const handleOpenPopup = useCallback(() => {
        setIsPopupOpen(true);
    }, []);

    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
    }, []);

    const handleOpenConfirmPopup = useCallback((course) => {
        setSelectedCourse(course);
        setConfirmPopupOpen(true);
    }, []);

    // 4. Cập nhật hàm đóng popup để reset trạng thái khuyến mãi
    const handleCloseConfirmPopup = useCallback(() => {
        setConfirmPopupOpen(false);
        setMenuOpen(false); // Đảm bảo menu đã đóng
        setTimeout(() => {
            setSelectedCourse(null);
            setSelectedPromotion(promotionsData[0]); // Reset về khuyến mãi mặc định
        }, 300);
    }, []);

    const handleConfirmAction = useCallback(() => {
        if (selectedCourse) {
            console.log("Đã xác nhận cho khóa học:", selectedCourse.course.ID);
            console.log("Khuyến mãi áp dụng:", selectedPromotion.description, "Giá trị:", selectedPromotion.value, "%");
        }
        handleCloseConfirmPopup();
    }, [selectedCourse, selectedPromotion, handleCloseConfirmPopup]);

    // 5. Tính toán giá cuối cùng dựa trên khuyến mãi đã chọn
    const originalPrice = selectedCourse?.course.Book.Price || 0;
    const discountAmount = (originalPrice * selectedPromotion.value) / 100;
    const finalPrice = originalPrice - discountAmount;

    // 6. Tạo các mục menu từ dữ liệu mẫu
    const menuItems = (
        <div className={styles.menu_container}>
            {promotionsData.map((promo, index) => (
                <div
                    key={index}
                    className={styles.menu_item}
                    onClick={() => {
                        setSelectedPromotion(promo);
                        setMenuOpen(false); // Đóng menu sau khi chọn
                    }}
                >
                    <p className='text_6'>{promo.description}</p>  <p className='text_6_400'>Giảm: {promo.value}%</p>
                </div>
            ))}
        </div>
    )

    // 7. Tạo một nút bấm tùy chỉnh cho Menu
    const customMenuButton = (
        <div className='btn' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}>
            <p className='text_6_400'> {selectedPromotion.description} ({selectedPromotion.value}%)</p>
        </div>
    );

    return (
        <>
            <div
                onClick={handleOpenPopup}
                className="wrapicon"
                style={{
                    background: 'var(--yellow)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                aria-label="Mở Popup"
                role="button"
            >
                <Svg_Pay w={16} h={16} c={'white'} />
            </div>

            <FlexiblePopup
                open={isPopupOpen}
                onClose={handleClosePopup}
                title="Học phí"
                renderItemList={() => <PopupContent data={data} onConfirmClick={handleOpenConfirmPopup} />}
                width={500}
            />

            <CenterPopup
                open={isConfirmPopupOpen}
                onClose={handleCloseConfirmPopup}
                size="md"
            >
                {selectedCourse && (
                    <>
                        <Title content='Xác nhận đóng học phí' click={handleCloseConfirmPopup} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 16 }}>
                            <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>
                                Thông tin học sinh</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                <p className='text_6'>ID học sinh: <span className='text_6_400'>{data.ID}</span></p>
                                <p className='text_6'>Họ và tên học sinh: <span className='text_6_400'>{data.Name}</span></p>
                                <p className='text_6'>Liên hệ: <span className='text_6_400'>{data.Phone}</span></p>
                            </div>
                            <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>
                                Thông tin khóa học</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                                <p className='text_6'>Chương trình học: <span className='text_6_400'>{selectedCourse.course.Book.Name}</span></p>
                                <p className='text_6'>Khóa học: <span className='text_6_400'>{selectedCourse.course.ID}</span></p>
                                <p className='text_6'>Học phí: <span className='text_6_400'>{formatCurrencyVN(selectedCourse.course.Book.Price)}</span></p>
                            </div>
                            <p className='text_6' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>
                                Thông tin khuyến mãi</p>

                            {/* 8. THAY THẾ DIV TĨNH BẰNG THÀNH PHẦN MENU */}
                            <div style={{ padding: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <p className='text_6'>Chọn loại giảm giá: </p>
                                    <Menu
                                        isOpen={isMenuOpen}
                                        onOpenChange={setMenuOpen}
                                        menuItems={menuItems}
                                        customButton={customMenuButton}
                                        menuPosition="top"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: 'thin solid var(--border-color)' }}>
                            {/* 9. Hiển thị giá cuối cùng đã được tính toán */}
                            <p className='text_4'>Thành tiền: <span className='text_5' style={{ color: 'var(--red)' }}>{formatCurrencyVN(finalPrice)}</span></p>
                            <div className='btn' onClick={handleConfirmAction} style={{ borderRadius: 5, margin: 0 }}  >
                                Xác nhận học phí
                            </div>
                        </div>
                    </>
                )}
            </CenterPopup>
        </>
    );
}