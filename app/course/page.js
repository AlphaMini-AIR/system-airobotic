import { Data_Course_all } from "@/data/course"
import Navbar from "./template/navbar"

export default async function Home() {
  const data = await Data_Course_all()
  
  return (
    <Navbar data={data} />
  )
}
