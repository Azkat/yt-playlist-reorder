import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlaylistHeaderProps {
  playlistTitle: string;
  totalVideos: number;
}

export default function PlaylistHeader({ playlistTitle, totalVideos }: PlaylistHeaderProps) {
  const router = useRouter();

  return (
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
          
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-sm text-gray-500">
              {totalVideos} videos
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}