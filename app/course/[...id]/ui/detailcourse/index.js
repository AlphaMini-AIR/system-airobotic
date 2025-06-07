
import DetailStudent from '../detatilstudent';
import styles from './index.module.css';
import Student from '../student';
import Calendar from '../calendarcourse';
import Image from 'next/image';
import { Svg_Area, Svg_Canlendar, Svg_Profile, Svg_Student } from '@/components/svg';
import AnnounceStudent from '../bell';

export default function Detail({ data, params, book, users, studentsx }) {
    const today = new Date();
    const currentHour = today.getHours();

    const calculateCourseProgress = (data, today, currentHour) => {
        let done = 0;
        let total = 0;

        if (!data || !Array.isArray(data.Detail)) {
            return { lessonsDone: 0, totalLessons: 0, percent: 0 };
        }

        const details = data.Detail;
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        details.forEach((lesson) => {
            if (!lesson || typeof lesson.Lesson !== 'number' || typeof lesson.Day !== 'string') { return }

            total += lesson.Lesson;

            let lessonDate;
            // Xử lý định dạng ngày "dd/mm/yyyy"
            if (lesson.Day.includes('/')) {
                const parts = lesson.Day.split('/');
                if (parts.length !== 3) return;
                const [dd, mm, yyyy] = parts;
                lessonDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
            }
            // Xử lý định dạng ngày "yyyy-mm-dd"
            else if (lesson.Day.includes('-')) {
                lessonDate = new Date(`${lesson.Day}T00:00:00`);
            }
            // Nếu định dạng không được hỗ trợ, bỏ qua
            else {
                return;
            }

            // Bỏ qua nếu ngày tháng không hợp lệ sau khi parse
            if (isNaN(lessonDate.getTime())) {
                return;
            }

            // So sánh ngày
            if (todayStart > lessonDate) {
                // Nếu ngày hôm nay đã qua ngày học -> đã học
                done += lesson.Lesson;
            } else if (todayStart.getTime() === lessonDate.getTime()) {
                // Nếu học trong ngày hôm nay, kiểm tra thêm giờ
                if (typeof lesson.Time === 'string' && lesson.Time.includes(':')) {
                    const hourStart = parseInt(lesson.Time.split(':')[0], 10);
                    if (!isNaN(hourStart) && hourStart < currentHour) {
                        done += lesson.Lesson;
                    }
                }
            }
        });

        return {
            lessonsDone: done,
            totalLessons: total,
            percent: total > 0 ? Math.round((done / total) * 100) : 0,
        };
    };
    let td = calculateCourseProgress(data, today, currentHour)

    const students = enrichStudents(data);
    const detailcourse = (
        <> {students.map(stu => (
            <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                {title.map(col =>
                    col.data === 'More' ? (
                        <Cell key="more" flex={col.flex} align={col.align}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                <span className="wrapicon" style={{ background: 'var(--main_d)' }}>
                                    <svg viewBox="0 0 448 512" width="14" height="14" fill="white">   <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" /></svg>
                                </span>
                                <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                            </div>
                        </Cell>
                    ) : (<Cell key={col.data} flex={col.flex} align={col.align}>  {stu[col.data]} </Cell>)
                )}
            </div>
        ))} </>
    )
    const detaillesson = (
        <> {data.Student.map(stu => (
            <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                {title.map(col => {
                    let m = stu.Learn[params[1] ? params[1] : '']?.Checkin == '1' ? 1 : 0;
                    let c = stu.Learn[params[1] ? params[1] : '']?.Checkin == '3' ? 1 : 0;
                    let k = stu.Learn[params[1] ? params[1] : '']?.Checkin == '2' ? 1 : 0;
                    stu.m = m;
                    stu.c = c;
                    stu.k = k;
                    if (params.length > 1 && col.data === 'b') return null;
                    return (
                        col.data === 'More' ?
                            <Cell key="more" flex={col.flex} align={col.align}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                    <span className="wrapicon" style={{ background: 'var(--main_d)' }}>
                                        <svg viewBox="0 0 448 512" width="14" height="14" fill="white">   <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" /></svg>
                                    </span>
                                </div>
                            </Cell>
                            : <Cell key={col.data} flex={col.flex} align={col.align}>{stu[col.data]}</Cell>
                    )
                })}
            </div>
        ))} </>
    )

    return (
        <div className={styles.container}>
            <div className={styles.box} style={{ padding: 16, gap: 16 }}>
                <div className={styles.ImageBook}>
                    <Image priority={true} src={book.Image} fill alt={book.Name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </div>
                <div style={{ flex: 1 }}>
                    <p className="text_4" style={{ marginBottom: 8 }}>Thông tin khóa học</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='var(--text-primary)'><path d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5l0-377.4c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8L0 454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5l0-370.3c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11L304 456c0 11.4 11.7 19.3 22.4 15.5z" /></svg>
                            <span className='text_6'>Chương trình học :</span>
                            <span className="text_6_400">{book.Name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" /></svg>
                            <span className='text_6'>Tên khóa học :</span>
                            <span className="text_6_400">{data.ID}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Svg_Student w={15} h={15} c='var(--text-primary)' />
                            <span className='text_6'>Sỉ số khóa :</span>
                            <span className="text_6_400">{data.Student.length} học sinh</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                            <span className='text_6'>Thời gian học :</span>
                            <span className="text_6_400">{data.TimeStart} - {data.TimeEnd}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                            <span className='text_6'>Giáo viên chủ nhiệm :</span>
                            <span className="text_6_400">{data.TeacherHR}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Svg_Area w={14} h={14} c='var(--text-primary)' />
                            <span className='text_6'>Khu vực :</span>
                            <span className="text_6_400">{data.Area}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                <path d="M0 24C0 10.7 10.7 0 24 0L360 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 19c0 40.3-16 79-44.5 107.5L225.9 256l81.5 81.5C336 366 352 404.7 352 445l0 19 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24l8 0 0-19c0-40.3 16-79 44.5-107.5L158.1 256 76.5 174.5C48 146 32 107.3 32 67l0-19-8 0C10.7 48 0 37.3 0 24zM110.5 371.5c-3.9 3.9-7.5 8.1-10.7 12.5l184.4 0c-3.2-4.4-6.8-8.6-10.7-12.5L192 289.9l-81.5 81.5zM284.2 128C297 110.4 304 89 304 67l0-19L80 48l0 19c0 22.1 7 43.4 19.8 61l184.4 0z" /></svg>
                            <span className='text_6'>Tiến độ :</span>
                            <span className="text_6_400">{td.lessonsDone}/{td.totalLessons} Tiết</span>
                        </div>
                        <div className='btn' style={{ marginTop: 8, borderRadius: 5, background: td.percent == 100 ? 'var(--main_d)' : 'var(--border-color)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={16} height={16} fill='white'>
                                <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                            </svg>
                            <p className='text_6_400' style={{ color: 'white' }}> Xác nhận hoàn thành</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', width: 180, gap: 8, flexWrap: 'wrap', height: 150 }}>
                    <div className={styles.Boxk}>
                        <Student course={data} student={students} />
                    </div>
                    <div className={styles.Boxk}>
                        <Calendar course={data} student={students} />
                    </div>
                    <div className={styles.Boxk}>
                        <AnnounceStudent course={data} />
                    </div>
                    <div className={styles.Boxk}>

                    </div>
                </div>
            </div>
            <div className={styles.box}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ padding: 16, display: 'flex' }}>
                        <div className='text_4'>Thông tin học sinh</div>
                    </div>
                    <div style={{ display: 'flex', background: 'var(--border-color)' }}>
                        {title.map((e, i) => {
                            if (params.length > 1 && e.content === 'Buổi bù') return;
                            return (
                                <div key={i} className="text_6_400" style={{ flex: e.flex, padding: '8px 16px', fontWeight: '500', display: 'flex', justifyContent: e.align }}>
                                    {e.content}
                                </div>
                            )
                        })}
                    </div>
                    {params.length > 1 ? detaillesson : detailcourse}
                </div>
            </div>
        </div>
    )
}

const title = [
    { content: 'ID', flex: 0.5, data: 'ID', align: 'start' },
    { content: 'Họ và tên', flex: 1, data: 'Name', align: 'start' },
    { content: 'Có mặt', flex: 0.5, data: 'm', align: 'center' },
    { content: 'Không phép', flex: 0.5, data: 'k', align: 'center' },
    { content: 'Có phép', flex: 0.5, data: 'c', align: 'center' },
    { content: 'Buổi bù', flex: 0.5, data: 'b', align: 'center' },
    { content: 'Thêm', flex: .5, data: 'More', align: 'center' },
]

function enrichStudents(course, now = new Date()) {
    const pastLessonIds = new Set(
        course.Detail
            .filter(({ Day }) => parseDMY(Day) <= now)
            .map(({ ID }) => ID)
    );
    const totalPastLessons = pastLessonIds.size;
    return course.Student.map(stu => {
        const counts = [0, 0, 0, 0];
        for (const [lessonId, { Checkin }] of Object.entries(stu.Learn)) {
            if (!pastLessonIds.has(lessonId)) continue;
            const idx = Number(Checkin);
            if (idx >= 0 && idx <= 3) counts[idx] += 1;
        }
        const [f, m, k, c] = counts;
        let b = (totalPastLessons - m) - k;
        if (b > 2) b = 2;
        else if (b < 0) b = 0;
        return { ...stu, m, k, c, b };
    });
}

function parseDMY(dmy) {
    const [d, m, y] = dmy.split('/').map(Number);
    return new Date(y, m - 1, d);
}

const Cell = ({ flex, align, children }) => (
    <div style={{ flex, padding: '8px 16px', display: 'flex', justifyContent: align }} className="text_6_400" > {children} </div>
);
