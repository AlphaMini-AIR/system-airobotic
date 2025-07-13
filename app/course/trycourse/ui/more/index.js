import { Svg_ArowRight, Svg_Left } from '@/components/(icon)/svg';
import styles from './index.module.css';
import Add from '../add';

export default function MainAll({ data, book, student, teacher, area }) {
    return (
        <div className={styles.mainContainer}>
            <div className={styles.filleft}>
                <div className={styles.modeToggle}>
                    <button className={`${styles.modeButton} ${styles.active}`}>Tất cả</button>
                    <button className={`${styles.modeButton}`}>Theo tuần</button>
                </div>
                <div className={styles.modeToggle}>
                    <button className={`${styles.modeButton} ${styles.active}`} style={{ alignItems: 'center', display: 'flex' }}>
                        <Svg_Left w={16} h={16} c={'var(--text-primary)'} />
                    </button>
                    <button className={`${styles.modeButton}`}>10/04/2004 - 20/04/2004</button>
                    <button className={`${styles.modeButton} ${styles.active}`} style={{ alignItems: 'center', display: 'flex' }}>
                        <Svg_ArowRight w={16} h={16} c={'var(--text-primary)'} />
                    </button>
                </div>
            </div>
            <Add data={data} book={book} student={student} teacher={teacher} area={area} />
        </div>
    );
}