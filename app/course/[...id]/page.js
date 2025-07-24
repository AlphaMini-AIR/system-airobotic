
import { Data_Course_One } from "@/data/course";
import Timeline from "./ui/timeline";
import Detail from "./ui/detailcourse";
import { Data_book } from "@/data/book";
import { Read_Student_All } from "@/data/student";
import { Data_user } from "@/data/users";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await Data_Course_One(id[0]);
    let students = await Read_Student_All()
    const users = await Data_user()
    const tienDo = tinhTienDoHocTap(data);
    data.Progress = tienDo;
    console.log(data);
    
    
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <Timeline data={data} props={id} />
            <div style={{ flex: 4 }}>
                <Detail data={data} params={id} studentsx={students} users={users} />
            </div>
        </div>
    );
}

function tinhTienDoHocTap(data) {
    let tongSoTiet = 0;
    let tietDaHoc = 0;
    const ngayHienTai = new Date();
    const danhSachBuoiHoc = data?.Detail || [];

    danhSachBuoiHoc.forEach(buoiHoc => {
        const soTiet = buoiHoc?.LessonDetails?.Period;
        if (typeof soTiet === 'number') {
            tongSoTiet += soTiet;

            try {
                const ngayHoc = new Date(buoiHoc.Day);
                if (ngayHoc < ngayHienTai) {
                    tietDaHoc += soTiet;
                }
            } catch (e) {
                console.error("Lỗi khi xử lý ngày của buổi học:", e);
            }
        }
    });

    return `${tietDaHoc}/${tongSoTiet}`;
}
