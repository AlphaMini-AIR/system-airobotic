import styles from './index.module.css';

export default function Calendar({ data }) {
    const stt = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return (
        <>

            <div className={styles.mainContainer}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p className={`text_6 ${styles.box}`}>Buổi sáng</p>
                    <p className={`text_6 ${styles.box}`}>Buổi chiều</p>
                    <p className={`text_6 ${styles.box}`}>Buổi tối</p>
                    <p className={`text_6 ${styles.box}`}></p>
                </div>
                {stt.map((day, index) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }} key={index}>
                        <p className={`text_6_400 ${styles.box}`} style={{ justifyContent: 'center' }}>-</p>
                        <p className={`text_6_400 ${styles.box}`} style={{ justifyContent: 'center' }}>-</p>
                        <p className={`text_6_400 ${styles.box}`} style={{ justifyContent: 'center' }}>-</p>
                        <p className={`text_6 ${styles.box}`} style={{ justifyContent: 'center' }}>{day}</p>
                    </div>
                ))}

            </div>
        </>
    );
}   