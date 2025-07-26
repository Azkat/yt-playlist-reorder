"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Playlist } from "@/lib/types";
import { authFetchJson } from "@/lib/auth-fetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LogOut, RefreshCw, Play, Calendar } from "lucide-react";

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
      
      const data = await authFetchJson("/api/playlists") as { playlists: Playlist[] };
      setPlaylists(data.playlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
              Playlist Manager
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchPlaylists}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
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
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchPlaylists}
                    className="bg-youtube-red hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && playlists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No playlists found</p>
            <p className="text-gray-400 text-sm mt-2">
              Create playlists on YouTube and try again
            </p>
          </div>
        )}

        {!loading && !error && playlists.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Playlists ({playlists.length})
              </h3>
              <div className="space-y-3">
                {playlists
                  .sort((a, b) => {
                    // Sort by created date (newest first)
                    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
                    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist.id)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {playlist.firstVideoThumbnail ? (
                          <img
                            src={playlist.firstVideoThumbnail}
                            alt={`${playlist.title} thumbnail`}
                            className="w-16 h-12 object-cover rounded-lg bg-gray-200"
                            onError={(e) => {
                              // Fallback to icon if thumbnail fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-12 bg-blue-100 rounded-lg flex items-center justify-center ${playlist.firstVideoThumbnail ? 'hidden' : ''}`}>
                          <Play className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {playlist.title}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span>{playlist.itemCount} videos</span>
                          {playlist.publishedAt && (
                            <>
                              <span className="mx-2">•</span>
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>
                                Created {new Date(playlist.publishedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </>
                          )}
                        </div>
                        {playlist.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        playlist.privacy === 'public' 
                          ? 'bg-green-100 text-green-800'
                          : playlist.privacy === 'unlisted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {playlist.privacy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}