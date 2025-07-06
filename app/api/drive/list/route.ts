import { NextRequest, NextResponse } from 'next/server';
import { listFolderContents, findStreamingFolder, isVideoFile, isSubtitleFile, parseFilename, getSubtitleTracks } from '@/lib/drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const envRootId = process.env.GOOGLE_DRIVE_ROOT_ID;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Drive API key not configured' }, { status: 500 });
    }
    
    let folderId: string;
    
    if (!path) {
      // Use GOOGLE_DRIVE_ROOT_ID if set, otherwise find by name
      if (envRootId) {
        folderId = envRootId;
        console.log('[Drive] Using GOOGLE_DRIVE_ROOT_ID from env:', folderId);
      } else {
        const streamingFolderId = await findStreamingFolder(apiKey);
        if (!streamingFolderId) {
          return NextResponse.json({ error: 'Streaming folder not found' }, { status: 404 });
        }
        folderId = streamingFolderId;
      }
    } else {
      folderId = path;
    }
    
    const files = await listFolderContents(folderId, apiKey);
    
    // Separate folders and video files
    const folders = files.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
    const videoFiles = files.filter(file => isVideoFile(file.name));
    const subtitleFiles = files.filter(file => isSubtitleFile(file.name));
    
    // Process video files with metadata and subtitles
    const processedVideos = videoFiles.map(file => {
      const parsed = parseFilename(file.name);
      const subtitles = getSubtitleTracks(file, subtitleFiles);
      
      return {
        id: file.id,
        name: file.name,
        title: parsed.title,
        year: parsed.year,
        season: parsed.season,
        episode: parsed.episode,
        size: file.size,
        subtitles,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime
      };
    });
    
    return NextResponse.json({
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder'
      })),
      videos: processedVideos
    });
    
  } catch (error) {
    console.error('Drive API error:', error);
    return NextResponse.json({ error: 'Failed to fetch drive contents' }, { status: 500 });
  }
}