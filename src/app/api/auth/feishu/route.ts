import { NextRequest, NextResponse } from 'next/server';

// 飞书 OAuth 配置（从环境变量获取）
const FEISHU_APP_ID = process.env.LARK_APP_ID;
const FEISHU_APP_SECRET = process.env.LARK_APP_SECRET;
const FEISHU_REDIRECT_URI = process.env.LARK_REDIRECT_URI;

// 飞书认证相关的常量（使用与Python版本一致的端点）
const FEISHU_AUTH_INDEX_URL = 'https://open.feishu.cn/open-apis/authen/v1/index';
const FEISHU_APP_ACCESS_TOKEN_URL = 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal';
const FEISHU_USER_ACCESS_TOKEN_URL = 'https://open.feishu.cn/open-apis/authen/v1/access_token';

// Cookie 配置
const COOKIE_NAME = 'feishu_auth_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 天

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const question = searchParams.get('question') || '';

  try {
    // 如果没有 code，重定向到飞书授权页面（使用index端点，与Python一致）
    if (!code) {
      if (!FEISHU_APP_ID) {
        throw new Error('FEISHU_APP_ID 环境变量未配置');
      }

      // 构造重定向URI
      const redirectUri = FEISHU_REDIRECT_URI || `${process.env.COZE_PROJECT_DOMAIN_DEFAULT}/api/auth/feishu`;
      const fullRedirectUri = question ? `${redirectUri}?question=${encodeURIComponent(question)}` : redirectUri;
      const encodedRedirectUri = encodeURIComponent(fullRedirectUri);

      // 使用index端点（与Python一致）
      const authUrl = `${FEISHU_AUTH_INDEX_URL}?redirect_uri=${encodedRedirectUri}&app_id=${FEISHU_APP_ID}`;

      const response = NextResponse.redirect(authUrl);

      // 禁止缓存重定向响应
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    }

    // 使用 code 换取 access_token（与Python一致的流程）
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
      throw new Error('飞书应用配置缺失');
    }

    // 步骤1: 获取 app_access_token
    const appTokenResponse = await fetch(FEISHU_APP_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      }),
    });

    const appTokenData = await appTokenResponse.json();

    if (appTokenData.code !== 0) {
      console.error('飞书获取app_access_token错误:', {
        code: appTokenData.code,
        msg: appTokenData.msg,
      });
      throw new Error(`获取 app_access_token 失败: ${appTokenData.msg} (错误码: ${appTokenData.code})`);
    }

    const appAccessToken = appTokenData.app_access_token;

    // 步骤2: 使用 app_access_token 获取用户 access_token
    const userTokenResponse = await fetch(FEISHU_USER_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const userTokenData = await userTokenResponse.json();

    if (userTokenData.code !== 0 || userTokenData.msg !== 'success') {
      console.error('飞书获取user_access_token错误:', {
        code: userTokenData.code,
        msg: userTokenData.msg,
      });
      throw new Error(`获取用户 access_token 失败: ${userTokenData.msg} (错误码: ${userTokenData.code})`);
    }

    const userData = userTokenData.data;
    const userName = userData.name;

    if (!userName || userName.length <= 1) {
      throw new Error('无法获取用户名称');
    }

    // 设置认证 cookie（简化版，只存储必要信息）
    // 从 LARK_REDIRECT_URI 中提取基础URL用于重定向
    const redirectUri = FEISHU_REDIRECT_URI || `${process.env.COZE_PROJECT_DOMAIN_DEFAULT}/api/auth/feishu`;
    const baseUrl = new URL(redirectUri).origin;
    const response = NextResponse.redirect(new URL(baseUrl, request.url));

    response.cookies.set({
      name: COOKIE_NAME,
      value: JSON.stringify({
        user_info: {
          name: userName,
          open_id: userData.open_id || '',
          union_id: userData.union_id || '',
        },
        expires_at: Date.now() + (COOKIE_MAX_AGE * 1000),
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
    // 从 LARK_REDIRECT_URI 中提取基础URL用于重定向
    const redirectUri = FEISHU_REDIRECT_URI || `${process.env.COZE_PROJECT_DOMAIN_DEFAULT}/api/auth/feishu`;
    const baseUrl = new URL(redirectUri).origin;
    return NextResponse.redirect(
      new URL(`${baseUrl}/?error=auth_failed`, request.url)
    );
  }
}
