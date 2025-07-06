import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/drive';
import { scanStreamingLibrary } from '@/lib/drive-enhanced';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Drive API key not configured' }, { status: 500 });
    }
    
    const videoId = params.id;
    
    // Scan the library to find the video
    const library = await scanStreamingLibrary(apiKey);
    
    // Look for the video in movies
    let videoData = library.movies.find(movie => movie.id === videoId);
    
    if (!videoData) {
      // Look for the video in series episodes
      for (const [seriesName, seriesData] of Object.entries(library.series)) {
        for (const [seasonName, episodes] of Object.entries(seriesData.seasons)) {
          const episode = episodes.find(ep => ep.id === videoId);
          if (episode) {
            videoData = {
              id: episode.id,
              title: episode.title,
              type: 'series' as const,
              year: undefined,
              thumbnail: episode.thumbnail,
              path: '', // Not needed for video data
              subtitles: episode.subtitles,
              duration: episode.duration,
              resumePosition: episode.resumePosition
            };
            break;
          }
        }
        if (videoData) break;
      }
    }
    
    if (!videoData) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Get the video URL directly using getDownloadUrl
    const videoUrl = getDownloadUrl(videoId);
    
    // Generate chapters based on duration (every 10 minutes)
    const chapters = [];
    if (videoData.duration) {
      const chapterInterval = 600; // 10 minutes in seconds
      for (let i = 0; i < videoData.duration; i += chapterInterval) {
        const minutes = Math.floor(i / 60);
        chapters.push({
          time: i,
          title: `Chapter ${Math.floor(i / chapterInterval) + 1}`
        });
      }
    }
    
    return NextResponse.json({
      id: videoData.id,
      title: videoData.title,
      description: `Watch ${videoData.title} online`,
      year: videoData.year,
      duration: videoData.duration,
      videoUrl,
      subtitles: videoData.subtitles,
      chapters,
      introStart: 10,
      introEnd: 90,
      outroStart: videoData.duration ? videoData.duration - 300 : undefined
    });
    
  } catch (error) {
    console.error('Video fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch video data' }, { status: 500 });
  }
}

export async function generateStaticParams() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return [];
  const library = await scanStreamingLibrary(apiKey);
  const movieParams = library.movies.map(movie => ({ id: movie.id }));
  const episodeParams = Object.values(library.series).flatMap(seriesData =>
    Object.values(seriesData.seasons).flatMap(episodes =>
      episodes.map(ep => ({ id: ep.id }))
    )
  );
  return [...movieParams, ...episodeParams];
} 