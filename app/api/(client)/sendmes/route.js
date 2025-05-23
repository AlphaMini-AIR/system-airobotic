import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SHEET_ID = '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const SHEET_NAME = 'Data';                             // tên tab trong Google Sheets

/* ------------------------------------------------------------------ */
/* Google Sheets client                                               */
/* ------------------------------------------------------------------ */
function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            // PRIVATE_KEY khi lưu trên env thường bị thay \n = \\n → revert lại
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

/* ------------------------------------------------------------------ */
/* Helper utilities                                                   */
/* ------------------------------------------------------------------ */
const normalize = s => s.toString().trim().toLowerCase();

/** Trả về mảng string từ nhiều kiểu input khác nhau */
function parseLabels(input) {
    if (Array.isArray(input)) {
        return input.map(String).map(s => s.trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
        // thử parse JSON trước
        try {
            const arr = JSON.parse(input.replace(/'/g, '"'));
            if (Array.isArray(arr)) {
                return arr.map(String).map(s => s.trim()).filter(Boolean);
            }
        } catch (_) { /* ignore */ }
        // fallback tách bằng dấu phẩy
        return input.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

/** Ép chuỗi từ ô K thành mảng; không parse được thì fallback parseLabels */
function parseArrayCell(raw) {
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                return arr.map(String).map(s => s.trim()).filter(Boolean);
            }
        } catch (_) { /* ignore */ }
    }
    return parseLabels(raw);
}

/* ================================================================== */
/*  API handler                                                       */
/* ================================================================== */
export async function POST(req) {
    try {
        /* ------------------------------------------------------------ */
        /* 1. Lấy body & validate                                       */
        /* ------------------------------------------------------------ */
        const { data, mes, labels } = await req.json();

        if (!Array.isArray(data) || typeof mes !== 'string') {
            return NextResponse.json(
                { error: 'Bad request: body cần có { data: [], mes: string }' },
                { status: 400 },
            );
        }

        /* 1a. Loại trùng số điện thoại (giữ bản ghi đầu tiên) -------- */
        const phoneMapInput = new Map();
        data.forEach(stu => {
            const phone = stu.phone?.toString().trim();
            if (phone && !phoneMapInput.has(phone)) phoneMapInput.set(phone, stu);
        });
        const uniqueStudents = Array.from(phoneMapInput.values());

        /* ------------------------------------------------------------ */
        /* 2. Gửi SMS cho từng học viên                                 */
        /* ------------------------------------------------------------ */
        const results = [];
        for (const stu of uniqueStudents) {
            const phone = stu.phone?.toString().trim();
            if (!phone) {
                results.push({ _id: stu._id, phone: null, status: 'skipped', error: 'No phone' });
                continue;
            }

            const url = new URL(
                'https://script.google.com/macros/s/AKfycbwXna0pdP99lPQfpoRufXvuvb_iYxdJ775LnTiAow1PtH9SodU_ET1BOqbXB0toaDX8nw/exec'
            );
            url.searchParams.set('phone', phone);
            url.searchParams.set('mes', mes);

            try {
                const r = await fetch(url.toString(), { method: 'GET' });
                if (r.ok) {
                    results.push({ _id: stu._id, phone, status: 'success' });
                } else {
                    results.push({
                        _id: stu._id, phone, status: 'failed',
                        error: `HTTP ${r.status}: ${await r.text()}`,
                    });
                }
            } catch (e) {
                results.push({ _id: stu._id, phone, status: 'failed', error: e.message });
            }
        }

        /* ------------------------------------------------------------ */
        /* 3. Cập nhật nhãn vào cột K                                   */
        /* ------------------------------------------------------------ */
        const commonLabels = parseLabels(labels);          // mảng nhãn chung
        if (commonLabels.length) {
            const sheets = getSheetsClient();

            /* 3.1 Đọc toàn bộ cột B (phone) và K (labels) --------------- */
            const { data: sheetData } = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!A:K`,
                fields: 'values',
            });

            const rows = sheetData.values || [];
            const phoneSheetMap = new Map();   // phone → { row, currentRaw }

            rows.forEach((row, idx) => {
                const phoneInSheet = row[1]?.toString().trim(); // cột B
                const currentRaw = row[10] ?? '';             // cột K
                if (phoneInSheet) phoneSheetMap.set(phoneInSheet, { row: idx + 1, currentRaw });
            });

            /* 3.2 Chuẩn bị updates -------------------------------------- */
            const updates = [];

            uniqueStudents.forEach(stu => {
                const phone = stu.phone?.toString().trim();
                if (!phone) return;

                const info = phoneSheetMap.get(phone);
                if (!info) return;                               // SĐT chưa có trên sheet

                const oldList = parseArrayCell(info.currentRaw); // nhãn cũ (Array)

                /* Merge & loại trùng (không phân biệt hoa/thường) */
                const mergedMap = new Map();                     // normalize → label gốc

                // 1) giữ nguyên thứ tự cũ
                oldList.forEach(lb => mergedMap.set(normalize(lb), lb));

                // 2) thêm nhãn mới nếu chưa có
                commonLabels.forEach(lb => {
                    const key = normalize(lb);
                    if (!mergedMap.has(key)) mergedMap.set(key, lb);
                });

                const merged = Array.from(mergedMap.values());
                const newRaw = JSON.stringify(merged);           // chuỗi JSON để lưu

                if (newRaw !== info.currentRaw) {
                    updates.push({
                        range: `${SHEET_NAME}!K${info.row}`,
                        values: [[newRaw]],
                    });
                }
            });

            /* 3.3 Gửi batchUpdate nếu cần -------------------------------- */
            if (updates.length) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SHEET_ID,
                    requestBody: {
                        data: updates,
                        valueInputOption: 'USER_ENTERED',
                    },
                });
            }
        }

        /* ------------------------------------------------------------ */
        /* 4. Trả kết quả cho client                                    */
        /* ------------------------------------------------------------ */
        return NextResponse.json({ results });

    } catch (err) {
        console.error('Send-messages API error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        );
    }
}
