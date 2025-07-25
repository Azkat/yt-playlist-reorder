import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { YouTubeAPIClient } from "@/lib/youtube-client";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const { id: playlistId } = await context.params;
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

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const search = searchParams.get("search");

    const youtubeClient = new YouTubeAPIClient(session.accessToken);
    
    // Get playlist info and videos
    const [playlistInfo, videosResponse] = await Promise.all([
      youtubeClient.getPlaylistInfo(playlistId),
      youtubeClient.getPlaylistVideos(playlistId, pageToken, maxResults)
    ]);
    
    const response = videosResponse;

    // 検索フィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      response.items = response.items.filter(video =>
        video.title.toLowerCase().includes(searchLower)
      );
    }

    // Add playlist info to response
    return NextResponse.json({
      ...response,
      playlistTitle: playlistInfo?.title || null
    });
  } catch (error: unknown) {
    console.error("Playlist videos fetch error:", error);
    
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
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}