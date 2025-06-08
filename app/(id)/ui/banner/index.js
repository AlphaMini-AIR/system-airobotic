"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation"; // Import hook để lấy path hiện tại
import AnimatedButton from "@/components/(button)/button";
import { Svg_Pen } from "@/components/svg";
import air from "./index.module.css";

export default function Banner({ data }) {
    const pathname = usePathname(); // Lấy đường dẫn hiện tại

    let position = [0, ""];
    if (data?.Course) {
        const keys = Object.keys(data.Course);
        const lastKey = keys[keys.length - 1];
        position[1] = lastKey;
    }

    return (
        <div className={air.wrap}>
            <div style={{ display: "flex", gap: 16, padding: 16 }}>
                <Image
                    src={data?.Avt || "/default-avatar.jpg"}
                    width={65}
                    height={65}
                    style={{ objectFit: "cover", borderRadius: 3 }}
                    alt="avatar"
                    priority // Ưu tiên load ảnh user
                />
                <div style={{ alignContent: "center", flex: 1 }}>
                    <p className={air.position}>ID: {data.ID}</p>
                    <p className={air.name}>{data?.Name}</p>
                    <p className={air.position}>
                        {position[0] === 0
                            ? `Học sinh khóa ${position[1]}`
                            : "Giáo viên"}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                    <AnimatedButton>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Svg_Pen w={18} h={18} c={"white"} />
                            <p style={{ fontSize: 14, fontWeight: 400 }}>
                                Cập nhật thông tin
                            </p>
                        </div>
                    </AnimatedButton>
                </div>
            </div>

            {/* Thanh điều hướng tab */}
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

                {/* Link tới tab Khóa học */}
                <Link
                    href={`/${data?._id}/courses`}
                    className={`${air.nav} ${
                        // Sử dụng startsWith để active cho các đường dẫn con của courses nếu có
                        pathname.startsWith(`/${data?._id}/courses`) ? air.ac : ""
                        }`}
                >
                    Khóa học
                </Link>
            </div>
        </div>
    );
}
