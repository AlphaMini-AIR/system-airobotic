import More from "./ui/more";
import Calendar from "./ui/calendar";
import Student from "./ui/student";

export default function CourseTryMain({ data, book, student, teacher, area }) {
    return (
        <div style={{ flexDirection: 'column', gap: 8, display: 'flex' }}>
            <Calendar data={data} />
            <More data={data} book={book} student={student} teacher={teacher} area={area} />
            <Student data={data} book={book} student={student} teacher={teacher} area={area} />
        </div>
    );
}