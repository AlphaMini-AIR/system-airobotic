import Profile from "./ui/profile";
import { Read_Student_ById } from "@/data/student";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await Read_Student_ById(id)

    if (!data) {
        return <p>Không tìm thấy thông tin học sinh.</p>;
    }

    return (
        <Profile data={data} />
    );
}
