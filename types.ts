
export interface Episode {
  id: string;
  title: string;
  podcastName: string;
  duration: string;
  coverImage: string;
  audioUrl: string;
  videoUrl?: string; // Added for YouTube videos
  description: string;
  publishedAt?: string;
  channelName?: string;
}

export interface Podcast {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  episodes: Episode[];
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  publishedAt: string;
  duration: string;
  channelName: string;
  channelId: string;
}

export type View = 'home' | 'queue' | 'now-playing' | 'podcast-details' | 'settings';
