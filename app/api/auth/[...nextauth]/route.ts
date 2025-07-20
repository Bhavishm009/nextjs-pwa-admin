import NextAuth, { NextAuthOptions, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

// TEMP STORE: Use DB/Redis in production
let refreshTokenStore: Record<string, string> = {};

// 🔄 Refresh Access Token Logic
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Refresh token failed');
    return { accessToken: data.accessToken };
  } catch (e) {
    console.error('Token refresh failed', e);
    return null;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials?.username,
            password: credentials?.password,
          }),
        });

        const user = await res.json();

        if (!res.ok || !user?.user || !user?.accessToken) return null;

        // Store refresh token in-memory (use DB or Redis in prod)
        refreshTokenStore[user.user.id] = user.refreshToken;

        return {
          id: user.user.id,
          name: user.user.username,
          role: user.user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: {
        id: string;
        name: string;
        role: string;
        accessToken: string;
        refreshToken: string;
      };
    }) {
      // On initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000; // 15 min
        return token;
      }

      // If token expired, try refreshing
      if (Date.now() > (token.accessTokenExpires as number)) {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        if (refreshed?.accessToken) {
          return {
            ...token,
            accessToken: refreshed.accessToken,
            accessTokenExpires: Date.now() + 15 * 60 * 1000,
          };
        } else {
          return { ...token, error: 'RefreshFailed' };
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST };
