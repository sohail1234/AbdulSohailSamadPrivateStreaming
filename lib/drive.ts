interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  size?: string;
  createdTime: string;
  modifiedTime: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  thumbnail?: string;
  path: string;
  subtitles?: SubtitleTrack[];
  duration?: number;
  resumePosition?: number;
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

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const STREAMING_FOLDER = 'Streaming';

export async function listFolderContents(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const response = await fetch(
    `${DRIVE_API_URL}/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType,parents,size,createdTime,modifiedTime)`
  );
  
  if (!response.ok) {
    throw new Error(`Drive API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

export async function findStreamingFolder(apiKey: string): Promise<string | null> {
  const response = await fetch(
    `${DRIVE_API_URL}/files?q=name='${STREAMING_FOLDER}'+and+mimeType='application/vnd.google-apps.folder'&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`Drive API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.files?.[0]?.id || null;
}

export function getDownloadUrl(fileId: string): string {
  // Use the direct streaming URL format for better video playback
  // This format works better for video streaming than the download URL
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.wmv', '.flv', '.m4v'];
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

export function isSubtitleFile(filename: string): boolean {
  const subtitleExtensions = ['.vtt', '.srt'];
  return subtitleExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

export function parseFilename(filename: string): { title: string; year?: string; episode?: number; season?: number } {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Extract year (4 digits in parentheses or standalone)
  const yearMatch = nameWithoutExt.match(/\((\d{4})\)|(\d{4})/);
  const year = yearMatch ? yearMatch[1] || yearMatch[2] : undefined;
  
  // Extract season and episode (S01E01 format)
  const episodeMatch = nameWithoutExt.match(/S(\d{1,2})E(\d{1,2})/i);
  const season = episodeMatch ? parseInt(episodeMatch[1]) : undefined;
  const episode = episodeMatch ? parseInt(episodeMatch[2]) : undefined;
  
  // Clean title
  let title = nameWithoutExt
    .replace(/\(\d{4}\)/, '') // Remove year in parentheses
    .replace(/\d{4}/, '') // Remove standalone year
    .replace(/S\d{1,2}E\d{1,2}/i, '') // Remove season/episode
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  return { title, year, episode, season };
}

export function getSubtitleTracks(videoFile: DriveFile, allFiles: DriveFile[]): SubtitleTrack[] {
  const videoBaseName = videoFile.name.replace(/\.[^/.]+$/, '');
  const subtitleFiles = allFiles.filter(file => 
    isSubtitleFile(file.name) && 
    file.name.startsWith(videoBaseName)
  );
  
  return subtitleFiles.map(file => {
    const langMatch = file.name.match(/\.([a-z]{2})\.(?:vtt|srt)$/i);
    const srcLang = langMatch ? langMatch[1] : 'en';
    
    return {
      src: getDownloadUrl(file.id),
      srcLang,
      label: srcLang.toUpperCase(),
      default: srcLang === 'en'
    };
  });
}