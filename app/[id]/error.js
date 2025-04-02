// app/[id]/error.js
"use client";

import { useEffect } from "react";

export default function ErrorUserPage({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{ padding: 16 }}>
            <h2>Đã có lỗi xảy ra khi tải trang người dùng</h2>
            <button onClick={() => reset()}>Thử lại</button>
        </div>
    );
}
