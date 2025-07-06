interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  size?: string;
  createdTime: string;
  modifiedTime: string;
  thumbnailLink?: string;
  videoMediaMetadata?: {
    width: number;
    height: number;
    durationMillis: string;
  };
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
  genre?: string;
  quality?: string;
  fileSize?: number;
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

interface Chapter {
  time: number;
  title: string;
  thumbnail?: string;
}

import { findStreamingFolder, isVideoFile, isSubtitleFile, getSubtitleTracks } from './drive';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const STREAMING_FOLDER = 'Streaming';

// Enhanced file listing with metadata extraction
export async function listFolderContentsEnhanced(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const response = await fetch(
    `${DRIVE_API_URL}/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType,parents,size,createdTime,modifiedTime,thumbnailLink,videoMediaMetadata)`
  );
  
  if (!response.ok) {
    throw new Error(`Drive API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

// Batch operations for large libraries
export async function batchListFolders(folderIds: string[], apiKey: string): Promise<Record<string, DriveFile[]>> {
  const results: Record<string, DriveFile[]> = {};
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < folderIds.length; i += batchSize) {
    const batch = folderIds.slice(i, i + batchSize);
    const promises = batch.map(async (folderId) => {
      try {
        const files = await listFolderContentsEnhanced(folderId, apiKey);
        return { folderId, files };
      } catch (error) {
        console.error(`Error listing folder ${folderId}:`, error);
        return { folderId, files: [] };
      }
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ folderId, files }) => {
      results[folderId] = files;
    });
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < folderIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Enhanced filename parsing with genre extraction
export function parseFilenameEnhanced(filename: string): { 
  title: string; 
  year?: string; 
  episode?: number; 
  season?: number; 
  genre?: string;
  quality?: string;
} {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Extract year (4 digits in parentheses or standalone)
  const yearMatch = nameWithoutExt.match(/\((\d{4})\)|(\d{4})/);
  const year = yearMatch ? yearMatch[1] || yearMatch[2] : undefined;
  
  // Extract season and episode (S01E01 format)
  const episodeMatch = nameWithoutExt.match(/S(\d{1,2})E(\d{1,2})/i);
  const season = episodeMatch ? parseInt(episodeMatch[1]) : undefined;
  const episode = episodeMatch ? parseInt(episodeMatch[2]) : undefined;
  
  // Extract quality indicators
  const qualityMatch = nameWithoutExt.match(/(720p|1080p|4K|2160p|HDR|HEVC|x264|x265)/i);
  const quality = qualityMatch ? qualityMatch[1] : undefined;
  
  // Extract genre from common patterns
  const genrePatterns = [
    /\[(Action|Comedy|Drama|Horror|Thriller|Romance|Sci-Fi|Fantasy|Adventure|Crime|Mystery|Documentary|Animation)\]/i,
    /\.(Action|Comedy|Drama|Horror|Thriller|Romance|Sci-Fi|Fantasy|Adventure|Crime|Mystery|Documentary|Animation)\./i
  ];
  
  let genre: string | undefined;
  for (const pattern of genrePatterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      genre = match[1];
      break;
    }
  }
  
  // Clean title
  let title = nameWithoutExt
    .replace(/\(\d{4}\)/, '') // Remove year in parentheses
    .replace(/\d{4}/, '') // Remove standalone year
    .replace(/S\d{1,2}E\d{1,2}/i, '') // Remove season/episode
    .replace(/(720p|1080p|4K|2160p|HDR|HEVC|x264|x265)/i, '') // Remove quality indicators
    .replace(/\[(Action|Comedy|Drama|Horror|Thriller|Romance|Sci-Fi|Fantasy|Adventure|Crime|Mystery|Documentary|Animation)\]/i, '') // Remove genre tags
    .replace(/\.(Action|Comedy|Drama|Horror|Thriller|Romance|Sci-Fi|Fantasy|Adventure|Crime|Mystery|Documentary|Animation)\./i, '') // Remove genre in filename
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  return { title, year, episode, season, genre, quality };
}

// Generate thumbnail from video frame
export async function generateThumbnail(fileId: string, apiKey: string): Promise<string | null> {
  try {
    // Try to get existing thumbnail from Drive
    const response = await fetch(
      `${DRIVE_API_URL}/files/${fileId}?key=${apiKey}&fields=thumbnailLink`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.thumbnailLink) {
        return data.thumbnailLink;
      }
    }
    
    // Fallback: generate thumbnail URL (this would require server-side processing)
    // For now, return null and use placeholder
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

// Automatic folder scanning
export async function scanStreamingLibrary(apiKey: string): Promise<{
  movies: ContentItem[];
  series: Record<string, { seasons: Record<string, Episode[]> }>;
  totalFiles: number;
  lastScanned: string;
}> {
  try {
    // Use GOOGLE_DRIVE_ROOT_ID if set, otherwise find by name
    const envRootId = process.env.GOOGLE_DRIVE_ROOT_ID;
    let streamingFolderId: string | null = null;
    if (envRootId) {
      streamingFolderId = envRootId;
      console.log('[Drive] Using GOOGLE_DRIVE_ROOT_ID from env:', streamingFolderId);
    } else {
      streamingFolderId = await findStreamingFolder(apiKey);
      console.log('[Drive] Found Streaming folder by name:', streamingFolderId);
    }
    if (!streamingFolderId) {
      throw new Error('Streaming folder not found');
    }
    
    const rootContents = await listFolderContentsEnhanced(streamingFolderId, apiKey);
    const folders = rootContents.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
    
    const movies: ContentItem[] = [];
    const series: Record<string, { seasons: Record<string, Episode[]> }> = {};
    let totalFiles = 0;
    
    // Process each folder
    for (const folder of folders) {
      const folderContents = await listFolderContentsEnhanced(folder.id, apiKey);
      
      if (folder.name.toLowerCase() === 'movies') {
        // Process movies
        const videoFiles = folderContents.filter(file => isVideoFile(file.name));
        const subtitleFiles = folderContents.filter(file => isSubtitleFile(file.name));
        
        for (const videoFile of videoFiles) {
          const parsed = parseFilenameEnhanced(videoFile.name);
          const subtitles = getSubtitleTracks(videoFile, subtitleFiles);
          const thumbnail = await generateThumbnail(videoFile.id, apiKey);
          
          movies.push({
            id: videoFile.id,
            title: parsed.title,
            type: 'movie',
            year: parsed.year,
            genre: parsed.genre,
            quality: parsed.quality,
            thumbnail: thumbnail || undefined,
            path: folder.id,
            subtitles,
            duration: videoFile.videoMediaMetadata ? 
              parseInt(videoFile.videoMediaMetadata.durationMillis) / 1000 : undefined,
            fileSize: videoFile.size ? parseInt(videoFile.size) : undefined
          });
          totalFiles++;
        }
      } else {
        // Process as series
        const seriesName = folder.name;
        if (!series[seriesName]) {
          series[seriesName] = { seasons: {} };
        }
        
        // Check if this folder contains seasons or episodes directly
        const subFolders = folderContents.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
        
        if (subFolders.length > 0) {
          // Has season folders
          for (const seasonFolder of subFolders) {
            const seasonContents = await listFolderContentsEnhanced(seasonFolder.id, apiKey);
            const videoFiles = seasonContents.filter(file => isVideoFile(file.name));
            const subtitleFiles = seasonContents.filter(file => isSubtitleFile(file.name));
            
            const episodes: Episode[] = [];
            
            for (const videoFile of videoFiles) {
              const parsed = parseFilenameEnhanced(videoFile.name);
              const subtitles = getSubtitleTracks(videoFile, subtitleFiles);
              const thumbnail = await generateThumbnail(videoFile.id, apiKey);
              
              if (parsed.episode && parsed.season) {
                episodes.push({
                  id: videoFile.id,
                  title: parsed.title,
                  episode: parsed.episode,
                  season: parsed.season,
                  duration: videoFile.videoMediaMetadata ? 
                    parseInt(videoFile.videoMediaMetadata.durationMillis) / 1000 : undefined,
                  thumbnail: thumbnail || undefined,
                  subtitles
                });
                totalFiles++;
              }
            }
            
            series[seriesName].seasons[seasonFolder.name] = episodes.sort((a, b) => a.episode - b.episode);
          }
        } else {
          // Episodes directly in series folder
          const videoFiles = folderContents.filter(file => isVideoFile(file.name));
          const subtitleFiles = folderContents.filter(file => isSubtitleFile(file.name));
          
          const episodes: Episode[] = [];
          
          for (const videoFile of videoFiles) {
            const parsed = parseFilenameEnhanced(videoFile.name);
            const subtitles = getSubtitleTracks(videoFile, subtitleFiles);
            const thumbnail = await generateThumbnail(videoFile.id, apiKey);
            
            if (parsed.episode && parsed.season) {
              episodes.push({
                id: videoFile.id,
                title: parsed.title,
                episode: parsed.episode,
                season: parsed.season,
                duration: videoFile.videoMediaMetadata ? 
                  parseInt(videoFile.videoMediaMetadata.durationMillis) / 1000 : undefined,
                thumbnail: thumbnail || undefined,
                subtitles
              });
              totalFiles++;
            }
          }
          
          // Group by season
          const seasonGroups = episodes.reduce((acc, episode) => {
            const seasonKey = `Season ${episode.season}`;
            if (!acc[seasonKey]) acc[seasonKey] = [];
            acc[seasonKey].push(episode);
            return acc;
          }, {} as Record<string, Episode[]>);
          
          Object.entries(seasonGroups).forEach(([seasonName, seasonEpisodes]) => {
            series[seriesName].seasons[seasonName] = seasonEpisodes.sort((a, b) => a.episode - b.episode);
          });
        }
      }
    }
    
    return {
      movies: movies.sort((a, b) => a.title.localeCompare(b.title)),
      series,
      totalFiles,
      lastScanned: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error scanning library:', error);
    throw error;
  }
}

// Duplicate detection
export function detectDuplicates(items: ContentItem[]): ContentItem[][] {
  const duplicates: ContentItem[][] = [];
  const seen = new Map<string, ContentItem[]>();
  
  items.forEach(item => {
    const key = `${item.title.toLowerCase()}-${item.year || 'unknown'}`;
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(item);
  });
  
  seen.forEach(group => {
    if (group.length > 1) {
      duplicates.push(group);
    }
  });
  
  return duplicates;
}

// Export existing functions
export {
  listFolderContents,
  findStreamingFolder,
  getDownloadUrl,
  isVideoFile,
  isSubtitleFile,
  parseFilename,
  getSubtitleTracks
} from './drive';