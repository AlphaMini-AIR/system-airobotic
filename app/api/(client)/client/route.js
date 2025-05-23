import { google } from 'googleapis';

const SPREADSHEET_ID = '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const RANGE_DATA = 'Data!A:L';       

async function getSheets(mode = 'read') {
  const scopes = mode === 'read'
    ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
    : ['https://www.googleapis.com/auth/spreadsheets'];

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_PROJECT_ID,
    scopes,
  });

  return google.sheets({ version: 'v4', auth });
}

/* ========================================================
   GET  /api/client      → lấy toàn bộ dữ liệu
   POST /api/client      → cập nhật 3 ô H I J theo phone
   ======================================================== */

/* --------------------- GET handler --------------------- */
export async function GET() {
  try {
    const sheets = await getSheets('read');

    /* 1. Đọc toàn bộ dữ liệu */
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE_DATA,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
      majorDimension: 'ROWS',
      fields: 'values',
    });

    const rows = data.values ?? [];
    if (rows.length < 2)
      return Response.json({ data: [] });

    const headers = rows[0];

    /* 2. Map mỗi hàng thành object */
    const results = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((key, idx) => {
        let cell = row[idx] ?? '';

        // bảo toàn số 0 đầu cho phone (cột B, idx===1)
        if (idx === 1) {
          const str = String(cell);
          cell = str && !str.startsWith('0') ? '0' + str : str;
        }
        obj[key] = cell;
      });
      return obj;
    });

    /* 3. Trả về */
    return new Response(JSON.stringify({ data: results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('Error fetching sheet data:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data from Google Sheets' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/* --------------------- POST handler -------------------- */
/**
 * Body JSON:
 * {
 *   "phone"    : "0987654321",
 *   "care"     : "...",
 *   "studyTry" : "...",
 *   "study"    : "..."
 * }
 */
export async function POST(req) {
  try {
    const { phone, care = '', studyTry = '', study = '' } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Thiếu số điện thoại (phone)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const sheets = await getSheets('write');

    /* 1. Đọc cột B để tìm row */
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Data!B:B',
      valueRenderOption: 'UNFORMATTED_VALUE',
      majorDimension: 'COLUMNS',
      fields: 'values',
    });

    const normalizePhone = (p) => {
      const s = String(p).trim();
      return s && s[0] !== '0' ? '0' + s : s;
    };

    const phones = (data.values?.[0] ?? []).map(normalizePhone);
    const target = normalizePhone(phone);
    const idx = phones.findIndex((p) => p === target);

    if (idx === -1) {
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy phone trong Sheet' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const rowNum = idx + 1;                         // dòng trong Sheet

    /* 2. Ghi vào H I J */
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Data!H${rowNum}:J${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[care, studyTry, study]] },
    });

    return new Response(
      JSON.stringify({ message: 'Đã cập nhật', row: rowNum }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Error updating sheet:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to update Google Sheet' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
