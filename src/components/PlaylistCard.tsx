import { Playlist } from "@/lib/types";
import Image from "next/image";
import { Play, Lock, Globe, Eye } from "lucide-react";

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
}

export default function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const getPrivacyIcon = () => {
    switch (playlist.privacy) {
      case "public":
        return <Globe className="w-4 h-4 text-green-600" />;
      case "unlisted":
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case "private":
        return <Lock className="w-4 h-4 text-red-600" />;
      default:
        return <Lock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
    >
      <div className="relative">
        <Image
          src={playlist.thumbnails.medium || playlist.thumbnails.default}
          alt={playlist.title}
          width={320}
          height={180}
          className="w-full h-32 object-cover"
          onError={(e) => {
            // フォールバック処理
            const target = e.target as HTMLImageElement;
            if (target.src !== playlist.thumbnails.default) {
              target.src = playlist.thumbnails.default;
            }
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {playlist.title}
          </h3>
          {getPrivacyIcon()}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {playlist.description || "説明なし"}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {playlist.itemCount} 本の動画
          </span>
          <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors">
            編集
          </button>
        </div>
      </div>
    </div>
  );
}