import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';

// ─── WeChat provider (custom) ─────────────────────────────────────────────────
// Activated only when WECHAT_CLIENT_ID and WECHAT_CLIENT_SECRET are set.
// To enable: add those two vars to .env.local — zero code changes needed.

function buildWeChatProvider(clientId: string, clientSecret: string): Provider {
  return {
    id: 'wechat',
    name: 'WeChat',
    type: 'oauth',
    checks: ['state'],
    clientId,
    clientSecret,
    authorization: {
      url: 'https://open.weixin.qq.com/connect/qrconnect',
      params: { scope: 'snsapi_login', response_type: 'code', appid: clientId },
    },
    token: {
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      async request(ctx: Record<string, unknown>) {
        const params = ctx.params as Record<string, string>;
        const provider = ctx.provider as { clientId: string; clientSecret: string };
        const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
        url.searchParams.set('appid', provider.clientId);
        url.searchParams.set('secret', provider.clientSecret);
        url.searchParams.set('code', params.code ?? '');
        url.searchParams.set('grant_type', 'authorization_code');
        const res = await fetch(url.toString());
        const data = await res.json();
        return { tokens: data };
      },
    },
    userinfo: {
      async request(ctx: Record<string, unknown>) {
        const tokens = ctx.tokens as Record<string, string>;
        const url = new URL('https://api.weixin.qq.com/sns/userinfo');
        url.searchParams.set('access_token', tokens.access_token ?? '');
        url.searchParams.set('openid', tokens.openid ?? '');
        url.searchParams.set('lang', 'zh_CN');
        const res = await fetch(url.toString());
        return res.json();
      },
    },
    profile(profile: Record<string, string>) {
      return {
        id: profile.unionid ?? profile.openid,
        name: profile.nickname,
        email: null,
        image: profile.headimgurl ?? null,
      };
    },
  } as Provider;
}

// ─── Build providers list ─────────────────────────────────────────────────────
const providers: Provider[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  }),
];

if (process.env.WECHAT_CLIENT_ID && process.env.WECHAT_CLIENT_SECRET) {
  providers.push(
    buildWeChatProvider(process.env.WECHAT_CLIENT_ID, process.env.WECHAT_CLIENT_SECRET)
  );
}

// ─── NextAuth export ──────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  /** Required in production; use `npx auth secret` to generate. Also accepts NEXTAUTH_SECRET. */
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    /** Same-origin only — blocks open redirects from crafted callbackUrl values. */
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        const base = new URL(baseUrl);
        if (target.origin !== base.origin) return baseUrl;
        return target.href;
      } catch {
        return baseUrl;
      }
    },
    async jwt({ token, account }) {
      // Use the provider's stable ID (e.g. Google "sub" claim) instead of the
      // auto-generated UUID that changes on every sign-in.
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId;
        token.sub = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const id = (token.userId ?? token.sub) as string | undefined;
        if (id) (session.user as typeof session.user & { id: string }).id = id;
      }
      return session;
    },
  },
});
