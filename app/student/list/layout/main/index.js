'use client'

import styles from './index.module.css';
import Nav from '../filter';
import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import Create from '../../ui/create';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';
import { reloadStudent } from '@/data/actions/reload';

const STATUS_MAP = { "Đang học": 2, "Chờ lên khóa": 1, "Đã nghỉ": 0 };

export default function Main({ data_student, data_area }) {
  const [load, setLoad] = useState(false);
  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Đang học");
  const route = useRouter();

  const ReLoadData = async () => { setLoad(true); await reloadStudent(); route.refresh(); setLoad(false); };

  const uniqueAreas = [...new Set(data_student.map(s => s.Area?.name).filter(Boolean))];

  const filteredStudents = data_student.filter(student => {
    const search = searchTerm.trim().toLowerCase();
    const latestStatus = student.Status?.[student.Status.length - 1]?.status;

    const matchSearch = !search ||
      student.Name?.toLowerCase().includes(search) ||
      student.ID?.toLowerCase().includes(search);

    const matchArea = filterArea === "Tất cả" || student.Area?.name === filterArea;
    const matchStatus = filterStatus === "Tất cả" || latestStatus === STATUS_MAP[filterStatus];

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
          <div className={styles.filterControls}>
            <input
              className={`input ${styles.searchInput}`}
              placeholder="Nhập tên hoặc ID học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className={`input ${styles.areaSelect}`}
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
          </div>

          <div className={styles.actionControls}>
            <div className={`btn ${styles.reloadButton}`} onClick={ReLoadData}>
              <Svg_Reload w={18} h={18} c={'white'} />
              <p className={`text_6_400 ${styles.reloadButtonText}`}>Tải lại dữ liệu</p>
            </div>
            <Create data_area={data_area} />
          </div>
        </div>

        <div className={`${styles.list_main} scroll`}>
          {filteredStudents.map((t, index) => (
            <Li_l key={t.ID || index} data={t} dataArea={data_area} />
          ))}
        </div>
      </div>

      {load && (<div className={styles.loadingOverlay}>  <Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang tải dữ liệu...</p>} /></div>)}
    </div>
  );
}