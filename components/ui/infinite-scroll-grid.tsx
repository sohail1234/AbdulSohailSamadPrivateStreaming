'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
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
  genre?: string;
}

interface InfiniteScrollGridProps {
  items: ContentItem[];
  onPlay: (item: ContentItem) => void;
  onInfo?: (item: ContentItem) => void;
  className?: string;
  itemsPerPage?: number;
  enableHoverPreview?: boolean;
}

export function InfiniteScrollGrid({ 
  items, 
  onPlay, 
  onInfo, 
  className = "",
  itemsPerPage = 20,
  enableHoverPreview = true
}: InfiniteScrollGridProps) {
  const [displayedItems, setDisplayedItems] = useState<ContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [watchlistItems, setWatchlistItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const observerRef = useRef<IntersectionObserver>();
  const lastItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with first page
    const initialItems = items.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);
    setHasMore(items.length > itemsPerPage);
    
    // Initialize watchlist
    const watchlist = new Set(items.filter(item => isInWatchlist(item.id)).map(item => item.id));
    setWatchlistItems(watchlist);
  }, [items, itemsPerPage]);

  const loadMoreItems = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newItems = items.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < items.length);
      } else {
        setHasMore(false);
      }
      
      setLoading(false);
    }, 300);
  }, [currentPage, items, itemsPerPage, loading, hasMore]);

  const lastItemRefCallback = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreItems();
      }
    }, { threshold: 0.1 });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMoreItems]);

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

  const handleMouseEnter = (itemId: string) => {
    if (!enableHoverPreview) return;
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoveredItem(itemId);
    }, 500); // Delay before showing preview
    
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredItem(null);
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
        {displayedItems.map((item, index) => (
          <Card 
            key={item.id} 
            className={`group relative overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-105 hover:z-10 ${
              hoveredItem === item.id ? 'scale-110 z-20' : ''
            }`}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
            ref={index === displayedItems.length - 1 ? lastItemRefCallback : null}
          >
            <CardContent className="p-0">
              <div className="aspect-[2/3] relative">
                {item.thumbnail ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <div className="text-zinc-500 text-center">
                      <div className="text-2xl md:text-4xl mb-2">🎬</div>
                      <div className="text-xs md:text-sm">{item.type === 'movie' ? 'Movie' : 'Series'}</div>
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
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 md:space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onPlay(item)}
                      className="bg-white text-black hover:bg-zinc-200 text-xs md:text-sm px-2 md:px-3"
                    >
                      <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Play
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWatchlist(item)}
                      className="border-white text-white hover:bg-white hover:text-black text-xs md:text-sm px-2 md:px-3"
                    >
                      {watchlistItems.has(item.id) ? (
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </Button>
                    
                    {onInfo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInfo(item)}
                        className="border-white text-white hover:bg-white hover:text-black text-xs md:text-sm px-2 md:px-3"
                      >
                        <Info className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Hover preview */}
                {hoveredItem === item.id && enableHoverPreview && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col justify-end p-2 md:p-3 transition-all duration-300">
                    <div className="text-white">
                      <h4 className="font-semibold text-sm md:text-base mb-1 line-clamp-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 mb-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {item.year && (
                          <Badge variant="secondary" className="text-xs">
                            {item.year}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {item.type === 'movie' ? 'Movie' : 'Series'}
                        </Badge>
                        {item.genre && (
                          <Badge variant="outline" className="text-xs">
                            {item.genre}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-2 md:p-3">
                <h3 className="font-semibold text-white text-xs md:text-sm mb-1 line-clamp-1">
                  {item.title}
                </h3>
                
                <div className="flex items-center space-x-1 md:space-x-2 text-xs text-zinc-400">
                  {item.year && <span>{item.year}</span>}
                  <Badge variant="secondary" className="text-xs">
                    {item.type === 'movie' ? 'Movie' : 'Series'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Loading more content...</span>
          </div>
        </div>
      )}

      {/* End of content indicator */}
      {!hasMore && displayedItems.length > 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-400">You've reached the end of the content</p>
        </div>
      )}
    </div>
  );
}