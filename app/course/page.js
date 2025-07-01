import { Data_Course_all } from "@/data/course"
import Navbar from "./template/navbar"
import { Data_book } from "@/data/book"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.token)?.value;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const data = await Data_Course_all()
  const book = await Data_book()
  
  return (
    <Navbar data={data} book={book} user={decodedToken}/>
  )
}
