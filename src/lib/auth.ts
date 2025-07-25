import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Refreshes an access token using the refresh token
 */
async function refreshAccessToken(token: { refreshToken: string; [key: string]: unknown }) {
  try {
    console.log("Refreshing access token...");
    
    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Failed to refresh token:", refreshedTokens);
      throw refreshedTokens;
    }

    console.log("Token refreshed successfully");
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        console.log("Initial sign in - storing tokens");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number) * 1000) {
        // console.log("Token still valid");
        return token;
      }

      // Access token has expired, try to update it
      console.log("Token expired, attempting refresh");
      return refreshAccessToken(token as { refreshToken: string; [key: string]: unknown });
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
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
    error?: string;
  }
}