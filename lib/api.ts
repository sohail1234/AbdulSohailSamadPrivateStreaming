interface LibraryResponse {
  movies: ContentItem[];
  series: ContentItem[];
  totalFiles: number;
  lastScanned: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  thumbnail?: string;
  duration?: number;
  resumePosition?: number;
  description?: string;
  genre?: string;
  quality?: string;
  fileSize?: number;
  subtitles?: SubtitleTrack[];
  seasons?: Record<string, Episode[]>;
}

interface SubtitleTrack {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

interface Episode {
  id: string;
  title: string;
  episode: number;
  season: number;
  duration?: number;
  thumbnail?: string;
  subtitles?: SubtitleTrack[];
  resumePosition?: number;
}

export async function fetchLibrary(): Promise<LibraryResponse> {
  try {
    const response = await fetch('/api/drive/scan');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch library: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching library:', error);
    throw error;
  }
}

export async function fetchFileUrl(fileId: string): Promise<string> {
  try {
    const response = await fetch(`/api/drive/file?id=${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file URL: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error fetching file URL:', error);
    throw error;
  }
}

export type { ContentItem, Episode, SubtitleTrack }; 