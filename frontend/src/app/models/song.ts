export interface Song {
  id: string;
  rank: number;
  title: string;
  artist: string;
  featuredArtists: string[];
  type: 'band' | 'solo' | string;
  genre: string;
  album?: string;
  year?: number;
  duration?: number;
  coverUrl?: string;
  previewUrl?: string;
  description?: string;
  source?: string;
}

export interface SongQuery {
  search?: string;
  genre?: string;
  artist?: string;
  type?: string;
  sort?: 'rank' | 'title' | 'artist';
  limit?: number;
}
