// app/api/export/route.js
import { google } from 'googleapis';

function getAuth(scopes = []) {
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes,
    });
}

async function getSheets(mode = 'read') {
    const scopes = mode === 'read'
        ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
        : ['https://www.googleapis.com/auth/spreadsheets'];
    return google.sheets({ version: 'v4', auth: getAuth(scopes) });
}

function getDrive() {
    return google.drive({
        version: 'v3',
        auth: getAuth(['https://www.googleapis.com/auth/drive']),
    });
}

/* ────────────────────────────────────
 * API  POST /api/export
 * body: { title?:string, lessons: Lesson[] }
 * ────────────────────────────────── */
export async function POST(request) {
    try {
        const { lessons = [], title = 'Báo cáo buổi học' } = await request.json();
        const driveId = '1fmIpxeXXfVRWLPk1x8Kzeyqhk6Vud82Z';      // đã cố định

        if (!lessons.length)
            return jsonRes({ status: 0, mes: 'Thiếu lessons' }, 400);

        /* 1) tạo file Google Sheet */
        const drive = getDrive();
        const file = await drive.files.create({
            requestBody: {
                name: title,
                mimeType: 'application/vnd.google-apps.spreadsheet',
                parents: [driveId],
            },
            supportsAllDrives: true,
            fields: 'id, webViewLink',
        });

        const spreadsheetId = file.data.id;
        const sheetLink = file.data.webViewLink
            || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

        /* 2) ghi dữ liệu */
        const sheets = await getSheets('write');
        const header = [
            'Buổi học',
            'Tên bài học',
            'Tên giáo viên dạy',
            'Trạng thái lớp học',
            'Ngày học',
            'Giờ học',
            'Trạng thái điểm danh',
            'Nhận xét của giáo viên',
        ];
        const rows = lessons.map((l, idx) => [
            l.Index ?? idx + 1,
            l.Topic,
            l.Teacher,
            l.Status,
            l.Day,
            l.Time,
            l.Attendance,
            l.Comments ?? '',
        ]);
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [header, ...rows] },
        });

        /* 3) trả về */
        return jsonRes({ status: 2, mes: 'thành công', data: sheetLink });
    } catch (err) {
        console.error(err);
        return jsonRes({ status: 0, mes: `Lỗi: ${err.message}` }, 500);
    }
}

/* helper response */
function jsonRes(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}
