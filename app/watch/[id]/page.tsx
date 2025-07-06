'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EnhancedVideoPlayer } from '@/components/ui/enhanced-video-player';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, MoreHorizontal } from 'lucide-react';
import { addToHistory } from '@/lib/storage';

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

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const id = params.id as string;
        
        // Fetch video data from Google Drive
        const response = await fetch(`/api/drive/video/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status}`);
        }
        
        const videoData: VideoData = await response.json();
        setVideoData(videoData);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [params.id]);

  const handleProgress = (position: number) => {
    if (videoData) {
      // Update progress in storage
      addToHistory({
        id: videoData.id,
        title: videoData.title,
        type: 'movie',
        position,
        duration: videoData.duration
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoData?.title,
          text: `Watch ${videoData?.title} on Abdul Sohail Samad Private Streaming`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-2">Video Not Found</h1>
          <p className="text-zinc-400 mb-4">{error || 'The requested video could not be found.'}</p>
          <Button onClick={handleBack} className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Enhanced Video Player */}
      <EnhancedVideoPlayer
        src={videoData.videoUrl}
        videoId={videoData.id}
        title={videoData.title}
        subtitles={videoData.subtitles}
        chapters={videoData.chapters}
        onProgress={handleProgress}
        introStart={videoData.introStart}
        introEnd={videoData.introEnd}
        outroStart={videoData.outroStart}
        className="h-screen"
      />
    </div>
  );
}