import PostStudent from '@/models/student'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import jsonRes from '@/utils/response'


export async function POST(request) {
    try {
        const { user, body } = await authenticate(request)

        let data
        let message = 'Lấy dữ liệu thành công'
        let status = 200
        let { BD, Name, Phone, Type, Area, Address, Status, Avt, Course, Email, ParentName, School } = body

        await connectDB();
        const students = await PostStudent.find({}, { ID: 1 }).lean()


        if (!Avt) Avt = ''
        let Profile = {
            Avatar: "",
            ImgPJ: [],
            ImgSkill: "",
            Intro: `Xin chào! tên tôi là ${Name}, tôi là học viên của trung tâm AI ROBOTIC. Tôi rất đam mê với công nghệ và đặc biệt là trí tuệ nhân tạo với robotic vì vậy tôi đã đăng ký khóa học này để thảo mãn đam mê của mình.
        Theo tôi đây là một khóa học vô cùng thú vị bởi vì khóa học áp dụng phương pháp STEM có lý thuyết có thức hành và mỗi buổi tôi đều có thể tạo ra được một mô hình liên quan đến chủ đề học.
        Tôi thích từng bước của quá trình học tập AI ROBOTIC Từ lý thuyết đến lắp ráp robot rồi đến lập trình mô hình.`,
            Present: [],
            Skill: {
                "Sự tiến bộ và Phát triển": "100",
                "Kỹ năng giao tiếp": "100",
                "Diễn giải vấn đề": "100",
                "Tự tin năng động": "100",
                "Đổi mới sáng tạo": "100",
                "Giao lưu hợp tác": "100"
            }
        }
        const newPost = new PostStudent({ ID, BD, Name, Phone, Type, Area, Address, Status, Avt, Profile, Course, Email, ParentName, School, Profile });
        await newPost.save();
        message = 'Thêm học sinh thành công';
        data = newPost

        return jsonRes(201, { status: true, mes: message, data })
    } catch (error) {
        console.log(error);
        return jsonRes(error.message === 'Authentication failed' ? 401 : 500, { status: false, mes: error.message, data: null })
    }
}