import { PlaylistVideo } from "@/lib/types";
import { Save, X, ArrowRight } from "lucide-react";
import { useState } from "react";

interface PendingChangesQueueProps {
  pendingChanges: Map<string, number | null>;
  videos: PlaylistVideo[];
  totalVideos: number;
  isExecuting: boolean;
  onExecuteChanges: () => void;
  onCancelChanges: () => void;
  onUpdateQueuePosition: (videoId: string, position: number) => void;
  onRemoveFromQueue: (videoId: string) => void;
}

export default function PendingChangesQueue({
  pendingChanges,
  videos,
  totalVideos,
  isExecuting,
  onExecuteChanges,
  onCancelChanges,
  onUpdateQueuePosition,
  onRemoveFromQueue,
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
      newPosition: newPosition !== null ? newPosition + 1 : null, // Convert from 0-based to 1-based, keep null as null
    };
  }).filter(item => item.video); // Filter out videos not found

  // Count valid positions for validation
  const validPositions = pendingVideos.filter(item => item.newPosition !== null).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-blue-600 text-white">
        <h4 className="text-sm font-semibold">
          Pending Changes ({pendingChanges.size})
        </h4>
        {validPositions < pendingChanges.size && (
          <p className="text-xs text-blue-100 mt-1">
            {pendingChanges.size - validPositions} item(s) need position
          </p>
        )}
      </div>

      {/* Scrollable queue list */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        <div className="space-y-2 p-4">
          {pendingVideos.map(({ video, videoId, currentPosition, newPosition }) => (
            <QueueItem
              key={videoId}
              video={video!}
              videoId={videoId}
              currentPosition={currentPosition}
              newPosition={newPosition}
              totalVideos={totalVideos}
              isExecuting={isExecuting}
              onUpdatePosition={onUpdateQueuePosition}
              onRemove={onRemoveFromQueue}
            />
          ))}
        </div>
      </div>

      {/* Fixed buttons at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={onExecuteChanges}
            disabled={isExecuting || validPositions === 0}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isExecuting ? "Applying & Refreshing..." : `Apply (${validPositions})`}</span>
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

// Individual queue item component
interface QueueItemProps {
  video: PlaylistVideo;
  videoId: string;
  currentPosition: number;
  newPosition: number | null;
  totalVideos: number;
  isExecuting: boolean;
  onUpdatePosition: (videoId: string, position: number) => void;
  onRemove: (videoId: string) => void;
}

function QueueItem({
  video,
  videoId,
  currentPosition,
  newPosition,
  totalVideos,
  isExecuting,
  onUpdatePosition,
  onRemove,
}: QueueItemProps) {
  const [targetPosition, setTargetPosition] = useState(newPosition?.toString() || "");

  const handlePositionUpdate = () => {
    const position = parseInt(targetPosition, 10);
    if (position >= 1 && position <= totalVideos && position !== currentPosition) {
      onUpdatePosition(videoId, position - 1); // Convert to 0-based for API
    }
  };

  const isValidPosition = () => {
    const position = parseInt(targetPosition, 10);
    return (
      !isNaN(position) &&
      position >= 1 &&
      position <= totalVideos &&
      position !== currentPosition
    );
  };

  const hasValidPosition = newPosition !== null;

  return (
    <div className={`relative flex items-center space-x-3 p-3 rounded-lg border ${
      hasValidPosition ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
    }`}>
      {/* Remove button - positioned at top-right */}
      <button
        onClick={() => onRemove(videoId)}
        disabled={isExecuting}
        className="absolute top-1 right-1 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
        title="Remove from queue"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Thumbnail */}
      <img
        src={video.thumbnails.medium || video.thumbnails.default}
        alt={video.title}
        width={60}
        height={34}
        className="rounded bg-gray-200 flex-shrink-0"
        style={{ 
          width: '60px', 
          height: '34px',
          objectFit: 'cover'
        }}
      />

      {/* Video info and position controls */}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-xs font-medium text-gray-900 truncate mb-2">
          {video.title}
        </p>
        
        {/* Position indicator or editor */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">#{currentPosition}</span>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              placeholder="Position"
              min={1}
              max={totalVideos}
              disabled={isExecuting}
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handlePositionUpdate}
              disabled={!isValidPosition() || isExecuting}
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasValidPosition ? "Update" : "Set"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}