'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface VideoClientProps {
  videoData: VideoData;
}

export default function VideoClient({ videoData }: VideoClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🎬 VideoClient mounted with data:', {
      id: videoData.id,
      title: videoData.title,
      videoUrl: videoData.videoUrl,
      duration: videoData.duration,
      subtitles: videoData.subtitles?.length || 0,
      chapters: videoData.chapters?.length || 0
    });
    setMounted(true);
  }, [videoData]);

  if (!mounted) {
    console.log('⏳ VideoClient not yet mounted');
    return null;
  }

  console.log('🎬 Rendering VideoClient with video URL:', videoData.videoUrl);

  const handleProgress = (position: number) => {
    // Update progress in storage
    addToHistory({
      id: videoData.id,
      title: videoData.title,
      type: 'movie',
      position,
      duration: videoData.duration
    });
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