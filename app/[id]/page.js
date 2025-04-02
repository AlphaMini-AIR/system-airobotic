import { Read_Student_One } from "@/data/data_student";
import Profile from "./ui/profile";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await Read_Student_One(id)

    return (
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
            <div style={{
                border: 'thin solid var(--border-color)', width: '25%', borderRadius: 8, padding: 16,
                background: 'var(--bg-secondary)', height: 'max-content'
            }}>
                <p style={{ paddingBottom: 8, borderBottom: 'thin solid var(--border-color)' }}
                    className="text_4">Thông tin cá nhân</p>
                <div style={{ padding: '8px 0', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p>Ngày sinh: {data.BD}</p>
                    <p>Trường học: {data.School || 'Trống'}</p>
                    <p>Khu vực: {data.Area}</p>
                    <p>Địa chỉ: {data.Address}</p>
                    <p>Phụ huynh: {data.ParentName || 'Trống'}</p>
                    <p>Liên hệ: {data.Phone || 'Trống'}</p>
                    <p>Email: {data.Email || 'Trống'}</p>
                </div>
            </div>
            <div style={{ flex: 1, height: '100%', overflow: 'hidden', overflowY: 'auto' }}>
                <Profile data={data} />
            </div>
        </div>
    );
}
