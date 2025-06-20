import { Read_Student_All, Read_Student_ById } from '@/data/student';
import Main from './layout/main';
import { Read_Area } from '@/data/area';

export default async function Page() {
  const studentList = await Read_Student_All()
  const area_all = await Read_Area()
  const data_student = await Promise.all(
    studentList.map(student => Read_Student_ById(student._id))
  );

  return (
    <Main data_area={area_all} data_student={data_student} />
  );
}
