'use client';

import Input from "@/components/(input)/input";

export default function Create() {
    return (
        <div className="flex_col" style={{ height: '100vh' }}>
            <div style={{ padding: 16, borderBottom: ' thin solid var(--border-color)' }}>
                <p className="text_4">Thêm học sinh mới</p>
            </div>
            <div style={{ padding: 16, flex: 1 }} className="scroll">
                <Input />
            </div>
        </div>
    );
}
