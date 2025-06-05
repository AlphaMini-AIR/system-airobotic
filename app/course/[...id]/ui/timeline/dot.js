import Link from 'next/link';
import styles from './index.module.css';

export default function TimeLine_Dot({ course, type, index, data, props }) {
    let id = data.ID
    if (data.Student) id += '-' + formatDate(data.Day)
    return (
        <Link href={`/course/${course}/${id}`}>
            <div style={{ display: 'flex', padding: '20px 0', position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                {type == 'end' ? null : type == 'main' ?
                    <div style={{ position: 'absolute', left: 18.5, top: '50%', height: '100%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div> :
                    <div style={{ position: 'absolute', left: 18.5, top: '0', height: '200%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <div className={styles.dotnumber} >{index + 1}</div>
                    <div style={{ flex: 1 }}>
                        <div className="text_4" style={{ display: 'flex', color: props == id ? 'var(--main_d)' : 'var(--text-primary)' }}>{data.Topic}
                            {data.Student ? <p className="Chip text_4_m" style={{ background: '#bd3636', color: 'white', marginLeft: 8 }}>Buổi bù</p> : null}
                        </div>
                        <div className='text_6_400' style={{ color: props == id ? 'var(--main_d)' : 'var(--text-primary)' }}>Ngày {data.Day}</div>
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