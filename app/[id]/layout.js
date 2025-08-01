import Banner from "./ui/banner";
import { formatDate } from "@/function";
import { area_data, student_data } from "@/data/actions/get";

export default async function UserLayout({ children, params }) {
    const { id } = await params;
    const data = await student_data(id)
    if (!data) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 125, height: 125, background: 'url(https://www.voca.vn/assets/images/library/library-workplace.svg)', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}></div>
                <p className="text_4_400">Không tìm thấy thông tin học sinh.</p>
            </div>
        )
    }
    const area = await area_data();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Banner data={data} area={area} />
            <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                        border: 'thin solid var(--border-color)', borderRadius: 8, padding: 16,
                        background: 'var(--bg-primary)', height: 'max-content'
                    }}>
                        <p style={{ paddingBottom: 8, borderBottom: 'thin solid var(--border-color)' }}
                            className="text_4">Thông tin cá nhân</p>
                        <div style={{ padding: '8px 0', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p style={{ color: data.DB ? 'var(--text-primary)' : 'var(--red)' }} >Ngày sinh: {data.BD ? formatDate(new Date(data.BD)) : 'Thiếu thông tin'}</p>
                            <p style={{ color: data.School ? 'var(--text-primary)' : 'var(--red)' }} >Trường học: {data.School || 'Thiếu thông tin'}</p>
                            <p style={{ color: data.Area ? 'var(--text-primary)' : 'var(--red)' }} >Khu vực: {data.Area.name || 'Thiếu thông tin'}</p>
                            <p style={{ color: data.Address ? 'var(--text-primary)' : 'var(--red)' }} >Địa chỉ: {data.Address || 'Thiếu thông tin'}</p>
                            <p style={{ color: data.ParentName ? 'var(--text-primary)' : 'var(--red)' }} >Phụ huynh: {data.ParentName || 'Thiếu thông tin'}</p>
                            <p style={{ color: data.Phone ? 'var(--text-primary)' : 'var(--red)' }} >Liên hệ: {data.Phone || 'Thiếu thông tin'}</p>
                            <p style={{ color: data.Email ? 'var(--text-primary)' : 'var(--red)' }} >Email: {data.Email || 'Thiếu thông tin'}</p>
                        </div>
                    </div>
                    <div style={{
                        border: 'thin solid var(--border-color)', borderRadius: 8, padding: 16,
                        background: 'var(--bg-primary)', height: 'max-content'
                    }}>
                        <p style={{ paddingBottom: 8, borderBottom: 'thin solid var(--border-color)' }}
                            className="text_4">Thông tin khóa học</p>
                        <div style={{ padding: '8px 0', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <p>Tổng số khóa tham gia: {data?.Course.length || 0}</p>
                            <p>Tổng số khóa hoàn thành: {data?.Course.filter(course => course.enrollmentStatus === 2).length || 0}</p>
                            <p>Tổng số khóa đang diễn ra: {data?.Course.filter(course => course.enrollmentStatus === 0).length || 0}</p>
                            <p>Tổng số khóa bảo lưu: {data?.Course.filter(course => course.enrollmentStatus === 1).length || 0}</p>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 3, height: '100%', overflow: 'hidden', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
