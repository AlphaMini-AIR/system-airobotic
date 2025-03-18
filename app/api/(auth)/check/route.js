import { NextResponse } from 'next/server';
import authenticate from '@/utils/authenticate';

// API kiểm tra token và trả về thông tin người dùng
export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { air: 0, mes: 'Xác thực thất bại!' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.json(
      { air: 2, mes: 'Lấy thông tin người dùng thành công!', data: user },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { air: 0, mes: 'Đã xảy ra lỗi trong quá trình xử lý!', error: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
