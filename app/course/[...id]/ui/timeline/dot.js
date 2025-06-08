import Link from 'next/link';
import styles from './index.module.css';

// 1. Hàm mới để xác định trạng thái dựa trên dữ liệu
// Đặt hàm này bên ngoài component để tránh việc khai báo lại mỗi lần render
const getEventStatus = (data) => {
    // Ưu tiên các loại đặc biệt trước
    if (data.Type === 'Học bù') {
        return { text: 'Học bù', color: 'var(--yellow)' }; // Màu xanh dương
    }
    if (data.Type === 'Báo nghỉ') {
        return { text: 'Báo nghỉ', color: 'var(--red)' }; // Màu đỏ
    }

    // Nếu không phải loại đặc biệt, xét theo ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh chỉ dựa trên ngày

    const [day, month, year] = data.Day.split('/');
    const eventDate = new Date(year, month - 1, day); // Tháng trong JS là 0-11

    if (eventDate < today) {
        return { text: 'Đã diễn ra', color: 'var(--green)' }; // Màu xám
    } else {
        return { text: 'Chưa diễn ra', color: 'gray' }; // Màu xanh lá
    }
};


export default function TimeLine_Dot({ course, type, index, data, props }) {
    // console.log(data.Day);

    props = props[1] || '';
    let id = data.ID;
    if (data.Student) id += '-' + formatDate(data.Day);

    // 2. Gọi hàm để lấy đối tượng trạng thái
    const status = getEventStatus(data);

    return (
        <Link href={`/course/${course}/${id}`}>
            <div style={{ display: 'flex', padding: '16px 0', position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                {type == 'end' ? null : type == 'main' ?
                    <div style={{ position: 'absolute', left: 18.5, top: '50%', height: '100%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div> :
                    <div style={{ position: 'absolute', left: 18.5, top: '0', height: '200%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <div className={styles.dotnumber} >{index + 1}</div>
                    <div style={{ flex: 1 }}>
                        <p className="Chip text_7_400" style={{ background: status.color, color: 'white', marginBottom: 4, padding: '3px 8px', borderRadius: 12, width: 'max-content' }}>
                            {status.text}
                        </p>
                        <div className="text_4" style={{ display: 'flex', alignItems: 'center', color: props == id ? 'var(--main_d)' : 'var(--text-primary)' }}>
                            {data.Topic}

                        </div>
                        <div className='text_6_400'>Ngày {data.Day}</div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

function formatDate(dateStr) {
    let [day, month, year] = dateStr.split('/');
    return `${year}${month}${day}`;
}