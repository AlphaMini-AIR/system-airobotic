import React from 'react';
import styles from './index.module.css';

function Nav({ status, icon, title, sl }) {
    return (
        <div className={`${styles.navContainer} ${status ? styles.active : styles.inactive}`}>
            <div className={styles.leftContent}>
                <div className='text_2' style={{ color: status ? 'white' : '' }}>{sl}</div>
                <div className='text_4_m' style={{ color: status ? 'white' : '' }}>{title}</div>
            </div>
            <div className={styles.iconWrapper}>{icon}</div>
        </div>
    );
}

export default React.memo(Nav);
