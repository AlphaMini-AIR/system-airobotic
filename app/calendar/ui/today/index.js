'user sever';

import CalendarCourse from '../lesson_td';
import styles from './index.module.css'

export default function Today({ data, today, month, year }) {
    
    return (
        <div style={{ borderRight: '1px solid var(--border-color)', width: '100%', height: '100%', overflow: 'auto' }}>
            <div className={styles.title} >
                <p className='text_4_400' style={{ marginBottom: 8, color: 'white' }}>Ngày hôm nay </p>
                <p className='text_2' style={{ color: 'white' }}>Ngày {today} tháng {month} năm {year}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
                <div className='text_4' style={{ color: 'var(--main_d)' }}>Lịch dạy hôm nay</div>
                <div style={{ height: '2px', backgroundColor: 'var(--main_d)', flex: 1, marginTop: '2px' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.length === 0 ?
                    <p style={{
                        padding: 32,
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                    }}>Không có lịch dạy</p> :
                    <> {data.map((course, index) => {
                        return <CalendarCourse key={index} data={course} />
                    })}
                    </>
                }
            </div>
        </div >
    );
}