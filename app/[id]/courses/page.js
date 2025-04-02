// app/[id]/courses/page.js

export default async function CoursesTab({ params }) {
    const { id } = await params;

    return (
        <div>
            <h3>Tab Khóa học của user {id}</h3>
            <p>
                Nội dung danh sách khóa học của người dùng sẽ hiển thị ở đây.
            </p>
        </div>
    );
}
