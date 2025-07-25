import { google, youtube_v3 } from "googleapis";
import { Playlist, PlaylistVideo, PaginatedResponse } from "./types";

// YouTube サムネイル直接URL生成（APIクォータ消費なし）
function generateYouTubeThumbnails(videoId: string) {
  if (!videoId) {
    console.warn("VideoID is empty");
    return {
      default: "",
      medium: "",
      high: "",
    };
  }

  const thumbnails = {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,     // 120x90
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,    // 320x180
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,      // 480x360
  };

  // console.log(`サムネイル生成 - VideoID: ${videoId}, Medium: ${thumbnails.medium}`);
  return thumbnails;
}

export class YouTubeAPIClient {
  private youtube: youtube_v3.Youtube;
  private oauth2Client: import('google-auth-library').OAuth2Client;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2();
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    this.youtube = google.youtube({
      version: "v3",
      auth: this.oauth2Client,
    });
  }

  async getPlaylistInfo(playlistId: string): Promise<Playlist | null> {
    try {
      const response = await this.youtube.playlists.list({
        part: ["snippet", "contentDetails"],
        id: [playlistId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      const item = response.data.items[0];
      const firstVideoThumbnail = await this.getFirstVideoThumbnail(playlistId);
      
      return {
        id: item.id!,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        thumbnails: {
          default: item.snippet?.thumbnails?.default?.url || "",
          medium: item.snippet?.thumbnails?.medium?.url || "",
          high: item.snippet?.thumbnails?.high?.url || "",
        },
        itemCount: item.contentDetails?.itemCount || 0,
        privacy: item.status?.privacyStatus as 'public' | 'unlisted' | 'private' || 'private',
        publishedAt: item.snippet?.publishedAt || undefined,
        firstVideoThumbnail: firstVideoThumbnail || undefined,
      };
    } catch (error) {
      console.error("Playlist info fetch error:", error);
      return null;
    }
  }

  async getFirstVideoThumbnail(playlistId: string): Promise<string | null> {
    try {
      const response = await this.youtube.playlistItems.list({
        part: ["snippet"],
        playlistId,
        maxResults: 1, // Get only the first item
      });

      if (response.data.items && response.data.items.length > 0) {
        const videoId = response.data.items[0].snippet?.resourceId?.videoId;
        if (videoId) {
          // Use direct YouTube thumbnail URL for better reliability
          return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get first video thumbnail for playlist ${playlistId}:`, error);
      return null;
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const response = await this.youtube.playlists.list({
        part: ["snippet", "contentDetails"],
        mine: true,
        maxResults: 50,
      });

      if (!response.data.items) return [];

      const playlists = response.data.items.map((item): Playlist => ({
        id: item.id!,
        title: item.snippet?.title || "",
        description: item.snippet?.description || "",
        thumbnails: {
          // プレイリストサムネイルはAPI提供のものをそのまま使用
          // （プレイリスト自体にはvideoIdがないため）
          default: item.snippet?.thumbnails?.default?.url || "",
          medium: item.snippet?.thumbnails?.medium?.url || "",
          high: item.snippet?.thumbnails?.high?.url || "",
        },
        itemCount: item.contentDetails?.itemCount || 0,
        privacy: item.status?.privacyStatus as 'public' | 'unlisted' | 'private' || 'private',
        publishedAt: item.snippet?.publishedAt || undefined,
      }));

      // Get first video thumbnail for each playlist
      // Use Promise.allSettled to handle failures gracefully
      const thumbnailPromises = playlists.map(async (playlist) => {
        try {
          const firstVideoThumbnail = await this.getFirstVideoThumbnail(playlist.id);
          return { id: playlist.id, firstVideoThumbnail };
        } catch (error) {
          console.warn(`Failed to get thumbnail for playlist ${playlist.id}:`, error);
          return { id: playlist.id, firstVideoThumbnail: null };
        }
      });

      const thumbnailResults = await Promise.allSettled(thumbnailPromises);
      const thumbnailMap = new Map<string, string | null>();
      
      thumbnailResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          thumbnailMap.set(result.value.id, result.value.firstVideoThumbnail);
        } else {
          thumbnailMap.set(playlists[index].id, null);
        }
      });

      const playlistsWithThumbnails = playlists.map(playlist => {
        const thumbnail = thumbnailMap.get(playlist.id);
        return {
          ...playlist,
          firstVideoThumbnail: thumbnail || undefined,
        };
      });

      return playlistsWithThumbnails;
    } catch (error) {
      console.error("Playlist fetch error:", error);
      throw new Error("Failed to fetch playlists");
    }
  }

  async getPlaylistVideos(
    playlistId: string,
    pageToken?: string,
    maxResults: number = 50
  ): Promise<PaginatedResponse<PlaylistVideo>> {
    try {
      const response = await this.youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        pageToken,
        maxResults,
      });

      if (!response.data.items) {
        return { items: [], totalResults: 0 };
      }

      // 動画IDを収集
      const videoIds = response.data.items
        .map(item => item.snippet?.resourceId?.videoId)
        .filter(Boolean) as string[];

      // 動画詳細情報を取得（再生時間含む）
      let videosDetails: Array<{ id?: string; contentDetails?: { duration?: string } }> = [];
      if (videoIds.length > 0) {
        const videosResponse = await this.youtube.videos.list({
          part: ["contentDetails"],
          id: videoIds,
        });
        videosDetails = (videosResponse.data.items || []).map(item => ({
          id: item.id || undefined,
          contentDetails: item.contentDetails ? {
            duration: item.contentDetails.duration || undefined
          } : undefined
        }));
      }

      const videos: PlaylistVideo[] = response.data.items.map((item, index) => {
        const videoId = item.snippet?.resourceId?.videoId || "";
        
        // 対応する動画詳細を検索
        const videoDetail = videosDetails.find(v => v.id === videoId);
        const duration = videoDetail?.contentDetails?.duration || "";
        
        return {
          id: item.id!,
          videoId,
          title: item.snippet?.title || "",
          description: item.snippet?.description || "",
          thumbnails: generateYouTubeThumbnails(videoId),
          duration: this.formatDuration(duration),
          position: (item.snippet?.position ?? index) + 1,
          publishedAt: item.snippet?.publishedAt || "",
        };
      });

      return {
        items: videos,
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo?.totalResults || 0,
      };
    } catch (error) {
      console.error("Playlist videos fetch error:", error);
      throw new Error("Failed to fetch playlist videos");
    }
  }

  async updatePlaylistItemPosition(
    playlistItemId: string,
    playlistId: string,
    resourceId: string,
    position: number
  ): Promise<void> {
    try {
      await this.youtube.playlistItems.update({
        part: ["snippet"],
        requestBody: {
          id: playlistItemId,
          snippet: {
            playlistId,
            position,
            resourceId: {
              kind: "youtube#video",
              videoId: resourceId,
            },
          },
        },
      });
    } catch (error) {
      console.error("Playlist item update error:", error);
      throw new Error("Failed to update video position");
    }
  }

  async batchUpdatePositions(updates: Array<{
    playlistItemId: string;
    playlistId: string;
    videoId: string;
    position: number;
  }>): Promise<void> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const update of updates) {
      await this.updatePlaylistItemPosition(
        update.playlistItemId,
        update.playlistId,
        update.videoId,
        update.position
      );
      // APIレート制限を避けるため少し待機
      await delay(100);
    }
  }

  // ISO 8601 duration (PT4M13S) を人間が読みやすい形式 (4:13) に変換
  private formatDuration(duration: string): string {
    if (!duration) return "Unknown duration";
    
    try {
      // PT4M13S形式をパース
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return "時間不明";
      
      const hours = parseInt(match[1] || "0", 10);
      const minutes = parseInt(match[2] || "0", 10);
      const seconds = parseInt(match[3] || "0", 10);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
    } catch (error) {
      console.error("Duration format error:", error);
      return "Unknown duration";
    }
  }
}