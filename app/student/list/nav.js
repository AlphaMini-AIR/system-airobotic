'use client'
import { useState } from 'react';
import air from '../index.module.css'
import Menu from '@/components/(button)/menu';

export default function Nav({ data_area, selectedArea, onAreaChange }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const status = (
        <div className={air.list_menuwrap}>
            <div style={{ padding: 8, gap: 3 }} className='flex_col'>
                <p className={`${air.list_li} text_5_400`}>
                    Tất cả
                </p>
                <p className={`${air.list_li} text_5_400`}>
                    Đã nghỉ
                </p>
                <p className={`${air.list_li} text_5_400`}>
                    Đang học
                </p>
            </div>
        </div>
    );

    const fee = (
        <div className={air.list_menuwrap}>
            <div style={{ padding: 8, gap: 3 }} className='flex_col'>
                <p className={`${air.list_li} text_5_400`}>
                    Tất cả
                </p>
                <p className={`${air.list_li} text_5_400`}>
                    Nợ học phí
                </p>
                <p className={`${air.list_li} text_5_400`}>
                    Không nợ học phí
                </p>
            </div>
        </div>
    );

    const handleSelectArea = (area) => {
        onAreaChange(area);
        setIsMenuOpen(false);
    };

    const renderAreaMenu = () => {
        return (
            <div className={air.list_menuwrap}>
                <div style={{ padding: 8, gap: 3 }} className="flex_col">
                    <p
                        onClick={() => handleSelectArea("Tất cả")}
                        className={`${air.list_li} text_4_m ${selectedArea === "Tất cả" ? air.active : ""}`}
                    >
                        Tất cả
                    </p>
                    {data_area.map((area, idx) => (
                        <p
                            key={idx}
                            onClick={() => handleSelectArea(area.name)}
                            className={`${air.list_li} text_4_m ${selectedArea === area.name ? air.active : ""}`}
                        >
                            {area.name}
                        </p>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <p className={`${air.over_title} text_4`}>Khóa học</p>
            <Menu
                menuItems={status}
                menuPosition="bottom"
                customButton={
                    <div className={`${air.over_button} ${air.ac}`} >
                        Tất cả
                    </div>
                }
            />
            <p className={`${air.over_title} text_4`}>Trạng thái</p>
            <Menu
                menuItems={status}
                menuPosition="bottom"
                customButton={
                    <div className={`${air.over_button} ${air.ac}`} >
                        Tất cả
                    </div>
                }
            />
            <p className={`${air.over_title} text_4`}>Học phí</p>
            <Menu
                menuItems={fee}
                menuPosition="bottom"
                customButton={
                    <div className={`${air.over_button} ${air.ac}`} >
                        Tất cả
                    </div>
                }
            />
            <p className={`${air.over_title} text_4`}>Khu vực</p>
            <Menu
                menuItems={renderAreaMenu()}
                menuPosition="bottom"
                isOpen={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                customButton={
                    <div className={`${air.over_button} ${air.ac}`}>
                        {selectedArea}
                    </div>
                }
            />
        </>
    )
}