import { PlaylistVideo } from "@/lib/types";
import PendingChangesQueue from "./PendingChangesQueue";

interface PlaylistSidebarProps {
  pendingChanges: Map<string, number | null>;
  videos: PlaylistVideo[];
  isExecuting: boolean;
  selectedVideo: PlaylistVideo | null;
  playerTargetPosition: string;
  totalVideos: number;
  isPlayerPositionValid: boolean;
  onExecuteChanges: () => void;
  onCancelChanges: () => void;
  onPlayerPositionChange: (position: string) => void;
  onPlayerPositionSubmit: (video: PlaylistVideo) => void;
  onUpdateQueuePosition: (videoId: string, position: number) => void;
  onRemoveFromQueue: (videoId: string) => void;
}

export default function PlaylistSidebar({
  pendingChanges,
  videos,
  isExecuting,
  selectedVideo,
  playerTargetPosition,
  totalVideos,
  isPlayerPositionValid,
  onExecuteChanges,
  onCancelChanges,
  onPlayerPositionChange,
  onPlayerPositionSubmit,
  onUpdateQueuePosition,
  onRemoveFromQueue,
}: PlaylistSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Video Player */}
      {selectedVideo && (
        <div className="flex-shrink-0 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-3">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=${selectedVideo.autoplay ? 1 : 0}&rel=0`}
                title={selectedVideo.title}
                width="100%"
                height="100%"
                className="absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {/* Position Controls integrated in same area */}
            <div className="flex space-x-2">
              <input
                type="number"
                value={playerTargetPosition}
                onChange={(e) => onPlayerPositionChange(e.target.value)}
                placeholder={`1-${totalVideos}`}
                min={1}
                max={totalVideos}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => onPlayerPositionSubmit(selectedVideo)}
                disabled={!isPlayerPositionValid}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  isPlayerPositionValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Changes Queue - moved below player */}
      {pendingChanges.size > 0 && (
        <div className="flex-1 flex flex-col min-h-0 mt-4 mx-4 mb-4">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <PendingChangesQueue
              pendingChanges={pendingChanges}
              videos={videos}
              totalVideos={totalVideos}
              isExecuting={isExecuting}
              onExecuteChanges={onExecuteChanges}
              onCancelChanges={onCancelChanges}
              onUpdateQueuePosition={onUpdateQueuePosition}
              onRemoveFromQueue={onRemoveFromQueue}
            />
          </div>
        </div>
      )}
    </div>
  );
}