// THÊM MỚI: Chuyển đổi thành Client Component và import hooks cần thiết
"use client";
import { useState, useMemo } from 'react';
import ResponsiveGrid from '@/components/(ui)/grid';
import DetailStudent from '../detatilstudent';
import styles from './index.module.css';
import Student from '../student';
import Calendar from '../calendarcourse';
import Image from 'next/image';
import { Svg_Area, Svg_Canlendar, Svg_Course, Svg_Map, Svg_Profile, Svg_Student } from '@/components/(icon)/svg';
import AnnounceStudent from '../bell';
import Report from '../Report';
import { Re_course_one } from '@/data/course';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import CommentPopup from '../cmt';
import { formatDate } from '@/function';
import ImageComponent from '@/components/(ui)/(image)';

const SortIcon = ({ direction }) => {
    if (!direction) {
        return <span style={{ width: 16, display: 'inline-block' }}>↕️</span>;
    }
    return direction === 'ascending' ? <span style={{ width: 16, display: 'inline-block' }}>🔼</span> : <span style={{ width: 16, display: 'inline-block' }}>🔽</span>;
};


export default function Detail({ data = [], params, book, users, studentsx }) {
    let allImages = []
    if (params.length > 1) {
        allImages = data.Detail?.filter((t) => t._id == params[1])[0]?.DetailImage || [];
    } else {
        allImages = data.Detail?.flatMap(lesson => lesson.DetailImage || []);
    }


    const images = allImages?.filter(item => item.type === 'image');
    const videos = allImages?.filter(item => item.type === 'video');

    const lessProductItems = images?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));
    const lessProductVideos = videos?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));

    const listColumnsConfig = { mobile: 2, tablet: 4, desktop: 5 };


    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const today = new Date();
    const currentHour = today.getHours();

    // THÊM MỚI: State để quản lý trạng thái sắp xếp
    const [sortConfig, setSortConfig] = useState({ key: 'Name', direction: 'ascending' });

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
            if (lesson.Day.includes('/')) {
                const parts = lesson.Day.split('/');
                if (parts.length !== 3) return;
                const [dd, mm, yyyy] = parts;
                lessonDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
            }
            else if (lesson.Day.includes('-')) {
                lessonDate = new Date(`${lesson.Day}T00:00:00`);
            }
            else {
                return;
            }

            if (isNaN(lessonDate.getTime())) {
                return;
            }

            if (todayStart > lessonDate) {
                done += lesson.Lesson;
            } else if (todayStart.getTime() === lessonDate.getTime()) {
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

    // CHỈNH SỬA: Sử dụng useMemo để sắp xếp danh sách học sinh
    const sortedStudents = useMemo(() => {
        const enrichedStudents = enrichStudents(data);

        if (sortConfig.key !== null) {
            const sorted = [...enrichedStudents].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
            return sorted;
        }
        return enrichedStudents;
    }, [data, sortConfig]);

    const allDates = data.Detail.map(item => new Date(item.Day));
    const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];

    const handleSort = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const detailcourse = (
        <> {sortedStudents.map(stu => (
            <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                {title.map(col =>
                    col.data === 'More' ? (
                        <Cell key="more" flex={col.flex} align={col.align}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                <span className="wrapicon" style={{ background: 'var(--main_d)' }}>
                                    <svg viewBox="0 0 448 512" width="14" height="14" fill="white">  <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" /></svg>
                                </span>
                                <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                            </div>
                        </Cell>
                    ) : (<Cell key={col.data} flex={col.flex} align={col.align}> {stu[col.data]} </Cell>)
                )}
            </div>
        ))} </>
    )

    const detaillesson = (
        <> {data.Student.map(stu => {
            if (!params[1]) return null;
            return (
                <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                    {title.map(col => {
                        let learnDetailsArray = Object.values(stu.Learn || {});
                        learnDetailsArray = learnDetailsArray.filter(ld => ld.Lesson.toString() === params[1].toString())[0]
                        if (learnDetailsArray === undefined) {
                            return null;
                        }
                        let m = learnDetailsArray?.Checkin == '1' ? 1 : 0;
                        let c = learnDetailsArray?.Checkin == '3' ? 1 : 0;
                        let k = learnDetailsArray?.Checkin == '2' ? 1 : 0;
                        let cmt = learnDetailsArray?.Cmt || [];
                        let cmtfn = learnDetailsArray?.CmtFn || '';
                        stu.course = data.ID;
                        stu.lesson = data.Detail.find(lesson => lesson._id === params[1]);
                        stu.m = m;
                        stu.c = c;
                        stu.k = k;
                        stu.cmt = cmt;
                        stu.cmtfn = cmtfn;

                        if (params.length > 1 && col.data === 'b') return null;
                        return (
                            col.data === 'More' ?
                                <Cell key="more" flex={col.flex} align={col.align}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                        <CommentPopup data={stu} lesson={params[1]} course={data._id} />
                                        <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                                    </div>
                                </Cell>
                                : <Cell key={col.data} flex={col.flex} align={col.align}>{stu[col.data]}</Cell>
                        )
                    })}
                </div>
            )
        })} </>
    )
    const reload = async () => {
        setLoading(true);
        await Re_course_one(data.ID)
        router.refresh();
        setLoading(false);
    }
    let lesson;
    let statusLesson = [1, 1, 1];
    if (params.length > 1) {
        lesson = data.Detail.find(lesson => lesson._id === params[1]);
        lesson.Student = data.Student.flatMap((s) => {
            let g = s.Learn.filter(t => t.Lesson == lesson._id)
            return g
        })

        let num = 0
        lesson.Student.forEach(element => {
            if (element.Checkin == 0) { statusLesson[0] = 0 }
            if (element.Checkin == 1) {
                num++;
                if (element.Cmt.length == 0) {
                    statusLesson[1] = 0;
                }
                if (element.Image.length == 0) {
                    statusLesson[2] = 0;
                }
            }
        });
        if (num == 0) {
            statusLesson[1] = 0
            statusLesson[2] = 0
        }

    }

    return (
        <div className={styles.container}>
            <div className={styles.box} style={{ padding: 16, gap: 16 }}>
                <div className={styles.ImageBook}>
                    <Image priority={true} src={data.Book.Image} fill alt={data.Book.Name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </div>
                <div style={{ flex: 1 }}>
                    <p className="text_4" style={{ marginBottom: 8 }}>{params.length == 1 ? 'Thông tin khóa học' : `Thông tin buổi học (${lesson.Type || 'Chính thức'})`}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {params.length == 1 ?
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='var(--text-primary)'><path d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5l0-377.4c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8L0 454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5l0-370.3c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11L304 456c0 11.4 11.7 19.3 22.4 15.5z" /></svg>
                                    <span className='text_6'>Chương trình học :</span>
                                    <span className="text_6_400">{data.Book.Name}</span>
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
                                    <span className="text_6_400">{dateRange[0] || 'Trống'} - {dateRange[1] || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Giáo viên chủ nhiệm :</span>
                                    <span className="text_6_400">{data.TeacherHR.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Area w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Khu vực :</span>
                                    <span className="text_6_400">{data.Area.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                        <path d="M0 24C0 10.7 10.7 0 24 0L360 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 19c0 40.3-16 79-44.5 107.5L225.9 256l81.5 81.5C336 366 352 404.7 352 445l0 19 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24l8 0 0-19c0-40.3 16-79 44.5-107.5L158.1 256 76.5 174.5C48 146 32 107.3 32 67l0-19-8 0C10.7 48 0 37.3 0 24zM110.5 371.5c-3.9 3.9-7.5 8.1-10.7 12.5l184.4 0c-3.2-4.4-6.8-8.6-10.7-12.5L192 289.9l-81.5 81.5zM284.2 128C297 110.4 304 89 304 67l0-19L80 48l0 19c0 22.1 7 43.4 19.8 61l184.4 0z" /></svg>
                                    <span className='text_6'>Tiến độ :</span>
                                    <span className="text_6_400">{data.Progress} Tiết</span>
                                </div>
                            </> :
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Course w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Chủ đề học :</span>
                                    <span className="text_6_400">{lesson.LessonDetails.Name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Thời gian học :</span>
                                    <span className="text_6_400">{lesson.Time || 'Trống'} - {formatDate(new Date(lesson.Day)) || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Địa điểm học :</span>
                                    <span className="text_6_400"> {lesson.Room || 'Trống'} - {data.Area.name || 'Trống'}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text_6'>Trạng thái lớp học :</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <p className="Chip text_7_400" style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Điểm danh
                                    </p>
                                    <p className="Chip text_7_400" style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Nhận xét
                                    </p>
                                    <p className="Chip text_7_400" style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Minh chứng
                                    </p>
                                </div>
                            </>}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div className='btn' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }} onClick={reload}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='white'>
                                    <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" /></svg>
                                <p className='text_6_400' style={{ color: 'white' }}>Tải lại dữ liệu</p>
                            </div>
                            {params.length > 1 &&
                                <a href={`https://sys.airobotic.edu.vn/calendar/${params[1]}`} className='btn' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill='white'>
                                        <path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zM312 376c13.3 0 24-10.7 24-24s-10.7-24-24-24l-176 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l176 0z" /></svg>
                                    <p className='text_6_400' style={{ color: 'white' }}>Điểm danh bù</p>
                                </a>}
                            {params.length == 1 &&
                                <div className='btn' style={{ marginTop: 8, borderRadius: 5, background: td.percent == 100 ? 'var(--main_d)' : 'var(--border-color)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={16} height={16} fill='white'>
                                        <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                                    </svg>
                                    <p className='text_6_400' style={{ color: 'white' }}> Xác nhận hoàn thành</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', width: 180, gap: 8, flexWrap: 'wrap', height: 150 }}>
                    <div className={styles.Boxk}>
                        <Student course={data} student={sortedStudents} />
                    </div>
                    <div className={styles.Boxk}>
                        <Calendar course={data} student={sortedStudents} />
                    </div>
                    <div className={styles.Boxk}>
                        <AnnounceStudent course={data} />
                    </div>
                    <div className={styles.Boxk}>
                        <Report course={data} student={sortedStudents} />
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
                            if (params.length > 1 && e.content === 'Buổi bù') return null;
                            const isSortable = ['m', 'k', 'c', 'b'].includes(e.data);

                            return (
                                <div key={i} className="text_6_400" style={{ flex: e.flex, padding: '12px 8px', fontWeight: '500', display: 'flex', justifyContent: e.align, alignItems: 'center' }}>
                                    {isSortable ? (
                                        <button onClick={() => handleSort(e.data)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                                            {e.content}
                                            <SortIcon direction={sortConfig.key === e.data ? sortConfig.direction : null} />
                                        </button>
                                    ) : (
                                        e.content
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {params.length > 1 ? detaillesson : detailcourse}

                </div>
            </div>
            <div className={styles.box}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text_4'>Hình ảnh</p>
                    {images.length > 0 ? (
                        <ResponsiveGrid items={lessProductItems} columns={listColumnsConfig} type="list" />
                    ) : (
                        <div style={{ padding: 16, textAlign: 'center' }} className='text_6_400'>Không có hình ảnh nào.</div>
                    )}
                </div>
            </div>
            <div className={styles.box}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text_4'>Video thuyết trình</p>
                    {videos.length > 0 ? (
                        <ResponsiveGrid items={lessProductVideos} columns={listColumnsConfig} type="list" />
                    ) : (
                        <div style={{ padding: 16, textAlign: 'center' }} className='text_6_400'>Không có video nào.</div>
                    )}
                </div>
            </div>
            {loading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <Loading />
            </div>}
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
    // Kiểm tra đầu vào an toàn
    if (!course || !course.Detail) {
        return [];
    }

    const pastLessonIds = new Set(
        course.Detail
            .filter(({ Day }) => {
                if (!Day) return false;
                return new Date(Day) <= now;
            })
            .map(({ _id }) => _id.toString()) // Dùng _id thay vì ID
    );

    const totalPastLessons = pastLessonIds.size;

    if (!course.Student) {
        return [];
    }

    return course.Student.map(stu => {
        const counts = [0, 0, 0, 0];

        if (stu.Learn && Array.isArray(stu.Learn)) {
            for (const learnItem of stu.Learn) {
                const { Lesson, Checkin } = learnItem;
                const lessonIdStr = Lesson?.toString();

                // Bỏ qua nếu buổi học chưa diễn ra hoặc không có ID
                if (!lessonIdStr || !pastLessonIds.has(lessonIdStr)) {
                    continue;
                }

                const idx = Number(Checkin);
                if (!isNaN(idx) && idx >= 0 && idx <= 3) {
                    counts[idx] += 1;
                }
            }
        }
        const [f, m, k, c] = counts;
        let b = totalPastLessons - m - k;

        // Giới hạn giá trị của b từ 0 đến 2
        if (b > 2) b = 2;
        else if (b < 0) b = 0;

        return { ...stu, m, k, c, b };
    });
}

const Cell = ({ flex, align, children }) => (
    <div style={{ flex, padding: '8px 8px', display: 'flex', justifyContent: align }} className="text_6_400" > {children} </div>
);