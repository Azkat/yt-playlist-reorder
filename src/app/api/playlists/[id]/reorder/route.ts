import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { YouTubeAPIClient } from "@/lib/youtube-client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reorderSchema = z.object({
  updates: z.array(z.object({
    playlistItemId: z.string(),
    videoId: z.string(),
    position: z.number().min(0)
  }))
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const { id: playlistId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates } = reorderSchema.parse(body);

    const youtubeClient = new YouTubeAPIClient(session.accessToken);
    
    // 一括更新処理
    const updatePromises = updates.map(update => ({
      ...update,
      playlistId
    }));

    await youtubeClient.batchUpdatePositions(updatePromises);

    return NextResponse.json({ 
      success: true,
      message: "動画の並び替えが完了しました"
    });
  } catch (error) {
    console.error("動画並び替えエラー:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "リクエストデータが無効です", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "動画の並び替えに失敗しました" },
      { status: 500 }
    );
  }
}