"use client";

import Image from "next/image";
import styles from './index.module.css'
import { srcImage } from "@/function";
import Update from "../update";
import Pay from "../pay";
import Out from "../out";

export function Li_l({ data, dataArea, ReLoadData }) {
    const initialSrc = data.Avt ? srcImage(data.Avt) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const status = data.Status[data.Status.length - 1].status;

    return (
        <div>
            <div className={styles.list_li_l_w} style={{
                display: 'flex', padding: 8, borderBottom: 'thin solid var(--border-color)',
                background: status === 0 ? '#ffebed' : status === 1 ? '#fff9e7' : 'transparent'
            }}>
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
                <div style={{ flex: 1, gap: 5, borderLeft: 'thin solid var(--border-color)' }} className="flex_center">
                    <Update data={data} data_area={dataArea} reloadData={ReLoadData} />
                    <Pay data={data} />
                    {status !== 0 && (
                        <Out data={data} />
                    )}

                </div>
            </div>
        </div>
    )
}
