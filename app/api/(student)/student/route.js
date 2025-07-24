import connectDB from '@/config/connectDB'
import PostStudent from '@/models/student'
import '@/models/area'
import '@/models/course'
import '@/models/book'
import { google } from 'googleapis'
import { Readable } from 'stream'
import jsonRes from '@/utils/response'
import mongoose from 'mongoose';
import { Re_coursetry } from '@/data/course'

export async function GET(request) {
    try {
        await connectDB()
        const data = await PostStudent.find({})
            .populate({
                path: 'Area'
            })
            .populate({
                path: 'Course.course',
                model: 'course',
                select: 'ID Status Book',
                populate: {
                    path: 'Book',
                    model: 'book',
                    select: 'Name Price'
                }
            })
            .lean()
        return jsonRes(200, { status: true, mes: 'Lấy danh sách học sinh thành công', data })
    } catch (error) {
        return jsonRes(500, { status: false, mes: error.message, data: null })
    }
}

async function getDriveClient() {
    const auth = new google.auth.GoogleAuth({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
}


const APPSCRIPT_ID = 'https://script.google.com/macros/s/AKfycbxMMwrvLEuqhsyK__QRCU0Xi6-qu-HkUBx6fDHDRAYfpqM9d4SUq4YKVxpPnZtpJ_b6wg/exec';

export async function POST(request) {
    await connectDB();
    const drive = await getDriveClient();
    let uploadedFileId = null

    try {
        const formData = await request.formData();
        const avtFile = formData.get('Avt');
        if (avtFile && avtFile.size > 0) {
            const FOLDER_ID = '1t949fB9rVSQyaZHnCboWDtuLNBjceTl-';
            const fileBuffer = Buffer.from(await avtFile.arrayBuffer());
            const readableStream = new Readable();
            readableStream.push(fileBuffer);
            readableStream.push(null);

            const fileMetadata = {
                name: `avt-${Date.now()}-${avtFile.name}`,
                parents: [FOLDER_ID]
            };
            const media = {
                mimeType: avtFile.type,
                body: readableStream
            };

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id',
            });

            uploadedFileId = response.data.id;
            if (!uploadedFileId) {
                throw new Error("Không thể lấy ID file từ Google Drive sau khi tải lên.");
            }
        }
        const lastStudent = await PostStudent
            .findOne({ ID: /^AI\d{4}$/ })
            .sort({ ID: -1 })
            .select('ID')
            .lean();

        const nextIdNumber = lastStudent
            ? parseInt(lastStudent.ID.slice(2), 10) + 1
            : 1;
        const newId = 'AI' + String(nextIdNumber).padStart(4, '0');
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
        const studentData = {
            Name: formData.get('Name'),
            BD: formData.get('BD'),
            School: formData.get('School'),
            ParentName: formData.get('ParentName'),
            Phone: formData.get('Phone'),
            Email: formData.get('Email'),
            Address: formData.get('Address'),
            Area: formData.get('Area'),
            Profile
        };

        const initialStatus = {
            status: 1,
            act: 'chờ',
            date: new Date(),
            note: 'Tạo học sinh thành công! Chờ thêm vào khóa học',
        };
        const newStudent = new PostStudent({
            ...studentData,
            ID: newId,
            Avt: uploadedFileId,
            Status: [initialStatus],
        });

        const savedStudent = await newStudent.save();
        let finalMessage = 'Tạo học sinh mới thành công!';
        let finalResponseData = savedStudent;

        try {
            const phone = formData.get('Phone');
            if (phone) {
                const appScriptUrl = `${APPSCRIPT_ID}?phone=${encodeURIComponent(phone)}`;
                const appScriptResponse = await fetch(appScriptUrl, { method: 'GET' });

                if (appScriptResponse.ok) {
                    const result = await appScriptResponse.json();
                    if (result.status === 2 && result.data?.uid) {
                        const updatedStudent = await PostStudent.findByIdAndUpdate(
                            savedStudent._id,
                            { $set: { Uid: result.data.uid } },
                            { new: true }
                        );
                        finalResponseData = updatedStudent || savedStudent
                    } else {
                        finalMessage = 'Tạo học sinh mới thành công. Lấy uid không thành công, kiểm tra lại số điện thoại liên hệ.';
                    }
                } else {
                    finalMessage = 'Tạo học sinh mới thành công. Lấy uid không thành công, kiểm tra lại số điện thoại liên hệ.';
                }
            }
        } catch (zaloError) {
            console.error('Lỗi khi gọi Apps Script hoặc cập nhật Zalo UID:', zaloError);
            finalMessage = 'Tạo học sinh mới thành công. Lấy uid không thành công, kiểm tra lại số điện thoại liên hệ.';
        }

        return jsonRes(201, { status: true, mes: finalMessage, data: finalResponseData })

    } catch (error) {
        if (uploadedFileId) {
            try {
                await drive.files.delete({ fileId: uploadedFileId })
                console.log(`Đã dọn dẹp file rác trên Drive: ${uploadedFileId}`)
            } catch (cleanupError) {
                console.error(`Lỗi khi dọn dẹp file ${uploadedFileId} trên Drive:`, cleanupError)
            }
        }

        if (error.name === 'ValidationError') {
            return jsonRes(400, { status: false, mes: error.message, data: null })
        }

        console.error('Lỗi API [POST /api/students]:', error)
        return jsonRes(500, { status: false, mes: error.message, data: null })
    }
}

export async function PUT(request) {
    try {
        await connectDB();

        const { studentId, topicId, status, note } = await request.json();

        if (!studentId || !topicId) {
            return jsonRes(400, { success: false, message: "Thiếu ID của học sinh hoặc ID của buổi học thử." });
        }

        if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(topicId)) {
            return jsonRes(400, { success: false, message: "ID của học sinh hoặc buổi học thử không hợp lệ." });
        }

        if (status === undefined && note === undefined) {
            return jsonRes(400, { success: false, message: "Không có dữ liệu 'status' hoặc 'note' để cập nhật." });
        }

        const updateFields = {};

        if (status !== undefined) {
            if (![0, 1, 2].includes(status)) {
                return jsonRes(400, { success: false, message: "Giá trị 'status' không hợp lệ. Chỉ chấp nhận 0, 1, hoặc 2." });
            }
            updateFields["Trial.$[elem].status"] = status;
        }

        if (note !== undefined) {
            updateFields["Trial.$[elem].note"] = String(note);
        }

        const result = await PostStudent.updateOne(
            {
                _id: new mongoose.Types.ObjectId(studentId),
                "Trial.topic": new mongoose.Types.ObjectId(topicId)
            },
            { $set: updateFields },
            {
                arrayFilters: [{ "elem.topic": new mongoose.Types.ObjectId(topicId) }]
            }
        );

        if (result.matchedCount === 0) {
            return jsonRes(404, { success: false, message: "Không tìm thấy học sinh với buổi học thử tương ứng." });
        }

        if (result.modifiedCount === 0) {
            return jsonRes(200, { success: true, message: "Dữ liệu không có thay đổi." });
        }
        Re_coursetry()
        return jsonRes(200, { success: true, message: "Cập nhật thông tin chăm sóc thành công." });

    } catch (error) {
        console.error('API Error [PUT /api/student/care]:', error);
        return jsonRes(500, { success: false, message: 'Lỗi máy chủ.', error: error.message });
    }
}