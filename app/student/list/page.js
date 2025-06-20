import { Read_Student_All } from '@/data/student';
import Main from './layout/main';
import { Read_Area } from '@/data/area';

export default async function Page() {
  const studentList = await Read_Student_All()
  const area_all = await Read_Area()
  return (
    <Main data_area={area_all} data_student={studentList} />
  );
}
