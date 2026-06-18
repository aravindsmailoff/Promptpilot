import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      id: 'google-native',
      name: 'Google Native',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          console.error('Native Google sign-in: No ID Token provided');
          return null;
        }
        try {
          const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credentials.idToken}`
          );
          if (!res.ok) {
            const errorBody = await res.text();
            console.error('Native Google sign-in: Token verification failed', errorBody);
            return null;
          }
          const profile = await res.json();

          // Validate audience (allow Web or Android Client IDs)
          const allowedAudiences = [
            process.env.GOOGLE_CLIENT_ID,
            process.env.ANDROID_GOOGLE_CLIENT_ID,
          ].filter(Boolean);

          if (!allowedAudiences.includes(profile.aud)) {
            console.error('Native Google sign-in ERROR: Audience mismatch.');
            console.error('Received aud:', profile.aud);
            console.error('Allowed IDs in .env:', allowedAudiences);
            return null;
          }

          if (!profile.email_verified || !profile.email) {
            console.error('Native Google sign-in ERROR: Email missing or not verified', profile.email);
            return null;
          }

          try {
            // Find or create user
            let user = await prisma.user.findUnique({
              where: { email: profile.email },
            });

            if (!user) {
              console.log('Native Google sign-in: Creating new user', profile.email);
              user = await prisma.user.create({
                data: {
                  email: profile.email,
                  name: profile.name || profile.email.split('@')[0],
                  image: profile.picture,
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          } catch (dbError) {
            console.error('Native Google sign-in ERROR: Database operation failed', dbError);
            return null;
          }
        } catch (e) {
          console.error('Error verifying Google ID token:', e);
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
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Force-update the Account table with the fresh OAuth tokens
        try {
          const prismaModule = await import('./db');
          await prismaModule.prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token || undefined,
              expires_at: account.expires_at,
              id_token: account.id_token,
              scope: account.scope,
            },
          });
          console.log('[Auth] Google Account tokens successfully updated in database.');
        } catch (dbErr) {
          console.error('[Auth] Failed to update Account tokens in DB:', dbErr);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
