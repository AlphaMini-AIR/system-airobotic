
import { Data_Course_One } from "@/data/course";
import Timeline from "./ui/timeline";
import Detail from "./ui/detailcourse";
import { Data_book } from "@/data/book";
import { Read_Student_All } from "@/data/student";
import { Data_user } from "@/data/users";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await Data_Course_One(id[0]);
    let book = await Data_book();
    book = book.filter((b) => data.ID.slice(2, 5) == b.ID)[0]
    let students = await Read_Student_All()
    const users = await Data_user()
    
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <Timeline data={data} props={id} />
            <div style={{ flex: 4 }}>
                <Detail book={book} data={data} params={id} studentsx={students} users={users} />
            </div>
        </div>
    );
}
