import { notFound } from 'next/navigation';
import VideoClient from './VideoClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  year?: string;
  duration?: number;
  videoUrl: string;
  subtitles?: Array<{
    src: string;
    srcLang: string;
    label: string;
    default?: boolean;
  }>;
  chapters?: Array<{
    time: number;
    title: string;
    thumbnail?: string;
  }>;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
}

interface PageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return [];
  const { scanStreamingLibrary } = await import('@/lib/drive-enhanced');
  const library = await scanStreamingLibrary(apiKey);
  const movieParams = library.movies.map(movie => ({ id: movie.id }));
  const episodeParams = Object.values(library.series).flatMap(seriesData =>
    Object.values(seriesData.seasons).flatMap(episodes =>
      episodes.map(ep => ({ id: ep.id }))
    )
  );
  return [...movieParams, ...episodeParams];
}

async function getVideoData(id: string): Promise<VideoData | null> {
  try {
    console.log('🎬 Getting video data for ID:', id);
    
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Drive API key not configured');
      return null;
    }
    
    const { scanStreamingLibrary } = await import('@/lib/drive-enhanced');
    console.log('📚 Scanning streaming library...');
    const library = await scanStreamingLibrary(apiKey);
    console.log('📚 Library scan complete:', {
      movies: library.movies.length,
      series: Object.keys(library.series).length
    });
    
    // Look for the video in movies
    let videoData = library.movies.find(movie => movie.id === id);
    console.log('🎬 Looking for video in movies:', videoData ? 'Found' : 'Not found');
    
    if (!videoData) {
      // Look for the video in series episodes
      console.log('📺 Looking for video in series episodes...');
      for (const [seriesName, seriesData] of Object.entries(library.series)) {
        for (const [seasonName, episodes] of Object.entries(seriesData.seasons)) {
          const episode = episodes.find(ep => ep.id === id);
          if (episode) {
            console.log('📺 Found video in series:', seriesName, 'season:', seasonName);
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
      console.error('❌ Video not found in library');
      return null;
    }
    
    // Get the video URL using our streaming API
    const videoUrl = `/api/drive/stream/${videoData.id}`;
    console.log('🔗 Generated video URL:', videoUrl);
    
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
      console.log('📖 Generated chapters:', chapters.length);
    }
    
    const result = {
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
    };
    
    console.log('✅ Video data generated successfully:', {
      id: result.id,
      title: result.title,
      duration: result.duration,
      videoUrl: result.videoUrl,
      subtitles: result.subtitles?.length || 0,
      chapters: result.chapters.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Video fetch error:', error);
    return null;
  }
}

export default async function WatchPage({ params }: PageProps) {
  console.log('🎬 WatchPage called with ID:', params.id);
  
  const videoData = await getVideoData(params.id);
  
  console.log('📊 Video data result:', videoData ? {
    id: videoData.id,
    title: videoData.title,
    videoUrl: videoData.videoUrl,
    duration: videoData.duration
  } : 'null');
  
  if (!videoData) {
    console.log('❌ No video data found, showing not found page');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Video Not Found</h1>
          <p className="text-xl">The requested video could not be found.</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ Video data found, rendering VideoClient');
  
  return <VideoClient videoData={videoData} />;
}