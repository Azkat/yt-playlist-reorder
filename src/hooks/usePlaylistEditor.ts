import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlaylistVideo } from "@/lib/types";
import { authFetchJson } from "@/lib/auth-fetch";
import { videoSelectionStorage } from "@/lib/video-selection-storage";

export function usePlaylistEditor(playlistId: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for videos and basic data
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState<string>("Playlist Editor");
  const [totalVideos, setTotalVideos] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for changes management
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for video player
  const [selectedVideo, setSelectedVideo] = useState<PlaylistVideo | null>(null);
  const [playerTargetPosition, setPlayerTargetPosition] = useState("");

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const handlePositionChange = (videoId: string, newPosition: number) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(videoId, newPosition);
    setPendingChanges(newChanges);
  };

  const handleThumbnailClick = (video: PlaylistVideo) => {
    // Add autoplay flag to trigger playback
    const videoWithAutoplay = { ...video, autoplay: true };
    setSelectedVideo(videoWithAutoplay);
    
    // Save the selected video to persistent storage
    videoSelectionStorage.saveSelectedVideo(playlistId, video);
    
    // Clear player position input when switching videos
    setPlayerTargetPosition("");
  };

  const isPlayerPositionValid = (): boolean => {
    if (!playerTargetPosition.trim()) return false;
    if (!selectedVideo) return false;
    const position = parseInt(playerTargetPosition, 10);
    return (
      !isNaN(position) &&
      position >= 1 &&
      position <= totalVideos &&
      position !== selectedVideo.position
    );
  };

  const handlePlayerPositionSubmit = (video: PlaylistVideo) => {
    if (!video) return;
    const position = parseInt(playerTargetPosition, 10);
    if (position >= 1 && position <= totalVideos && position !== video.position) {
      handlePositionChange(video.id, position - 1); // API uses 0-based index
      setPlayerTargetPosition("");
    }
  };

  const executeChanges = async (onRefresh?: () => Promise<void>) => {
    setIsExecuting(true);
    setError(null);
    const changeCount = pendingChanges.size;

    try {
      // Clear pending changes and start refreshing
      setPendingChanges(new Map());
      setIsRefreshing(true);

      const updates = Array.from(pendingChanges.entries()).map(([playlistItemId, position]) => {
        const video = videos.find(v => v.id === playlistItemId);
        if (!video) {
          console.error(`Video not found for playlistItemId: ${playlistItemId}`);
          return null;
        }
        return {
          playlistItemId: video.id, // This is the YouTube playlist item ID
          videoId: video.videoId,   // This is the actual YouTube video ID
          position,
        };
      }).filter(Boolean);

      await authFetchJson(`/api/playlists/${playlistId}/reorder`, {
        method: "POST",
        body: JSON.stringify({ updates }),
      });

      // Execute refresh callback to reload data
      if (onRefresh) {
        await onRefresh();
      }

      // Show success message
      const message = changeCount === 1 
        ? `1 video position updated successfully!`
        : `${changeCount} video positions updated successfully!`;
      setSuccessMessage(message);
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsRefreshing(false); // End refreshing state on error
    } finally {
      setIsExecuting(false);
      setProcessingVideos(new Set());
    }
  };

  const cancelChanges = () => {
    setPendingChanges(new Map());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  // Function to restore selected video from storage
  const restoreSelectedVideo = (currentVideos: PlaylistVideo[]) => {
    const storedVideo = videoSelectionStorage.loadSelectedVideo(playlistId);
    if (storedVideo && currentVideos.length > 0) {
      const matchingVideo = videoSelectionStorage.findMatchingVideo(storedVideo, currentVideos);
      if (matchingVideo) {
        setSelectedVideo({ ...matchingVideo, autoplay: false }); // Restore without autoplay
        return true; // Indicate that we restored a video
      }
    }
    return false; // Indicate that no video was restored
  };

  return {
    // Data
    videos,
    setVideos,
    playlistTitle,
    setPlaylistTitle,
    totalVideos,
    setTotalVideos,
    
    // Loading states
    initialLoading,
    setInitialLoading,
    listLoading,
    setListLoading,
    error,
    setError,
    
    // Changes management
    pendingChanges,
    setPendingChanges,
    isExecuting,
    isRefreshing,
    setIsRefreshing,
    processingVideos,
    setProcessingVideos,
    showSuccess,
    setShowSuccess,
    successMessage,
    
    // Video player
    selectedVideo,
    setSelectedVideo,
    playerTargetPosition,
    setPlayerTargetPosition,
    restoreSelectedVideo,
    
    // Search
    searchQuery,
    isSearching,
    
    // Actions
    handlePositionChange,
    handleThumbnailClick,
    isPlayerPositionValid,
    handlePlayerPositionSubmit,
    executeChanges,
    cancelChanges,
    handleSearch,
    clearSearch,
    
    // Auth
    session,
    status,
  };
}