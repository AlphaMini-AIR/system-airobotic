
import { Data_Course_One } from "@/data/course";
import Timeline from "./ui/timeline";
import Detail from "./ui/detailcourse";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await Data_Course_One(id[0]);
    console.log(data);

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <Timeline data={data} />
            <div style={{ flex: 4 }}>
                <Detail data={data} params={id} />
            </div>
        </div>
    );
}
