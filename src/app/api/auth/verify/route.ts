import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'feishu_auth_token';

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get(COOKIE_NAME);

    if (!authCookie) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const authData = JSON.parse(authCookie.value);
      
      // 检查 token 是否过期
      if (authData.expires_at && Date.now() > authData.expires_at) {
        return NextResponse.json({ authenticated: false, reason: 'token_expired' });
      }

      return NextResponse.json({
        authenticated: true,
        user: authData.user_info,
      });
    } catch (error) {
      console.error('解析认证 cookie 失败:', error);
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('验证认证状态错误:', error);
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete({
      name: COOKIE_NAME,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登出失败:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
