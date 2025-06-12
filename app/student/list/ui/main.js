'use client'

import AnimatedButton from '@/components/(ui)/(button)/button';
import air from '../../index.module.css';
import Nav from '../nav';
import { Li_l } from './li';
import { useState } from 'react';
import { Svg_Add } from '@/components/(icon)/svg';
import Input from '@/components/(ui)/(input)/input';
import Create from './create';

export default function Main({ data_student, data_area }) {
  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const filteredStudents = data_student.filter(student => {
    const matchArea = filterArea === "Tất cả" ? true : student.Area === filterArea;
    const search = searchTerm.trim().toLowerCase();
    const matchSearch =
      search === ""
        ? true
        : (student.Name && student.Name.toLowerCase().includes(search)) ||
        (student.ID && student.ID.toLowerCase().includes(search));
    return matchArea && matchSearch;
  });

  return (
    <div className={air.over_wrap}>
      <div className={air.over_nav}>
        <Nav
          data_area={data_area}
          selectedArea={filterArea}
          onAreaChange={setFilterArea}
        />
      </div>
      <div className={air.list_wrap}>
        <div className={air.list_toptab}>
          <div style={{ width: 300 }}>
            <Input
              name="username"
              placeholder="Nhập tên..."
              padding="10px"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AnimatedButton
            onClick={() => setDrawerOpen(true)}
            padding="10px"
            background="var(--main_d)"
            hoverColor="var(--main_b)"
            borderRadius="4px"
          >
            <Svg_Add w={18} h={18} c={'var(--bg-primary)'} />

          </AnimatedButton>
        </div>
        <div className={`${air.list_main} scroll`}>
          {filteredStudents.map((t, index) => (
            <Li_l key={index} data={t} />
          ))}
        </div>
      </div>
      {/* <Drawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} direction="right" size="600px" animationDuration={0.3} >
        <Create />
      </Drawer> */}
    </div>
  );
}
