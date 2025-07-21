import { PlaylistVideo } from "@/lib/types";
import { useState } from "react";
import { Clock, Move, ExternalLink, Play } from "lucide-react";

interface VideoItemProps {
  video: PlaylistVideo;
  currentPosition: number;
  totalVideos: number;
  onPositionChange: (videoId: string, newPosition: number) => void;
  isPending: boolean;
  isProcessing: boolean;
  onThumbnailClick: (video: PlaylistVideo) => void;
}

export default function VideoItem({
  video,
  currentPosition,
  totalVideos,
  onPositionChange,
  isPending,
  isProcessing,
  onThumbnailClick,
}: VideoItemProps) {
  const [targetPosition, setTargetPosition] = useState("");

  const handlePositionSubmit = () => {
    const position = parseInt(targetPosition, 10);
    if (position >= 1 && position <= totalVideos && position !== currentPosition) {
      onPositionChange(video.id, position - 1); // API uses 0-based index
      setTargetPosition("");
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

  const handleTitleClick = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`flex items-center p-4 bg-white border rounded-lg shadow-sm transition-all ${
        isPending ? "bg-blue-50 border-blue-200" : "border-gray-200"
      } ${isProcessing ? "opacity-50" : ""}`}
    >
      {/* Position number */}
      <div className="flex-shrink-0 w-16 text-center">
        <div className="text-sm font-medium text-gray-900">#{currentPosition}</div>
      </div>

      {/* Video thumbnail */}
      <div 
        className="flex-shrink-0 mr-4 relative cursor-pointer" 
        onClick={() => onThumbnailClick(video)}
        onMouseEnter={(e) => {
          const img = e.currentTarget.querySelector('img');
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if (img) img.style.opacity = '0.75';
          if (overlay) {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            overlay.querySelector('svg').style.opacity = '1';
          }
        }}
        onMouseLeave={(e) => {
          const img = e.currentTarget.querySelector('img');
          const overlay = e.currentTarget.querySelector('.play-overlay');
          if (img) img.style.opacity = '1';
          if (overlay) {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            overlay.querySelector('svg').style.opacity = '0';
          }
        }}
      >
        <img
          src={video.thumbnails.medium || video.thumbnails.default} // フォールバック付き
          alt={video.title}
          width={160}
          height={90}
          style={{ 
            width: '160px', 
            height: '90px',
            display: 'block',
            objectFit: 'cover',
            zIndex: '1'
          }}
          className="rounded bg-gray-200"
          onError={(e) => {
            // フォールバック: medium が失敗したら default を使用
            const target = e.target as HTMLImageElement;
            if (target.src !== video.thumbnails.default && video.thumbnails.default) {
              target.src = video.thumbnails.default;
            }
          }}
        />
        {/* Play overlay */}
        <div className="play-overlay absolute inset-0 flex items-center justify-center rounded z-10 pointer-events-none" style={{backgroundColor: 'rgba(0, 0, 0, 0)', transition: 'background-color 0.2s'}}>
          <Play className="w-8 h-8 text-white fill-current" style={{opacity: '0', transition: 'opacity 0.2s'}} />
        </div>
      </div>

      {/* Video info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate mb-1 flex items-center">
          <span className="flex-1 truncate">{video.title}</span>
          <button
            onClick={handleTitleClick}
            className="ml-2 p-1 text-blue-600 hover:text-blue-800 transition-colors group"
            title="YouTubeで開く"
          >
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </button>
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {video.description || "説明なし"}
        </p>
        <div className="flex items-center text-xs text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          <span>{video.duration || "時間不明"}</span>
        </div>
      </div>

      {/* Position change controls */}
      <div className="flex items-center space-x-3 ml-4">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={targetPosition}
            onChange={(e) => setTargetPosition(e.target.value)}
            placeholder={`1-${totalVideos}`}
            min={1}
            max={totalVideos}
            disabled={isProcessing}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handlePositionSubmit}
            disabled={!isValidPosition() || isProcessing}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${
              isValidPosition() && !isProcessing
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Move className="w-3 h-3" />
            <span>{isPending ? "保留中" : "移動"}</span>
          </button>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="ml-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
    </div>
  );
}