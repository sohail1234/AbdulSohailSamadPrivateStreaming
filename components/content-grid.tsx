'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/storage';

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  thumbnail?: string;
  duration?: number;
  resumePosition?: number;
  description?: string;
}

interface ContentGridProps {
  items: ContentItem[];
  onPlay: (item: ContentItem) => void;
  onInfo?: (item: ContentItem) => void;
  className?: string;
}

export function ContentGrid({ items, onPlay, onInfo, className = "" }: ContentGridProps) {
  const [watchlistItems, setWatchlistItems] = useState<Set<string>>(
    new Set(items.filter(item => isInWatchlist(item.id)).map(item => item.id))
  );

  const toggleWatchlist = (item: ContentItem) => {
    if (watchlistItems.has(item.id)) {
      removeFromWatchlist(item.id);
      setWatchlistItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title,
        type: item.type,
        thumbnail: item.thumbnail
      });
      setWatchlistItems(prev => new Set(prev).add(item.id));
    }
  };

  const getProgressPercentage = (item: ContentItem): number => {
    if (!item.resumePosition || !item.duration) return 0;
    return (item.resumePosition / item.duration) * 100;
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 ${className}`}>
      {items.map((item) => (
        <Card key={item.id} className="group relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105">
          <CardContent className="p-0">
            <div className="aspect-[2/3] relative">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <div className="text-zinc-500 text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="text-sm">{item.type === 'movie' ? 'Movie' : 'Series'}</div>
                  </div>
                </div>
              )}
              
              {/* Progress bar */}
              {item.resumePosition && item.duration && (
                <div className="absolute bottom-0 left-0 right-0 bg-zinc-800 h-1">
                  <div 
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${getProgressPercentage(item)}%` }}
                  />
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => onPlay(item)}
                    className="bg-white text-black hover:bg-zinc-200"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWatchlist(item)}
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    {watchlistItems.has(item.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {onInfo && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onInfo(item)}
                      className="border-white text-white hover:bg-white hover:text-black"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                {item.title}
              </h3>
              
              <div className="flex items-center space-x-2 text-xs text-zinc-400">
                {item.year && <span>{item.year}</span>}
                <Badge variant="secondary" className="text-xs">
                  {item.type === 'movie' ? 'Movie' : 'Series'}
                </Badge>
              </div>
              
              {item.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}