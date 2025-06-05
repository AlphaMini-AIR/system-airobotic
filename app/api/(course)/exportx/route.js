import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

/* -------- helpers -------- */
function toAscii(str = '') {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_.-]+/g, '_');
}

function jsonRes(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

/* -------- POST /api/export-excel -------- */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            lessons = [],
            title = 'Bao_cao',
            courseId = '',        // Mã khóa
            program = '',        // Tên chương trình
            teacher = '',        // GV chủ nhiệm
        } = body;

        if (!lessons.length)
            return jsonRes({ status: 0, mes: 'Thiếu lessons' }, 400);

        /* 1. Workbook & sheet */
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Report');

        /* 2. Ghi 3 dòng đầu: cột A (nhãn) + B (giá trị) */
        ws.addRow(['Mã khóa học', courseId]);
        ws.addRow(['Tên chương trình', program]);
        ws.addRow(['Giáo viên chủ nhiệm', teacher]);
        ws.addRow([]);                                   // dòng trống

        /* 3. Header + dữ liệu từ dòng 5 trở đi */
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
        ws.addRow(header);

        lessons.forEach((l, idx) => {
            ws.addRow([
                l.Index ?? idx + 1,
                l.Topic,
                l.Teacher,
                l.Status,
                l.Day,
                l.Time,
                l.Attendance,
                l.Comments ?? '',
            ]);
        });

        /* 4. Auto-width đơn giản */
        ws.columns.forEach(col => {
            let max = 12;
            col.eachCell(c => { max = Math.max(max, String(c.value).length); });
            col.width = max + 2;
        });

        /* 5. Xuất buffer Excel */
        const uint8 = await wb.xlsx.writeBuffer();
        const buf = Buffer.from(uint8);

        const asciiName = `${toAscii(title)}.xlsx`;
        const utfName = encodeURIComponent(`${title}.xlsx`);

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utfName}`,
            },
        });
    } catch (err) {
        console.error(err);
        return jsonRes({ status: 0, mes: `Lỗi: ${err.message}` }, 500);
    }
}
