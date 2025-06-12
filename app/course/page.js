import { Data_Course_all } from "@/data/course"
import Navbar from "./template/navbar"
import { Data_book } from "@/data/book"

export default async function Home() {
  const data = await Data_Course_all()
  const book = await Data_book()
  
  return (
    <Navbar data={data} book={book} />
  )
}
