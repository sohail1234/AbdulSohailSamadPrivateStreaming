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
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) return null;
    
    const { scanStreamingLibrary } = await import('@/lib/drive-enhanced');
    const library = await scanStreamingLibrary(apiKey);
    
    // Look for the video in movies
    let videoData = library.movies.find(movie => movie.id === id);
    
    if (!videoData) {
      // Look for the video in series episodes
      for (const [seriesName, seriesData] of Object.entries(library.series)) {
        for (const [seasonName, episodes] of Object.entries(seriesData.seasons)) {
          const episode = episodes.find(ep => ep.id === id);
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
    
    if (!videoData) return null;
    
    // Get the video URL
    const { fetchFileUrl } = await import('@/lib/api');
    const videoUrl = await fetchFileUrl(videoData.id);
    
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
    
    return {
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
    
  } catch (error) {
    console.error('Video fetch error:', error);
    return null;
  }
}

export default async function WatchPage({ params }: PageProps) {
  const videoData = await getVideoData(params.id);

  if (!videoData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-2">Video Not Found</h1>
          <p className="text-zinc-400 mb-4">The requested video could not be found.</p>
          <Button className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <VideoClient videoData={videoData} />;
}