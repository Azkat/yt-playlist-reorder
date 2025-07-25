import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { YouTubeAPIClient } from "@/lib/youtube-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if token refresh failed
    if (session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Token expired, please sign in again" },
        { status: 401 }
      );
    }

    const youtubeClient = new YouTubeAPIClient(session.accessToken);
    const playlists = await youtubeClient.getPlaylists();

    return NextResponse.json({ playlists });
  } catch (error: unknown) {
    console.error("Playlist fetch error:", error);
    
    // Check if it's an authentication error
    const err = error as { response?: { status?: number; data?: { error?: { errors?: Array<{ reason?: string }> } } } };
    if (err?.response?.status === 401 || 
        (err?.response?.status === 403 && 
         err?.response?.data?.error?.errors?.[0]?.reason === "authError")) {
      return NextResponse.json(
        { error: "Authentication failed, please sign in again" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}