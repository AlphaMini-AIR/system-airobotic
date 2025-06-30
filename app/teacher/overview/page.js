import { Data_user_report } from "@/data/users";
import Report from "../ui/report";

export default async function TeacherPage() {
    let data = await Data_user_report();
    return (
        <Report initialReports={data} />
    );
}