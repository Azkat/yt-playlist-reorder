import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlaylistVideo } from "@/lib/types";
import { authFetchJson } from "@/lib/auth-fetch";

export function usePagination(playlistId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  });
  const [totalPages, setTotalPages] = useState(0);
  const [videosPerPage, setVideosPerPage] = useState(() => {
    const sizeParam = searchParams.get('size');
    return sizeParam ? Math.max(50, parseInt(sizeParam, 10)) : 50;
  });
  
  const [pageTokens, setPageTokens] = useState<Map<number, string>>(() => {
    // Try to restore page tokens from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`pageTokens_${playlistId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new Map(Object.entries(parsed).map(([k, v]) => [parseInt(k), v as string]));
        } catch {
          console.warn('Failed to parse stored page tokens');
        }
      }
    }
    return new Map();
  });
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // Sync state with URL parameters
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');
    
    const urlPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const urlSize = sizeParam ? Math.max(50, parseInt(sizeParam, 10)) : 50;
    
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
    if (urlSize !== videosPerPage) {
      setVideosPerPage(urlSize);
    }
  }, [searchParams, currentPage, videosPerPage]);

  const fetchVideos = async (
    setVideos: (videos: PlaylistVideo[]) => void,
    setPlaylistTitle: (title: string) => void,
    setTotalVideos: (count: number) => void,
    setListLoading: (loading: boolean) => void,
    setInitialLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    isSearching: boolean,
    searchQuery: string,
    restoreSelectedVideo?: (videos: PlaylistVideo[]) => boolean
  ) => {
    try {
      // Use initialLoading only for the first load, listLoading for subsequent loads
      if (currentPage === 1 && pageTokens.size === 0) {
        setInitialLoading(true);
      } else {
        setListLoading(true);
      }
      setError(null);

      // Get the page token for the current page
      const pageToken = pageTokens.get(currentPage);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: videosPerPage.toString(),
        ...(pageToken && { pageToken }),
        ...(isSearching && { search: searchQuery }),
      });

      const data = await authFetchJson(`/api/playlists/${playlistId}/videos?${params}`) as {
        items: PlaylistVideo[];
        nextPageToken?: string;
        totalResults: number;
        playlistTitle?: string;
      };

      setVideos(data.items || []);

      // Update playlist title if available
      if (data.playlistTitle) {
        setPlaylistTitle(data.playlistTitle);
      }

      // Handle video selection logic - only restore from storage, no auto-selection
      if (currentPage === 1 && !isSearching && data.items && data.items.length > 0 && restoreSelectedVideo) {
        restoreSelectedVideo(data.items);
      }

      // Store the next page token for the next page
      if (data.nextPageToken) {
        const newPageTokens = new Map(pageTokens);
        newPageTokens.set(currentPage + 1, data.nextPageToken);
        setPageTokens(newPageTokens);
        setNextPageToken(data.nextPageToken);

        // Save to sessionStorage for persistence across reloads
        if (typeof window !== 'undefined') {
          const tokensObj = Object.fromEntries(newPageTokens);
          sessionStorage.setItem(`pageTokens_${playlistId}`, JSON.stringify(tokensObj));
        }
      } else {
        setNextPageToken(undefined);
      }

      setTotalVideos(data.totalResults);
      setTotalPages(Math.ceil(data.totalResults / videosPerPage));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setInitialLoading(false);
      setListLoading(false);
    }
  };

  const clearPageTokens = () => {
    setPageTokens(new Map());
    setNextPageToken(undefined);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`pageTokens_${playlistId}`);
    }
  };

  const updateURL = (page: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('size', size.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    // Only allow moving to the next page if we have the token, or going to page 1, or going backwards
    if (page > currentPage && page > 1 && !pageTokens.has(page)) {
      return; // Don't allow jumping to pages we don't have tokens for
    }
    
    setCurrentPage(page);
    updateURL(page, videosPerPage);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setVideosPerPage(pageSize);
    setCurrentPage(1); // 表示件数変更時は1ページ目に戻る
    updateURL(1, pageSize);
    // ページトークンをクリア
    clearPageTokens();
  };

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    videosPerPage,
    pageTokens,
    nextPageToken,
    setNextPageToken,
    fetchVideos,
    clearPageTokens,
    handlePageChange,
    handlePageSizeChange,
  };
}