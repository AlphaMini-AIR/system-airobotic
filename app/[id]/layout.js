import { Read_Student_ById } from "@/data/student";
import Banner from "./ui/banner";

export default async function UserLayout({ children, params }) {
    const { id } = await params;
    const data = await Read_Student_ById(id);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Banner data={data} />
            {children}
        </div>
    );
}
