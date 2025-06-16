import { Data_book_one } from "@/data/book";
import BookDetail from "./ui/main";

export default async function Page({ params }) {
    const { id } = await params;
    let data = await Data_book_one(id);
    return (
        <BookDetail data={data} id={id} />
    );
}