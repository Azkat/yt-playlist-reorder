export interface PlaylistVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  duration: string;
  position: number;
  publishedAt: string;
  autoplay?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  itemCount: number;
  privacy: 'public' | 'unlisted' | 'private';
}

export interface ChangeOperation {
  videoId: string;
  playlistItemId: string;
  fromPosition: number;
  toPosition: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  totalResults: number;
}