"use client";

import { use, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SuccessMessage from "@/components/SuccessMessage";
import PlaylistHeader from "@/components/PlaylistHeader";
import VideoList from "@/components/VideoList";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import { usePlaylistEditor } from "@/hooks/usePlaylistEditor";
import { usePagination } from "@/hooks/usePagination";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

interface PlaylistEditorProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistEditor({ params }: PlaylistEditorProps) {
  const { id: playlistId } = use(params);

  // Custom hooks
  const editor = usePlaylistEditor(playlistId);
  const pagination = usePagination(playlistId);
  const dragDrop = useDragAndDrop(
    editor.videos,
    editor.setVideos,
    editor.pendingChanges,
    editor.setPendingChanges
  );

  // Fetch videos on mount and when dependencies change
  useEffect(() => {
    if (editor.status === "authenticated") {
      pagination.fetchVideos(
        editor.setVideos,
        editor.setPlaylistTitle,
        editor.setTotalVideos,
        editor.setListLoading,
        editor.setInitialLoading,
        editor.setError,
        editor.isSearching,
        editor.searchQuery,
        editor.setSelectedVideo
      );
    }
  }, [
    editor.status, 
    pagination.currentPage, 
    pagination.videosPerPage, 
    editor.searchQuery,
    playlistId
  ]);

  // Execute changes with refresh
  const handleExecuteChanges = async () => {
    const refreshData = async () => {
      // Clear page tokens and reset to page 1
      pagination.clearPageTokens();
      pagination.setCurrentPage(1);
      
      // Fetch fresh data from API
      await pagination.fetchVideos(
        editor.setVideos,
        editor.setPlaylistTitle,
        editor.setTotalVideos,
        editor.setListLoading,
        editor.setInitialLoading,
        editor.setError,
        editor.isSearching,
        editor.searchQuery,
        editor.setSelectedVideo
      );
      
      // End refreshing state
      editor.setIsRefreshing(false);
    };

    await editor.executeChanges(refreshData);
  };

  if (editor.status === "loading" || editor.initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (editor.status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlaylistHeader
        playlistTitle={editor.playlistTitle}
        totalVideos={editor.totalVideos}
      />

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <PlaylistSidebar
          pendingChanges={editor.pendingChanges}
          videos={editor.videos}
          isExecuting={editor.isExecuting}
          selectedVideo={editor.selectedVideo}
          playerTargetPosition={editor.playerTargetPosition}
          totalVideos={editor.totalVideos}
          isPlayerPositionValid={editor.isPlayerPositionValid()}
          onExecuteChanges={handleExecuteChanges}
          onCancelChanges={editor.cancelChanges}
          onPlayerPositionChange={editor.setPlayerTargetPosition}
          onPlayerPositionSubmit={editor.handlePlayerPositionSubmit}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {editor.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-sm text-red-700">{editor.error}</div>
              <button
                onClick={() => pagination.fetchVideos(
                  editor.setVideos,
                  editor.setPlaylistTitle,
                  editor.setTotalVideos,
                  editor.setListLoading,
                  editor.setInitialLoading,
                  editor.setError,
                  editor.isSearching,
                  editor.searchQuery,
                  editor.setSelectedVideo
                )}
                className="mt-2 bg-youtube-red hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          <VideoList
            videos={editor.videos}
            pendingChanges={editor.pendingChanges}
            processingVideos={editor.processingVideos}
            isRefreshing={editor.isRefreshing}
            isExecuting={editor.isExecuting}
            listLoading={editor.listLoading}
            totalVideos={editor.totalVideos}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            videosPerPage={pagination.videosPerPage}
            nextPageToken={pagination.nextPageToken}
            isSearching={editor.isSearching}
            onPositionChange={editor.handlePositionChange}
            onThumbnailClick={editor.handleThumbnailClick}
            onPageChange={pagination.handlePageChange}
            onPageSizeChange={pagination.handlePageSizeChange}
            onDragEnd={dragDrop.handleDragEnd}
          />
        </div>
      </div>

      {/* Success Message */}
      <SuccessMessage 
        show={editor.showSuccess}
        onClose={() => editor.setShowSuccess(false)}
        message={editor.successMessage}
      />
    </div>
  );
}