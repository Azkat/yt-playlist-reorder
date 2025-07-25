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
      message: "Video reordering completed successfully"
    });
  } catch (error: unknown) {
    console.error("Reorder error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

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
      { error: "Failed to reorder videos" },
      { status: 500 }
    );
  }
}