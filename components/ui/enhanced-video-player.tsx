'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  SkipForward, 
  SkipBack,
  PictureInPicture,
  Subtitles,
  Search,
  X
} from 'lucide-react';
import { Button } from './button';
import { Slider } from './slider';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface SubtitleTrack {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

interface Chapter {
  time: number;
  title: string;
  thumbnail?: string;
}

interface VideoPlayerProps {
  src: string;
  videoId: string;
  title: string;
  subtitles?: SubtitleTrack[];
  chapters?: Chapter[];
  onProgress?: (position: number) => void;
  className?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
}

interface SubtitleSettings {
  fontSize: number;
  color: string;
  backgroundColor: string;
  fontFamily: string;
}

export function EnhancedVideoPlayer({
  src,
  videoId,
  title,
  subtitles = [],
  chapters = [],
  onProgress,
  className = "",
  introStart,
  introEnd,
  outroStart
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [showSubtitleSearch, setShowSubtitleSearch] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [subtitleSearchQuery, setSubtitleSearchQuery] = useState('');
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [showChapterPreview, setShowChapterPreview] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isInPiP, setIsInPiP] = useState(false);
  
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    fontFamily: 'Arial'
  });

  // Touch controls for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🎬 EnhancedVideoPlayer initialized with:', {
      src,
      videoId,
      title,
      subtitles: subtitles.length,
      chapters: chapters.length
    });
    
    // Test network connectivity to the video URL
    const testVideoUrl = async () => {
      try {
        console.log('🌐 Testing video URL connectivity:', src);
        const response = await fetch(src, { method: 'HEAD' });
        console.log('✅ Video URL test response:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ Video URL test failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Video URL test error:', error);
      }
    };
    
    testVideoUrl();
  }, [src, videoId, title, subtitles.length, chapters.length]);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    setIsPiPSupported('pictureInPictureEnabled' in document);
    console.log('📱 Device detection:', { isMobile, isPiPSupported });
  }, []);

  // Handle initial play state to prevent AbortError
  useEffect(() => {
    if (playerRef.current && playing) {
      // Small delay to ensure the player is ready
      const timer = setTimeout(() => {
        if (playerRef.current && playing) {
          try {
            console.log('▶️ Attempting to play video...');
            playerRef.current.getInternalPlayer()?.play().catch((error: any) => {
              console.log('❌ Playback error (non-critical):', error);
            });
          } catch (error) {
            console.log('❌ Player error (non-critical):', error);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [playing]);

  useEffect(() => {
    const savedPosition = localStorage.getItem(`resume:${videoId}`);
    if (savedPosition && playerRef.current) {
      playerRef.current.seekTo(parseFloat(savedPosition), 'seconds');
    }
  }, [videoId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!playerRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setPlaying(!playing);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerRef.current.seekTo(Math.max(0, played * duration - 10), 'seconds');
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerRef.current.seekTo(Math.min(duration, played * duration + 10), 'seconds');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          setMuted(!muted);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [playing, volume, muted, played, duration]);

  const handleProgress = useCallback((state: any) => {
    setPlayed(state.played);
    setLoaded(state.loaded);
    
    localStorage.setItem(`resume:${videoId}`, state.playedSeconds.toString());
    onProgress?.(state.playedSeconds);
  }, [videoId, onProgress]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const togglePictureInPicture = async () => {
    if (!playerRef.current) return;
    
    const video = playerRef.current.getInternalPlayer() as HTMLVideoElement;
    if (!video) return;

    try {
      if (isInPiP) {
        await document.exitPictureInPicture();
        setIsInPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsInPiP(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const skipIntro = () => {
    if (introEnd && playerRef.current) {
      playerRef.current.seekTo(introEnd, 'seconds');
    }
  };

  const skipOutro = () => {
    if (outroStart && playerRef.current) {
      playerRef.current.seekTo(duration, 'seconds');
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = (value[0] / 100) * duration;
    playerRef.current?.seekTo(seekTime, 'seconds');
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setMuted(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - seek forward
          playerRef.current?.seekTo(Math.min(duration, played * duration + 10), 'seconds');
        } else {
          // Swipe left - seek backward
          playerRef.current?.seekTo(Math.max(0, played * duration - 10), 'seconds');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          // Swipe down - decrease volume
          setVolume(Math.max(0, volume - 0.1));
        } else {
          // Swipe up - increase volume
          setVolume(Math.min(1, volume + 0.1));
        }
      }
    }
    
    setTouchStart(null);
  };

  const getCurrentChapter = () => {
    const currentTime = played * duration;
    return chapters.find((chapter, index) => {
      const nextChapter = chapters[index + 1];
      return currentTime >= chapter.time && (!nextChapter || currentTime < nextChapter.time);
    });
  };

  const shouldShowSkipIntro = () => {
    const currentTime = played * duration;
    return introStart !== undefined && introEnd !== undefined && 
           currentTime >= introStart && currentTime <= introEnd;
  };

  const shouldShowSkipOutro = () => {
    const currentTime = played * duration;
    return outroStart !== undefined && currentTime >= outroStart;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => isMobile && showControlsTemporarily()}
    >
      <ReactPlayer
        ref={playerRef}
        src={src}
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        crossOrigin="anonymous"
        preload="metadata"
        controlsList="nodownload"
        disablePictureInPicture={false}
        onProgress={(state: any) => {
          console.log('📊 Progress update:', state);
          handleProgress(state);
        }}
        onLoadedMetadata={(event: React.SyntheticEvent<HTMLVideoElement>) => {
          const duration = event.currentTarget.duration;
          console.log('⏱️ Duration set:', duration);
          setDuration(duration);
        }}
        onPlay={() => {
          console.log('▶️ Video started playing');
          setPlaying(true);
        }}
        onPause={() => {
          console.log('⏸️ Video paused');
          setPlaying(false);
        }}
        onError={(error: any) => {
          console.error('❌ Video player error:', error);
        }}
        onReady={() => {
          console.log('✅ Video player ready');
        }}
        onStart={() => {
          console.log('🚀 Video playback started');
        }}
        onEnded={() => {
          console.log('🏁 Video playback ended');
        }}
      />

      {/* Loading indicator */}
      {loaded < 0.1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Skip buttons */}
      {shouldShowSkipIntro() && (
        <div className="absolute bottom-20 right-4 z-50">
          <Button onClick={skipIntro} className="bg-red-600 hover:bg-red-700">
            Skip Intro
          </Button>
        </div>
      )}

      {shouldShowSkipOutro() && (
        <div className="absolute bottom-20 right-4 z-50">
          <Button onClick={skipOutro} className="bg-red-600 hover:bg-red-700">
            Skip Outro
          </Button>
        </div>
      )}

      {/* Chapter indicator */}
      {getCurrentChapter() && (
        <div className="absolute top-4 left-4 z-50">
          <Badge variant="secondary" className="bg-black/80 text-white">
            {getCurrentChapter()?.title}
          </Badge>
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold truncate">{title}</h2>
          <div className="flex items-center space-x-2">
            {isPiPSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePictureInPicture}
                className="text-white hover:bg-white/20"
              >
                <PictureInPicture className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSubtitleSearch(!showSubtitleSearch)}
              className="text-white hover:bg-white/20"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
              className="text-white hover:bg-white/20"
            >
              <Subtitles className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Center play/pause for mobile */}
        {isMobile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setPlaying(!playing)}
              className="text-white hover:bg-white/20 w-20 h-20 rounded-full"
            >
              {playing ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
            </Button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
          {/* Progress bar with chapter markers */}
          <div className="relative">
            <Slider
              value={[played * 100]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            {/* Chapter markers */}
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className="absolute top-0 w-1 h-4 bg-white/60 transform -translate-x-1/2"
                style={{ left: `${(chapter.time / duration) * 100}%` }}
                title={chapter.title}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaying(!playing)}
                className="text-white hover:bg-white/20"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => playerRef.current?.seekTo(Math.max(0, played * duration - 10), 'seconds')}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => playerRef.current?.seekTo(Math.min(duration, played * duration + 10), 'seconds')}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMuted(!muted)}
                  className="text-white hover:bg-white/20"
                >
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Slider
                  value={[muted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(played * duration)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={playbackRate.toString()} onValueChange={(value) => setPlaybackRate(parseFloat(value))}>
                <SelectTrigger className="w-20 bg-transparent border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card className="absolute top-16 right-4 w-80 bg-black/90 border-white/20 z-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Playback Speed</label>
                <Select value={playbackRate.toString()} onValueChange={(value) => setPlaybackRate(parseFloat(value))}>
                  <SelectTrigger className="bg-transparent border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Subtitles</label>
                <Select value={currentSubtitle} onValueChange={setCurrentSubtitle}>
                  <SelectTrigger className="bg-transparent border-white/20 text-white">
                    <SelectValue placeholder="Select subtitles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    {subtitles.map((sub) => (
                      <SelectItem key={sub.srcLang} value={sub.srcLang}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtitle settings panel */}
      {showSubtitleSettings && (
        <Card className="absolute top-16 right-4 w-80 bg-black/90 border-white/20 z-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Subtitle Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubtitleSettings(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Font Size</label>
                <Slider
                  value={[subtitleSettings.fontSize]}
                  onValueChange={(value) => setSubtitleSettings(prev => ({ ...prev, fontSize: value[0] }))}
                  min={12}
                  max={32}
                  step={1}
                />
                <span className="text-white text-xs">{subtitleSettings.fontSize}px</span>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Font Color</label>
                <input
                  type="color"
                  value={subtitleSettings.color}
                  onChange={(e) => setSubtitleSettings(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 rounded border border-white/20"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Background</label>
                <input
                  type="color"
                  value={subtitleSettings.backgroundColor.replace('rgba(0, 0, 0, 0.8)', '#000000')}
                  onChange={(e) => setSubtitleSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-full h-8 rounded border border-white/20"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Font Family</label>
                <Select 
                  value={subtitleSettings.fontFamily} 
                  onValueChange={(value) => setSubtitleSettings(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger className="bg-transparent border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtitle search panel */}
      {showSubtitleSearch && (
        <Card className="absolute top-16 right-4 w-80 bg-black/90 border-white/20 z-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Search Subtitles</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubtitleSearch(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Input
              placeholder="Search in subtitles..."
              value={subtitleSearchQuery}
              onChange={(e) => setSubtitleSearchQuery(e.target.value)}
              className="bg-transparent border-white/20 text-white placeholder-white/60"
            />
            
            {subtitleSearchQuery && (
              <div className="mt-4 max-h-40 overflow-y-auto">
                <p className="text-white/60 text-sm">Search results would appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom subtitle styling */}
      <style jsx>{`
        ::cue {
          font-size: ${subtitleSettings.fontSize}px;
          color: ${subtitleSettings.color};
          background-color: ${subtitleSettings.backgroundColor};
          font-family: ${subtitleSettings.fontFamily};
        }
      `}</style>
    </div>
  );
}