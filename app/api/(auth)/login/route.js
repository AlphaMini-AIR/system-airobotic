export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/data/connect';
import PostUser from '@/data/models/users';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password, rememberMe } = await request.json();
    const response = await fetch('https://api-auth.s4h.edu.vn/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ air: 0, data: null, mes: 'Tài khoản hoặc mật khẩu không chính xác' }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let user = await PostUser.findOne({ Email: { $regex: new RegExp(`^${email}$`, 'i') } });
    const cookieStore = await cookies();

    if (user) {
      await Create_token(user, rememberMe, cookieStore);
      return new Response(
        JSON.stringify({ air: 2, data: user, mes: 'Đăng nhập thành công' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      let data = await response.json();
      const checkuser3 = await fetch('https://api-auth.s4h.edu.vn/users/me', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.accessToken}` },
      });

      if (!checkuser3.ok) {
        let errorResponse = await checkuser3.json();
        return new Response(JSON.stringify({
          air: 0,
          data: null,
          error: errorResponse.error,
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userApiData = await checkuser3.json();
      const newPost = new PostUser({
        email: email,
        name: userApiData.lastName + ' ' + userApiData.firstName,
        phone: userApiData.phone || '',
        address: userApiData.address || '',
        avatar: userApiData.avatarUrl || '',
        role: 5,
      });
      await newPost.save();
      user = newPost;
      await Create_token(user, rememberMe, cookieStore);
      return new Response(
        JSON.stringify({ air: 2, data: user, mes: 'Đăng nhập thành công' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ air: 0, data: null, mes: error.message || error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


async function Create_token(user, rememberMe, cookieStore) {
  const accessToken = jwt.sign({ user }, process.env.JWT_SECRET);
  const cookieOptions = { httpOnly: true, path: '/' };
  if (rememberMe) cookieOptions.maxAge = 60 * 60 * 24 * 365 * 10
  await cookieStore.set('s_air', accessToken, cookieOptions);
}
