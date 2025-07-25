'use client'

import styles from './index.module.css';
import Nav from '../filter';
import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import Create from '../../ui/create';
import { Re_Student_All } from '@/data/student';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';

export default function Main({ data_student, data_area }) {
  const [load, setload] = useState(false);
  const route = useRouter()
  const ReLoadData = async () => {
    setload(true)
    await Re_Student_All()
    route.refresh()
    setload(false)
  };

  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  // MỚI: Tạo danh sách các khu vực duy nhất từ data_student
  // Sử dụng Set để đảm bảo mỗi khu vực chỉ xuất hiện một lần
  const uniqueAreas = [...new Set(
    data_student.map(student => student.Area?.name).filter(Boolean)
  )];

  const filteredStudents = data_student.filter(student => {
    // SỬA ĐỔI: So sánh với student.Area.name thay vì student.Area
    // Thêm ?. (optional chaining) để tránh lỗi nếu student.Area không tồn tại
    const matchArea = filterArea === "Tất cả" ? true : student.Area?.name === filterArea;

    const matchStatus = (() => {
      if (filterStatus === "Tất cả") return true;
      const latestStatus = student.Status?.[student.Status.length - 1];
      if (!latestStatus) return false;
      switch (filterStatus) {
        case "Đang học":
          return latestStatus.status === 2;
        case "Đã nghỉ":
          return latestStatus.status === 0;
        case "Chờ lên khóa":
          return latestStatus.status === 1;
        default:
          return false;
      }
    })();
    const search = searchTerm.trim().toLowerCase();
    const matchSearch =
      search === ""
        ? true
        : (student.Name && student.Name.toLowerCase().includes(search)) ||
        (student.ID && student.ID.toLowerCase().includes(search));

    return matchArea && matchSearch && matchStatus;
  });

  return (
    <div className={styles.over_wrap}>
      <div className={styles.over_nav}>
        <Nav
          data_student={data_student}
          setFilterStatus={setFilterStatus}
          currentFilterStatus={filterStatus}
        />
      </div>
      <div className={styles.list_wrap}>
        <div className={styles.list_toptab}>
          {/* SỬA ĐỔI: Bọc input và select trong một div để dễ dàng sắp xếp */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className='input'
              name="username"
              placeholder="Nhập tên hoặc ID học sinh..."
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* MỚI: Thêm dropdown để lọc theo khu vực */}
            <select
              className='input'
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              style={{ width: 200 }}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>
                  {areaName}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className='btn' style={{ background: 'var(--main_d)', borderRadius: 5, margin: 0 }} onClick={ReLoadData}>
              <Svg_Reload w={18} h={18} c={'white'} />
              <p className='text_6_400' style={{ color: "white" }}>Tải lại dữ liệu</p>
            </div>
            <Create data_area={data_area} reloadData={ReLoadData} />
          </div>
        </div>
        <div className={`${styles.list_main} scroll`}>
          {filteredStudents.map((t, index) => (
            <Li_l key={index} data={t} dataArea={data_area} reloadData={ReLoadData} />
          ))}
        </div>
      </div>
      {load && <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
        <Loading />
      </div>}
    </div>
  );
}