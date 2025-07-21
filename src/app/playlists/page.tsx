"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Playlist } from "@/lib/types";
import PlaylistCard from "@/components/PlaylistCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LogOut, RefreshCw } from "lucide-react";

export default function PlaylistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlaylists();
    }
  }, [status]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/playlists");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "プレイリストの取得に失敗しました");
      }

      setPlaylists(data.playlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    router.push(`/playlists/${playlistId}`);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  if (status === "loading") {
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              プレイリスト管理
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchPlaylists}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                title="更新"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラー</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchPlaylists}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    再試行
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && playlists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">プレイリストが見つかりません</p>
            <p className="text-gray-400 text-sm mt-2">
              YouTubeでプレイリストを作成してから再度お試しください
            </p>
          </div>
        )}

        {!loading && !error && playlists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => handlePlaylistClick(playlist.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}