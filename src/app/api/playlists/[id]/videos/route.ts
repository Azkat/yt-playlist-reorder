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
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pageToken") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const search = searchParams.get("search");

    const youtubeClient = new YouTubeAPIClient(session.accessToken);
    let response = await youtubeClient.getPlaylistVideos(
      playlistId,
      pageToken,
      maxResults
    );

    // 検索フィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      response.items = response.items.filter(video =>
        video.title.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("プレイリスト動画取得エラー:", error);
    return NextResponse.json(
      { error: "動画の取得に失敗しました" },
      { status: 500 }
    );
  }
}