import { NextResponse } from 'next/server';

// URL của Google Apps Script không thay đổi
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx17JMuK_X-OhUAjin3IlDTAvhBgOOocoWMrTqT7q7_lWNq0eES-GHLwD4MKMIQ43p9eg/exec';

/**
 * API để gửi tin nhắn qua Google Apps Script.
 * @param {Request} req - Request object chứa body JSON.
 * Body phải có:
 * - `mes`: Nội dung tin nhắn (string, bắt buộc).
 * - `phone` hoặc `uid`: Thông tin người nhận (bắt buộc một trong hai).
 */
export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        // Lỗi nếu body không phải là JSON hợp lệ
        return NextResponse.json({ status: 1, mes: 'Invalid JSON body.', data: [] });
    }

    const { phone, uid, mes } = body;

    // --- Validation ---
    // Phải có `mes` và ít nhất một trong hai `phone` hoặc `uid`
    if (!mes || typeof mes !== 'string' || (!phone && !uid)) {
        return NextResponse.json({
            status: 1,
            mes: 'Body must contain `mes` and either `phone` or `uid`.',
            data: [],
        });
    }

    // --- Chuẩn bị và gọi API của Google Script ---
    const result = { status: 'failed' };
    if (phone) result.phone = phone;
    if (uid) result.uid = uid;

    try {
        const url = new URL(SCRIPT_URL);

        // Ưu tiên sử dụng `uid` nếu có, nếu không thì dùng `phone`
        if (uid) {
            url.searchParams.set('uid', uid);
        } else {
            url.searchParams.set('phone', phone);
        }
        url.searchParams.set('mes', mes);

        // Gửi yêu cầu tới Google Apps Script
        const response = await fetch(url.toString());
        const jsonResponse = await response.json();

        // Xử lý kết quả từ script
        if (jsonResponse.status === 2) {
            result.status = 'success';
            if (jsonResponse.data?.uid) result.uid = jsonResponse.data.uid;
            if (jsonResponse.data?.name) result.name = jsonResponse.data.name;
        } else {
            result.error = jsonResponse.mes || 'An unknown error occurred.';
        }
    } catch (e) {
        result.error = e.message;
    }
    return NextResponse.json({
        status: result.status === 'success' ? 2 : 1,
        mes, 
        data: [result], 
    });
}