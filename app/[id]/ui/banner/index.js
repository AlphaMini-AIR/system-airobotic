"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import air from "./index.module.css";
import Update from "@/app/student/list/ui/update";

export default function Banner({ data, area }) {
    const pathname = usePathname();

    let position = [0, ""];
    if (data?.Course) {
        const keys = Object.keys(data.Course);
        const lastKey = keys[keys.length - 1];
        position[1] = lastKey;
    }
    const avt = data.Avt ? `https://lh3.googleusercontent.com/d/${data?.Avt}` : "https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG";

    return (
        <div className={air.wrap}>
            <div style={{ display: "flex", gap: 16, padding: 16 }}>
                <Image
                    src={avt}
                    width={65}
                    height={65}
                    style={{ objectFit: "cover", borderRadius: 3 }}
                    alt="avatar"
                    priority
                />
                <div style={{ alignContent: "center", flex: 1 }}>
                    <p className={air.position}>ID: {data.ID}</p>
                    <div style={{ display: 'flex',alignItems: 'center', gap: 8 }}>
                        <p className={air.name}>{data?.Name}</p>
                        <Update data={data} data_area={area} />
                    </div>
                    <p className={air.position}>Trạng thái học: {data.Status[data.Status.length - 1].status == 2 ? "Đang học" : data.Status[data.Status.length - 1].status == 1 ? "Chờ lên khóa" : "Đã nghỉ"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    marginTop: 3,
                    borderTop: "thin solid var(--border-color)",
                    padding: "0 16px",
                }}
            >
                <Link
                    href={`/${data?._id}`}
                    className={`${air.nav} ${pathname === `/${data?._id}` ? air.ac : ""
                        }`}
                >
                    Tổng quan
                </Link>

                <Link
                    href={`/${data?._id}/courses`}
                    className={`${air.nav} ${pathname.startsWith(`/${data?._id}/courses`) ? air.ac : ""
                        }`}
                >
                    Khóa học
                </Link>
            </div>
        </div>
    );
}
