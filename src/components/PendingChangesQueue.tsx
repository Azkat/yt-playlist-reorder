import { PlaylistVideo } from "@/lib/types";
import { Save, X, ArrowRight } from "lucide-react";

interface PendingChangesQueueProps {
  pendingChanges: Map<string, number>;
  videos: PlaylistVideo[];
  isExecuting: boolean;
  onExecuteChanges: () => void;
  onCancelChanges: () => void;
}

export default function PendingChangesQueue({
  pendingChanges,
  videos,
  isExecuting,
  onExecuteChanges,
  onCancelChanges,
}: PendingChangesQueueProps) {
  if (pendingChanges.size === 0) {
    return null;
  }

  // Get video details for pending changes
  const pendingVideos = Array.from(pendingChanges.entries()).map(([videoId, newPosition]) => {
    const video = videos.find(v => v.id === videoId);
    return {
      video,
      videoId,
      currentPosition: video?.position || 0,
      newPosition: newPosition + 1, // Convert from 0-based to 1-based
    };
  }).filter(item => item.video); // Filter out videos not found

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-blue-600 text-white">
        <h4 className="text-sm font-semibold">
          Pending Changes ({pendingChanges.size})
        </h4>
      </div>

      {/* Scrollable queue list */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        <div className="space-y-2 p-4">
          {pendingVideos.map(({ video, videoId, currentPosition, newPosition }) => (
            <div
              key={videoId}
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              {/* Thumbnail */}
              <img
                src={video!.thumbnails.medium || video!.thumbnails.default}
                alt={video!.title}
                width={60}
                height={34}
                className="rounded bg-gray-200 flex-shrink-0"
                style={{ 
                  width: '60px', 
                  height: '34px',
                  objectFit: 'cover'
                }}
              />

              {/* Video info and position change */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate mb-1">
                  {video!.title}
                </p>
                <div className="flex items-center text-xs text-blue-700">
                  <span className="font-medium">#{currentPosition}</span>
                  <ArrowRight className="w-3 h-3 mx-1" />
                  <span className="font-medium">#{newPosition}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed buttons at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={onExecuteChanges}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isExecuting ? "Applying & Refreshing..." : "Apply"}</span>
          </button>
          <button
            onClick={onCancelChanges}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}