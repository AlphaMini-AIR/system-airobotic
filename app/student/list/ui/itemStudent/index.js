"use client";

import { useState } from "react";
import { Svg_Bill, Svg_Detail, Svg_Pen, Svg_Profile } from "@/components/(icon)/svg";
import Image from "next/image";
import styles from './index.module.css'
import Tooltip from "@/components/(ui)/(button)/tooltip";
import WrapIcon from "@/components/(ui)/(button)/hoveIcon";
import Link from "next/link";
import { srcImage } from "@/function";
import Update from "../update";
import Pay from "../pay";


const ImageWithFallback = (props) => {
    const { src, fallbackSrc, ...rest } = props;
    const [imgSrc, setImgSrc] = useState(src);

    const handleError = () => {
        setImgSrc(fallbackSrc);
    };

    return (
        <Image
            {...rest}
            src={imgSrc}
            onError={handleError}
        />
    );
};

export function Li_l({ data, dataArea, ReLoadData }) {
    const initialSrc = data.Avt ? srcImage(data.Avt) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const fallbackSrc = 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'

    return (
        <div>
            <div className={styles.list_li_l_w} style={{ display: 'flex', padding: 8, borderBottom: 'thin solid var(--border-color)' }}>
                <div className={styles.list_li_l_hover} style={{ flex: 5, display: 'flex', cursor: 'pointer' }}>
                    <div style={{ flex: 2, display: 'flex', gap: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}>
                            <Image
                                src={initialSrc}
                                width={40}
                                height={40}
                                alt={`avt của ${data.Name}`}
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div>
                            <p className="text_4_m">{data.ID}</p>
                            <p className="text_4_m">{data.Name}</p>
                        </div>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex_col">
                        <p className="text_5_500">Khu vực:</p>
                        <p className="text_4_m">{data.Area ? data.Area.name : '-'}</p>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex_col">
                        <p className="text_5_500">Liên hệ:</p>
                        <p className="text_4_m">{data.Phone ? data.Phone : '-'}</p>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex_col">
                        <p className="text_5_500">Nợ học phí:</p>
                        <p className="text_4_m">-</p>
                    </div>
                </div>
                <div style={{ flex: 1, gap: 2, borderLeft: 'thin solid var(--border-color)' }} className="flex_center">
                    <Update data={data} data_area={dataArea} reloadData={ReLoadData} />
                    <Pay data={data} />
                </div>
            </div>
        </div>
    )
}

export function Li_g({ data, handleUserClick, handleEditRole, handleOpenReport, open_noti }) {
    const initialSrc = data.Avt ? srcImage(data.Avt) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const fallbackSrc = 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'

    return (
        <div
            style={{
                border: "1px solid #ddd",
                borderRadius: 3,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 145,
                background: "#f9f9f9",
            }}
        >
            {/* Phần thông tin người dùng */}
            <Link href={`/${data._id}`}>
                <div style={{ display: "flex", gap: "8px", padding: "16px", alignItems: "center", cursor: 'pointer' }}>
                    {/* Sử dụng lại component ImageWithFallback */}
                    <ImageWithFallback
                        src={initialSrc}
                        fallbackSrc={fallbackSrc}
                        alt="Avatar"
                        width={50}
                        height={50}
                        style={{ borderRadius: "50%", objectFit: 'cover' }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
                        <h3 style={{ fontSize: "16px", color: "#333", textAlign: "start", margin: 0 }}>
                            {data.Name}
                        </h3>
                    </div>
                </div>
            </Link>

            {/* Phần các nút thao tác */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#fff",
                    padding: "5px 16px",
                    borderTop: "1px solid #ddd",
                }}
            >
                {/* Các nút bấm giữ nguyên */}
                <button title="Thông tin" onClick={() => handleUserClick(data)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, }}>
                    <svg style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24"><path fill="currentColor" d="M11,9H13V7H11M12,20A8,8 0 1,1 20,12A8,8 0 0,1 12,20M11,17H13V11H11V17Z" /></svg>
                </button>
                <button title="Chỉnh sửa" onClick={() => handleEditRole(data)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, }}>
                    <svg style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24"><path fill="currentColor" d="M14.06,3.44L13.34,4.16L15.84,6.66L16.56,5.94C16.95,5.55,16.95,4.92,16.56,4.53L15.47,3.44C15.08,3.05,14.45,3.05,14.06,3.44M5,17.25V21H8.75L19.81,9.94L16.06,6.19L5,17.25Z" /></svg>
                </button>
                <button title="Báo cáo" onClick={() => handleOpenReport(data._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, }}>
                    <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24"><path fill="currentColor" d="M11 2v20c-5 0-7-2-7-7h20c0 5-2 7-7 7V2z" /></svg>
                </button>
                <button title="Thông báo" onClick={() => open_noti(data._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, }}>
                    <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24"><path fill="currentColor" d="M12,22A2,2 0 0,0 14,20H10A2,2 0 0,0 12,22M18,16V11.5C18,8.46,16.36,5.9,13.5,5.18V4A1.5,1.5 0 0,0 12,2.5A1.5,1.5 0 0,0 10.5,4V5.18C7.64,5.9,6,8.46,6,11.5V16L4,18V19H20V18L18,16Z" /></svg>
                </button>
            </div>
        </div>
    )
}