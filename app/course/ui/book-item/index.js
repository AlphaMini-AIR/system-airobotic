import styles from './index.module.css';
import Image from 'next/image';
import Link from 'next/link';

const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const ProgramCard = ({ program }) => {
    const topicCount = Object.keys(program.Topics || {}).length
    const url = program.Image.split('/').length == 5 ? program.Image : `https://lh3.googleusercontent.com/d/${program.Image}`;

    return (
        <Link href={`/course/book/${program._id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                    <Image src={url} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={program.Name} />
                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <p className='text_3'>{program.Name}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className='text_6'>Mã chương trình: <span style={{ fontWeight: 400 }}>{program.ID}</span></p>
                    <p className='text_6'>Số chủ đề: <span style={{ fontWeight: 400 }}>{topicCount} chủ đề</span></p>
                    <p className='text_6'>Số tiết học: <span style={{ fontWeight: 400 }}>{program.Topics?.reduce((total, item) => total + (item.Period || 0), 0) || 0} tiết</span></p>
                    <p className='text_6'>Giá khóa học: <span style={{ fontWeight: 400 }}>{formatPrice(program.Price)}</span></p>
                </div>
            </div>
        </Link>
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