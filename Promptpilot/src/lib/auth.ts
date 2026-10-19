import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  debug: false,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      id: 'google-native',
      name: 'Google Native',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
        googleAccessToken: { label: 'Google Access Token', type: 'text' },
        googleProviderAccountId: { label: 'Google Provider Account ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          console.error('Firebase Auth sign-in: No ID Token provided');
          return null;
        }
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
          if (!apiKey) {
            console.error('Firebase Auth sign-in ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is not defined in .env');
            return null;
          }

          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: credentials.idToken })
            }
          );
          if (!res.ok) {
            const errorBody = await res.text();
            console.error('Firebase Auth sign-in: Token verification failed', errorBody);
            return null;
          }
          const data = await res.json();
          const profile = data.users?.[0];

          const userId = profile.localId || profile.email;
          const userObj = {
            id: userId,
            email: profile.email,
            name: profile.displayName || profile.email.split('@')[0],
            image: profile.photoUrl || null,
          };

          try {
            const { rtdb } = await import('@/lib/firebase');
            const { ref, set } = await import('firebase/database');
            await set(ref(rtdb, `users/${userId}`), {
              ...userObj,
              lastLogin: new Date().toISOString()
            });
          } catch (fbErr) {}

          return userObj;
        } catch (e) {
          console.error('Error verifying Firebase ID token:', e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account && account.provider === 'google') {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url;
      }
      const allowedHosts = [
        'localhost:9002',
        '10.0.2.2:9002',
        '127.0.0.1:9002',
        '10.154.239.118:9002',
        '172.27.154.118:9002',
        '192.168.29.57:9002',
      ];
      try {
        const parsedUrl = new URL(url);
        if (allowedHosts.includes(parsedUrl.host) || 
            parsedUrl.host.endsWith('ngrok-free.dev') || 
            parsedUrl.host.endsWith('trycloudflare.com')) {
          return url;
        }
      } catch (e) {}
      return baseUrl;
    },
  },
  pages: {
    signIn: '/',
  },
};
