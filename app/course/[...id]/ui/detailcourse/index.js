import DetailStudent from '../detatilstudent';
import styles from './index.module.css';
import Student from '../student';
import Calendar from '../calendarcourse';

export default function Detail({ data, params }) {
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
                                <DetailStudent data={stu} course={data.Detail} c={data} />
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
            <div className={styles.box} style={{ padding: 16 }}>
                <div style={{ flex: 1 }}>
                    <p className="text_4" style={{ marginBottom: 8 }}>Thông tin khóa học</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <p className="text_6_400">Chương trình học: <span className="text_4_m">{data.ID}</span></p>
                        <p className="text_6_400">Số học sinh: <span className="text_4_m">{data.Student.length} học sinh</span></p>
                        <p className="text_6_400">Thời gian: <span className="text_4_m">{data.TimeStart} - {data.TimeEnd}</span></p>
                        <p className="text_6_400">Chủ nhiệm: <span className="text_4_m">{data.TeacherHR}</span></p>
                        <p className="text_6_400">Địa điểm: <span className="text_4_m">{data.Area}</span></p>
                    </div>
                </div>
                <div style={{ display: 'flex', width: 150, gap: 8, flexWrap: 'wrap' }}>
                    <div className={styles.Boxk}>
                        <Student course={data} student={students} />
                    </div>
                    <div className={styles.Boxk}>
                        <Calendar course={data} student={students} />
                    </div>
                    <div className={styles.Boxk}>

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
