import Link from 'next/link';
import styles from './index.module.css';
import { formatDate } from '@/function';

const getEventStatus = (data) => {
    if (data.Type === 'Học bù') { return { text: 'Học bù', color: 'var(--yellow)' }; }
    if (data.Type === 'Báo nghỉ') { return { text: 'Báo nghỉ', color: 'var(--red)' }; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [day, month, year] = data.Day.split('/');
    const eventDate = new Date(year, month - 1, day);

    if (eventDate < today) {
        return { text: 'Đã diễn ra', color: 'var(--green)' };
    } else {
        return { text: 'Chưa diễn ra', color: 'gray' };
    }
};


export default function TimeLine_Dot({ course, type, index, data, props }) {
    props = props[1] || '';
    let id = data._id;
    
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
                        <div className='text_6_400'>Ngày {formatDate(new Date(data.Day))}</div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
