import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SHEET_ID = '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const SHEET_NAME = 'Data';

function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

const normalize = s => s.toString().trim().toLowerCase();

function parseLabels(input) {
    if (Array.isArray(input)) {
        return input.map(String).map(s => s.trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
        try {
            const arr = JSON.parse(input.replace(/'/g, '"'));
            if (Array.isArray(arr)) {
                return arr.map(String).map(s => s.trim()).filter(Boolean);
            }
        } catch { }
        return input.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function parseArrayCell(raw) {
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                return arr.map(String).map(s => s.trim()).filter(Boolean);
            }
        } catch { }
    }
    return parseLabels(raw);
}

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ status: 1, mes: '', data: [] });
    }
    const { data, mes, labels } = body;
    if (!Array.isArray(data) || typeof mes !== 'string') {
        return NextResponse.json({ status: 1, mes: typeof mes === 'string' ? mes : '', data: [] });
    }
    let sheets;
    try {
        sheets = getSheetsClient();
    } catch {
        return NextResponse.json({ status: 0, mes, data: [] });
    }
    const phoneMap = new Map();
    data.forEach(stu => {
        const phone = stu.phone?.toString().trim();
        if (phone && !phoneMap.has(phone)) phoneMap.set(phone, stu);
    });
    const uniqueStudents = Array.from(phoneMap.values());
    const results = [];
    for (const stu of uniqueStudents) {
        const phone = stu.phone?.toString().trim();
        if (!phone) {
            results.push({ _id: stu._id, phone: null, status: 'skipped', error: 'No phone' });
            continue;
        }
        const url = new URL('https://script.google.com/macros/s/AKfycbwXna0pdP99lPQfpoRufXvuvb_iYxdJ775LnTiAow1PtH9SodU_ET1BOqbXB0toaDX8nw/exec');
        url.searchParams.set('phone', phone);
        url.searchParams.set('mes', mes);
        try {
            const r = await fetch(url.toString(), { method: 'GET' });
            if (r.ok) {
                results.push({ _id: stu._id, phone, status: 'success' });
            } else {
                results.push({ _id: stu._id, phone, status: 'failed', error: `HTTP ${r.status}: ${await r.text()}` });
            }
        } catch (e) {
            results.push({ _id: stu._id, phone, status: 'failed', error: e.message });
        }
    }
    const commonLabels = parseLabels(labels);
    if (commonLabels.length) {
        const { data: sheetData } = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:K`,
            fields: 'values',
        });
        const rows = sheetData.values || [];
        const phoneSheetMap = new Map();
        rows.forEach((row, idx) => {
            const phoneInSheet = row[1]?.toString().trim();
            const currentRaw = row[10] || '';
            if (phoneInSheet) {
                phoneSheetMap.set(phoneInSheet, { row: idx + 1, currentRaw });
            }
        });
        const updates = [];
        uniqueStudents.forEach(stu => {
            const phone = stu.phone?.toString().trim();
            if (!phone) return;
            const info = phoneSheetMap.get(phone);
            if (!info) return;
            const oldList = parseArrayCell(info.currentRaw);
            const mergedMap = new Map();
            oldList.forEach(lb => mergedMap.set(normalize(lb), lb));
            commonLabels.forEach(lb => {
                const key = normalize(lb);
                if (!mergedMap.has(key)) mergedMap.set(key, lb);
            });
            const merged = Array.from(mergedMap.values());
            const newRaw = JSON.stringify(merged);
            if (newRaw !== info.currentRaw) {
                updates.push({ range: `${SHEET_NAME}!K${info.row}`, values: [[newRaw]] });
            }
        });
        if (updates.length) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: { data: updates, valueInputOption: 'USER_ENTERED' },
            });
        }
    }
    return NextResponse.json({ status: 2, mes, data: results });
}
