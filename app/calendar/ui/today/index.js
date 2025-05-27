import styles from './index.module.css'

export default function Today({ month, year }) {
    return (
        <div className={styles.title}>
            <span className={styles.breadcrumb}>Ngày hôm nay </span>
            <h3 className={styles.dateTitle}>Ngày 12</h3>
        </div>
    );
}