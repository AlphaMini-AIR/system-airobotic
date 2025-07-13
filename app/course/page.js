import { Data_Course_all, Data_coursetry } from "@/data/course"
import Navbar from "./template/navbar"
import { Data_book } from "@/data/book"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken';
import { Read_Area } from "@/data/area";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.token)?.value;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const [courses, books, areas, trial] = await Promise.all([
    Data_Course_all(),
    Data_book(),
    Read_Area(),
    Data_coursetry()
  ])
  return (
    <Navbar
      data={courses}
      book={books}
      areas={areas}
      user={decodedToken}
      trys={trial}
    />
  )
}
