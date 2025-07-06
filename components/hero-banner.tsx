'use client';

import { useState, useEffect } from 'react';
import { Play, Plus, Info, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/storage';

interface HeroBannerProps {
  title: string;
  description: string;
  year?: string;
  type: 'movie' | 'series';
  backgroundImage?: string;
  videoId: string;
  onPlay: () => void;
  onInfo: () => void;
  className?: string;
}

export function HeroBanner({ 
  title, 
  description, 
  year, 
  type, 
  backgroundImage, 
  videoId, 
  onPlay, 
  onInfo,
  className = ""
}: HeroBannerProps) {
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setInWatchlist(isInWatchlist(videoId));
  }, [videoId]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(videoId);
      setInWatchlist(false);
    } else {
      addToWatchlist({
        id: videoId,
        title,
        type,
        thumbnail: backgroundImage
      });
      setInWatchlist(true);
    }
  };

  return (
    <div className={`relative h-[70vh] min-h-[500px] overflow-hidden ${className}`}>
      {/* Background Image */}
      {backgroundImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-zinc-900 to-black" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant="secondary" className="text-sm">
                {type === 'movie' ? 'Movie' : 'Series'}
              </Badge>
              {year && (
                <Badge variant="outline" className="text-sm border-white text-white">
                  {year}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-300 mb-8 leading-relaxed max-w-xl">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={onPlay}
                className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Play
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={toggleWatchlist}
                className="border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3"
              >
                {inWatchlist ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    My List
                  </>
                )}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onInfo}
                className="border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3"
              >
                <Info className="w-5 h-5 mr-2" />
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}