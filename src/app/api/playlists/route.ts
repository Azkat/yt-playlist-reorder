import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { YouTubeAPIClient } from "@/lib/youtube-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const youtubeClient = new YouTubeAPIClient(session.accessToken);
    const playlists = await youtubeClient.getPlaylists();

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("プレイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "プレイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}