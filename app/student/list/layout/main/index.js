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
    console.log('hi');
    setload(true)
    await Re_Student_All()
    await route.refresh()
    setload(false)
  };

  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  const filteredStudents = data_student.filter(student => {
    const matchArea = filterArea === "Tất cả" ? true : student.Area === filterArea;
    const matchStatus = filterStatus === "Tất cả" ? true : student.Status === filterStatus;
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
          <div style={{ width: 300 }}>
            <input
              className='input'
              name="username"
              placeholder="Nhập tên..."
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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