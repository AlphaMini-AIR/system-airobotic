import { Data_user } from "@/data/users";
import Main from "./ui/main";

export default async function TeacherPage() {
    let data = await Data_user();
    return (
        <Main initialTeachers={data} />
    );
}