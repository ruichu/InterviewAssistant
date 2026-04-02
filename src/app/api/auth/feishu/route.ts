import { NextRequest, NextResponse } from 'next/server';

// 飞书 OAuth 配置（从环境变量获取）
const FEISHU_APP_ID = process.env.LARK_APP_ID;
const FEISHU_APP_SECRET = process.env.LARK_APP_SECRET;
const FEISHU_REDIRECT_URI = process.env.LARK_REDIRECT_URI;

// 飞书认证相关的常量（v1 authorize + v3 token，飞书推荐组合）
const FEISHU_OAUTH_URL = 'https://open.feishu.cn/open-apis/authen/v1/authorize';
const FEISHU_TOKEN_URL = 'https://open.feishu.cn/open-apis/authen/v3/oidc/access_token';
const FEISHU_USER_INFO_URL = 'https://open.feishu.cn/open-apis/authen/v1/user_info';

// Cookie 配置
const COOKIE_NAME = 'feishu_auth_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  try {
    // 如果没有 code，重定向到飞书授权页面
    if (!code) {
      if (!FEISHU_APP_ID) {
        throw new Error('FEISHU_APP_ID 环境变量未配置');
      }

      const authUrl = new URL(FEISHU_OAUTH_URL);
      authUrl.searchParams.set('app_id', FEISHU_APP_ID);
      authUrl.searchParams.set('redirect_uri', FEISHU_REDIRECT_URI || `${process.env.COZE_PROJECT_DOMAIN_DEFAULT}/api/auth/feishu`);
      // 使用空格分隔的scope，只请求基础权限
      authUrl.searchParams.set('scope', 'openid');
      authUrl.searchParams.set('state', state || 'interview-assistant');

      return NextResponse.redirect(authUrl.toString());
    }

    // 使用 code 换取 access_token
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
      throw new Error('飞书应用配置缺失');
    }

    const tokenResponse = await fetch(FEISHU_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.code !== 0) {
      console.error('飞书OAuth错误:', {
        code: tokenData.code,
        msg: tokenData.msg,
        error_code: tokenData.error_code,
      });
      throw new Error(`获取 access_token 失败: ${tokenData.msg} (错误码: ${tokenData.code})`);
    }

    const { access_token, refresh_token } = tokenData.data;

    // 获取用户信息
    const userInfoResponse = await fetch(FEISHU_USER_INFO_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const userInfoData = await userInfoResponse.json();

    if (userInfoData.code !== 0) {
      console.error('飞书用户信息错误:', {
        code: userInfoData.code,
        msg: userInfoData.msg,
      });
      throw new Error(`获取用户信息失败: ${userInfoData.msg} (错误码: ${userInfoData.code})`);
    }

    const userInfo = userInfoData.data;

    // 设置认证 cookie
    const response = NextResponse.redirect(new URL('/', request.url));

    response.cookies.set({
      name: COOKIE_NAME,
      value: JSON.stringify({
        access_token,
        refresh_token,
        user_info: {
          open_id: userInfo.open_id,
          union_id: userInfo.union_id,
          name: userInfo.name,
          en_name: userInfo.en_name,
          avatar_url: userInfo.avatar_url,
          avatar_thumb: userInfo.avatar_thumb,
          avatar_middle: userInfo.avatar_middle,
          avatar_big: userInfo.avatar_big,
          email: userInfo.email || '',
          mobile: userInfo.mobile || '',
          country_code: userInfo.country_code || '',
        },
        expires_at: Date.now() + (tokenData.data.expires_in * 1000),
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('飞书认证错误:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
