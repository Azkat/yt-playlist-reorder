"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlaylistVideo } from "@/lib/types";
import VideoItem from "@/components/VideoItem";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PendingChangesQueue from "@/components/PendingChangesQueue";
import SuccessMessage from "@/components/SuccessMessage";
import { authFetchJson } from "@/lib/auth-fetch";
import { ArrowLeft } from "lucide-react";

interface PlaylistEditorProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistEditor({ params }: PlaylistEditorProps) {
  const { id: playlistId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for videos and pagination
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState<string>("Playlist Editor");
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [videosPerPage, setVideosPerPage] = useState(() => {
    const sizeParam = searchParams.get('size');
    return sizeParam ? Math.max(50, parseInt(sizeParam, 10)) : 50;
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<Map<number, string>>(() => {
    // Try to restore page tokens from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`pageTokens_${playlistId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new Map(Object.entries(parsed).map(([k, v]) => [parseInt(k), v as string]));
        } catch (e) {
          console.warn('Failed to parse stored page tokens');
        }
      }
    }
    return new Map();
  });
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Sync state with URL parameters
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');
    
    const urlPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const urlSize = sizeParam ? Math.max(50, parseInt(sizeParam, 10)) : 50;
    
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
    if (urlSize !== videosPerPage) {
      setVideosPerPage(urlSize);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      // Initialize URL with current state if not already set
      const pageParam = searchParams.get('page');
      const sizeParam = searchParams.get('size');
      
      if (!pageParam || !sizeParam) {
        updateURL(currentPage, videosPerPage);
      }
      
      fetchVideos();
    }
  }, [status, currentPage, searchQuery, videosPerPage]);

  const fetchVideos = async () => {
    try {
      // Use initialLoading only for the first load, listLoading for subsequent loads
      if (videos.length === 0) {
        setInitialLoading(true);
      } else {
        setListLoading(true);
      }
      setError(null);

      // Get the page token for the current page
      const pageToken = pageTokens.get(currentPage);

      const params = new URLSearchParams({
        maxResults: videosPerPage.toString(),
        ...(pageToken && { pageToken }),
        ...(searchQuery && { search: searchQuery }),
      });

      const data = await authFetchJson(`/api/playlists/${playlistId}/videos?${params}`) as {
        items?: PlaylistVideo[];
        totalResults?: number;
        nextPageToken?: string;
        playlistTitle?: string;
      };

      setVideos(data.items || []);
      setTotalVideos(data.totalResults || 0);
      setTotalPages(Math.ceil((data.totalResults || 0) / videosPerPage));
      setNextPageToken(data.nextPageToken);

      // Update playlist title if available
      if (data.playlistTitle && playlistTitle === "Playlist Editor") {
        setPlaylistTitle(data.playlistTitle);
      }

      // Set the first video as default selected video if none is selected (only on initial load)
      if (!selectedVideo && data.items && data.items.length > 0) {
        setSelectedVideo(data.items[0]);
      }

      // Store the next page token for the next page
      if (data.nextPageToken) {
        const newPageTokens = new Map(pageTokens);
        newPageTokens.set(currentPage + 1, data.nextPageToken);
        setPageTokens(newPageTokens);
        
        // Save to sessionStorage for persistence across reloads
        if (typeof window !== 'undefined') {
          const tokensObj = Object.fromEntries(newPageTokens);
          sessionStorage.setItem(`pageTokens_${playlistId}`, JSON.stringify(tokensObj));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (videos.length === 0 || initialLoading) {
        setInitialLoading(false);
      } else {
        setListLoading(false);
      }
    }
  };

  const handlePositionChange = (videoId: string, newPosition: number) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(videoId, newPosition);
    setPendingChanges(newChanges);
  };

  const clearPageTokens = () => {
    setPageTokens(new Map());
    setNextPageToken(undefined);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`pageTokens_${playlistId}`);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setIsSearching(!!query);
    // Clear page tokens when searching
    clearPageTokens();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setIsSearching(false);
    // Clear page tokens when clearing search
    clearPageTokens();
  };

  const updateURL = (page: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('size', size.toString());
    router.replace(`/playlists/${playlistId}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    // Only allow moving to the next page if we have the token, or going to page 1, or going backwards
    if (page === 1 || page < currentPage || pageTokens.has(page)) {
      setCurrentPage(page);
      updateURL(page, videosPerPage);
    }
  };

  const handlePageSizeChange = (pageSize: number) => {
    setVideosPerPage(pageSize);
    setCurrentPage(1); // 表示件数変更時は1ページ目に戻る
    updateURL(1, pageSize);
    // ページトークンをクリア
    clearPageTokens();
  };

  const handleThumbnailClick = (video: PlaylistVideo) => {
    // Add autoplay flag to trigger playback
    setSelectedVideo({ ...video, autoplay: true });
    // Clear player position input when switching videos
    setPlayerTargetPosition("");
  };

  const isPlayerPositionValid = () => {
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
    const position = parseInt(playerTargetPosition, 10);
    if (position >= 1 && position <= totalVideos && position !== video.position) {
      handlePositionChange(video.id, position - 1); // API uses 0-based index
      setPlayerTargetPosition("");
    }
  };

  const executeChanges = async () => {
    if (pendingChanges.size === 0) return;

    const changeCount = pendingChanges.size;

    try {
      setIsExecuting(true);
      setProcessingVideos(new Set(pendingChanges.keys()));

      const updates = Array.from(pendingChanges.entries()).map(([videoId, position]) => {
        const video = videos.find(v => v.id === videoId);
        return {
          playlistItemId: video!.id,
          videoId: video!.videoId,
          position,
        };
      });

      const data = await authFetchJson(`/api/playlists/${playlistId}/reorder`, {
        method: "POST",
        body: JSON.stringify({ updates }),
      }) as { success?: boolean; message?: string };

      // Clear pending changes and start refreshing
      setPendingChanges(new Map());
      setIsRefreshing(true);
      
      // Clear page tokens to force fresh data fetch
      clearPageTokens();
      
      // Reset to first page to see changes
      setCurrentPage(1);
      updateURL(1, videosPerPage);
      
      // Add small delay to allow YouTube API to process changes
      setTimeout(async () => {
        await fetchVideos();
        // Double-check: if we're still on page 1, fetch again after another short delay
        setTimeout(async () => {
          await fetchVideos();
          setIsRefreshing(false); // End refreshing state
          
          // Show success message
          const message = changeCount === 1 
            ? "1 video position updated successfully!" 
            : `${changeCount} video positions updated successfully!`;
          setSuccessMessage(message);
          setShowSuccess(true);
          
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        }, 2000);
      }, 1000);
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

  if (status === "loading" || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.push("/playlists")}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 truncate min-w-0">
                {playlistTitle}
              </h1>
            </div>

          </div>

          {/* Search bar - Currently disabled */}
          {/* 
          <div className="pb-4">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search videos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            {isSearching && (
              <p className="mt-2 text-sm text-gray-600">
                Search results: {videos.length} videos
              </p>
            )}
          </div>
          */}
        </div>
      </header>

      {/* Main content with 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 max-w-full">
          {/* Left column - Fixed video player */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Video Player */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {selectedVideo && (
                <>
                  <div className="aspect-video bg-black">
                    <iframe
                      key={`${selectedVideo.videoId}-${selectedVideo.autoplay || 'no-autoplay'}`} // Re-render when video changes
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}?rel=0${selectedVideo.autoplay ? '&autoplay=1' : ''}`}
                      title={selectedVideo.title}
                      width="100%"
                      height="100%"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                      {selectedVideo.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>#{selectedVideo.position} • {selectedVideo.duration}</span>
                    </div>
                    
                    {/* Position change controls */}
                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={playerTargetPosition}
                          onChange={(e) => setPlayerTargetPosition(e.target.value)}
                          placeholder={`1-${totalVideos}`}
                          min={1}
                          max={totalVideos}
                          disabled={isExecuting}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        />
                        <button
                          onClick={() => selectedVideo && handlePlayerPositionSubmit(selectedVideo)}
                          disabled={!isPlayerPositionValid() || isExecuting}
                          className={`px-2 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                            isPlayerPositionValid() && !isExecuting
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <span>{selectedVideo && pendingChanges.has(selectedVideo.id) ? "Pending" : "Move"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>

              {/* Pending Changes Queue */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <PendingChangesQueue
                  pendingChanges={pendingChanges}
                  videos={videos}
                  isExecuting={isExecuting}
                  onExecuteChanges={executeChanges}
                  onCancelChanges={cancelChanges}
                />
              </div>
            </div>
          </div>

          {/* Right column - video list */}
          <div className="flex-1 min-w-0 overflow-hidden relative">
          
          {/* Refreshing overlay - transparent overlay to disable interactions */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-transparent z-50 cursor-not-allowed"></div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
              <button
                onClick={fetchVideos}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {videos.length === 0 && !listLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {isSearching ? "No search results found" : "No videos found"}
              </p>
            </div>
          ) : (
            <div className={isRefreshing ? "opacity-40 pointer-events-none" : ""}>
              {/* Top Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={videosPerPage}
                totalItems={totalVideos}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                disabled={isExecuting || listLoading || isRefreshing}
                hasNextPageToken={!!nextPageToken}
              />

              {/* Loading indicator */}
              {listLoading && (
                <div className="flex items-center justify-center py-8 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-blue-700 font-medium">Loading page...</span>
                </div>
              )}

              {/* Video list */}
              <div className="space-y-4 my-6 overflow-hidden">
                {videos.map((video, index) => {
                  // Use the actual position from YouTube API instead of calculating
                  const actualPosition = video.position;
                  const isPending = pendingChanges.has(video.id);
                  const isProcessing = processingVideos.has(video.id) || isRefreshing;

                  return (
                    <VideoItem
                      key={video.id}
                      video={video}
                      currentPosition={actualPosition}
                      totalVideos={totalVideos}
                      onPositionChange={handlePositionChange}
                      isPending={isPending}
                      isProcessing={isProcessing}
                      onThumbnailClick={handleThumbnailClick}
                    />
                  );
                })}
              </div>

              {/* Bottom Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={videosPerPage}
                totalItems={totalVideos}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                disabled={isExecuting || listLoading || isRefreshing}
                hasNextPageToken={!!nextPageToken}
              />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      <SuccessMessage 
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
      />
    </div>
  );
}