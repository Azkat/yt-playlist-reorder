import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube",
          access_type: "offline",
          prompt: "consent",
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        // console.log("JWT Callback - Account:", account);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // console.log("Session Callback - Token:", token);
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  // debug: true,
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}