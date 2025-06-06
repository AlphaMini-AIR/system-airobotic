import { Read_Area_All } from '@/data/data';
import { Read_Student_All, Read_Student_One } from '@/data/student';
import Main from './ui/main';

export default async function Page() {
  const [area_all, studentList] = await Promise.all([
    Read_Area_All(),
    Read_Student_All()
  ]);

  // const data_student = await Promise.all(
  //   studentList.map(student => Read_Student_One(student._id))
  // );

  return (
    // <Main data_area={area_all} data_student={data_student} />
    <p>hi</p>
  );
}
