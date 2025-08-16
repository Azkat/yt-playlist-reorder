import { PlaylistVideo } from "./types";

/**
 * Utility functions for persisting selected video state across sessions
 */

const STORAGE_KEY_PREFIX = 'selectedVideo_';

export const videoSelectionStorage = {
  /**
   * Save the selected video for a playlist
   */
  saveSelectedVideo(playlistId: string, video: PlaylistVideo): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${playlistId}`;
      const videoData = {
        id: video.id,
        videoId: video.videoId,
        title: video.title,
        position: video.position,
        thumbnails: video.thumbnails,
        savedAt: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(videoData));
    } catch (error) {
      console.warn('Failed to save selected video:', error);
    }
  },

  /**
   * Load the selected video for a playlist
   */
  loadSelectedVideo(playlistId: string): Partial<PlaylistVideo> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${playlistId}`;
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const videoData = JSON.parse(stored);
      
      // Check if the data is recent (within 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - videoData.savedAt > maxAge) {
        sessionStorage.removeItem(key);
        return null;
      }

      return videoData;
    } catch (error) {
      console.warn('Failed to load selected video:', error);
      return null;
    }
  },

  /**
   * Clear the selected video for a playlist
   */
  clearSelectedVideo(playlistId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${playlistId}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear selected video:', error);
    }
  },

  /**
   * Check if a stored video matches a video from the current playlist
   */
  findMatchingVideo(storedVideo: Partial<PlaylistVideo>, currentVideos: PlaylistVideo[]): PlaylistVideo | null {
    if (!storedVideo || !currentVideos.length) return null;

    // First, try to find by playlist item ID
    let match = currentVideos.find(v => v.id === storedVideo.id);
    if (match) return match;

    // If not found by ID, try by video ID (in case playlist was reordered)
    match = currentVideos.find(v => v.videoId === storedVideo.videoId);
    if (match) return match;

    // If still not found, try by position as last resort
    if (storedVideo.position) {
      match = currentVideos.find(v => v.position === storedVideo.position);
      if (match) return match;
    }

    return null;
  }
};