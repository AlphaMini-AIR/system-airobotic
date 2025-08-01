import { Data_coursetry } from "@/data/course";
import Link from "next/link";
import CourseTryPages from "./main";
import CourseTryFilter from "./filter";
import { area_data, book_data, student_data, user_data } from "@/data/actions/get";

export default async function CourseTryPage() {
    let [data, book, student, teacher, area] = await Promise.all([
        Data_coursetry(),
        book_data(),
        student_data(),
        user_data({}),
        area_data(),
    ])

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', flex: 1.6 }}>
                <div style={{
                    borderRadius: '8px', padding: 16, background: 'linear-gradient(90deg, var(--yellow) 0%, rgb(249, 174, 0) 100%)',
                    boxShadow: 'var(--box)', overflow: 'hidden',
                }}><Link href={`/course/trycourse`}>
                        <div className="text_4_m" style={{ color: 'white', fontWeight: '500' }}>AI Robotic</div>
                        <div className="text_2" style={{ margin: '4px 0', color: 'white' }}>Lớp: HỌC THỬ</div>
                        <div className="text_4_m" style={{ color: 'white' }}>Học thử miễn phí AI Robotic</div>
                    </Link>
                </div>
                <CourseTryFilter data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
            <div style={{ flex: 4 }}>
                <CourseTryPages data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
        </div>
    );
}
