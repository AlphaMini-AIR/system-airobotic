import { Re_book } from '@/data/book';
import styles from './index.module.css';
import Image from 'next/image';

const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const ProgramCard = ({ program }) => {

    const topicCount = Object.keys(program.Topic || {}).length;
    return (
        <div className={styles.card}>
            {/* Phần 1: Ảnh (chiếm 1/3) */}
            <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                    <Image src={`${program.Image}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={program.Name} />
                </div>
            </div>

            {/* Phần 2: Thông tin (chiếm 2/3) */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <p className='text_3'>{program.Name}</p>
                    {/* <span className={`${styles.badge} text_7`}>{program.Type}</span> */}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className='text_6'>Mã chương trình: <span style={{ fontWeight: 400 }}>{program.ID}</span></p>
                    <p className='text_6'>Số chủ đề: <span style={{ fontWeight: 400 }}>{topicCount} chủ đề</span></p>
                    <p className='text_6'>Số tiết học: <span style={{ fontWeight: 400 }}>{program.TotalLesson} tiết</span></p>
                    <p className='text_6'>Giá khóa học: <span style={{ fontWeight: 400 }}>{formatPrice(program.Price)}</span></p>
                </div>
            </div>
        </div>
    );
};

const ProgramList = ({ programs }) => {
    if (!programs || programs.length === 0) {
        return <div>Không có chương trình nào để hiển thị.</div>;
    }

    return (
        <div className={styles.container}>
            {programs.map(program => (
                <ProgramCard key={program._id} program={program} />
            ))}
        </div>
    );
};

export default ProgramList;