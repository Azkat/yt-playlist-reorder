"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlaylistVideo, ChangeOperation } from "@/lib/types";
import VideoItem from "@/components/VideoItem";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowLeft, Save, X, Search } from "lucide-react";

interface PlaylistEditorProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistEditor({ params }: PlaylistEditorProps) {
  const { id: playlistId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for videos and pagination
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [videosPerPage, setVideosPerPage] = useState(50);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<Map<number, string>>(new Map());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for changes management
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());

  // State for video player
  const [selectedVideo, setSelectedVideo] = useState<PlaylistVideo | null>(null);
  const [playerTargetPosition, setPlayerTargetPosition] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
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

      const response = await fetch(`/api/playlists/${playlistId}/videos?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "動画の取得に失敗しました");
      }

      setVideos(data.items || []);
      setTotalVideos(data.totalResults || 0);
      setTotalPages(Math.ceil((data.totalResults || 0) / videosPerPage));
      setNextPageToken(data.nextPageToken);

      // Set the first video as default selected video if none is selected (only on initial load)
      if (!selectedVideo && data.items && data.items.length > 0) {
        setSelectedVideo(data.items[0]);
      }

      // Store the next page token for the next page
      if (data.nextPageToken) {
        const newPageTokens = new Map(pageTokens);
        newPageTokens.set(currentPage + 1, data.nextPageToken);
        setPageTokens(newPageTokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setIsSearching(!!query);
    // Clear page tokens when searching
    setPageTokens(new Map());
    setNextPageToken(undefined);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setIsSearching(false);
    // Clear page tokens when clearing search
    setPageTokens(new Map());
    setNextPageToken(undefined);
  };

  const handlePageChange = (page: number) => {
    // Only allow moving to the next page if we have the token, or going to page 1, or going backwards
    if (page === 1 || page < currentPage || pageTokens.has(page)) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (pageSize: number) => {
    setVideosPerPage(pageSize);
    setCurrentPage(1); // 表示件数変更時は1ページ目に戻る
    // ページトークンをクリア
    setPageTokens(new Map());
    setNextPageToken(undefined);
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

      const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "並び替えに失敗しました");
      }

      // Clear pending changes and refresh
      setPendingChanges(new Map());
      await fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/playlists")}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Playlist Editor
              </h1>
            </div>

            {/* Actions */}
            {pendingChanges.size > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {pendingChanges.size} changes pending
                </span>
                <button
                  onClick={cancelChanges}
                  disabled={isExecuting}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={executeChanges}
                  disabled={isExecuting}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isExecuting ? "Executing..." : "Apply"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Search bar */}
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
        </div>
      </header>

      {/* Main content with fixed video player */}
      <div className="flex">
        {/* Fixed video player on left */}
        <div className="fixed left-4 top-32 w-80 z-10 bg-white shadow-lg rounded-lg overflow-hidden">
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

        {/* Right side - video list */}
        <div className="flex-1 ml-96 px-4 sm:px-6 lg:px-8 py-6">
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
            <>
              {/* Top Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={videosPerPage}
                totalItems={totalVideos}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                disabled={isExecuting || listLoading}
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
              <div className="space-y-4 my-6">
                {videos.map((video, index) => {
                  // Use the actual position from YouTube API instead of calculating
                  const actualPosition = video.position;
                  const isPending = pendingChanges.has(video.id);
                  const isProcessing = processingVideos.has(video.id);

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
                disabled={isExecuting || listLoading}
                hasNextPageToken={!!nextPageToken}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}