import { PlaylistVideo } from "@/lib/types";
import VideoItem from "./VideoItem";
import PaginationControls from "./PaginationControls";
import LoadingSpinner from "./ui/LoadingSpinner";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface VideoListProps {
  videos: PlaylistVideo[];
  pendingChanges: Map<string, number>;
  processingVideos: Set<string>;
  isRefreshing: boolean;
  isExecuting: boolean;
  listLoading: boolean;
  totalVideos: number;
  currentPage: number;
  totalPages: number;
  videosPerPage: number;
  nextPageToken?: string;
  isSearching: boolean;
  onPositionChange: (videoId: string, newPosition: number) => void;
  onThumbnailClick: (video: PlaylistVideo) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDragEnd: (event: import('@dnd-kit/core').DragEndEvent) => void;
}

export default function VideoList({
  videos,
  pendingChanges,
  processingVideos,
  isRefreshing,
  isExecuting,
  listLoading,
  totalVideos,
  currentPage,
  totalPages,
  videosPerPage,
  nextPageToken,
  isSearching,
  onPositionChange,
  onThumbnailClick,
  onPageChange,
  onPageSizeChange,
  onDragEnd,
}: VideoListProps) {
  if (!videos || videos.length === 0 && !listLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {isSearching ? "No search results found" : "No videos found"}
        </p>
      </div>
    );
  }

  return (
    <div className={isRefreshing ? "opacity-40 pointer-events-none" : ""}>
      {/* Top Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={videosPerPage}
        totalItems={totalVideos}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
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
      <DndContext 
        collisionDetection={closestCenter} 
        onDragEnd={onDragEnd}
      >
        <SortableContext 
          items={(videos || []).map(v => v.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 my-6 overflow-hidden">
            {(videos || []).map((video) => {
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
                  onPositionChange={onPositionChange}
                  isPending={isPending}
                  isProcessing={isProcessing}
                  onThumbnailClick={onThumbnailClick}
                  isDragDisabled={isExecuting || listLoading || isRefreshing}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Bottom Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={videosPerPage}
        totalItems={totalVideos}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disabled={isExecuting || listLoading || isRefreshing}
        hasNextPageToken={!!nextPageToken}
      />
    </div>
  );
}