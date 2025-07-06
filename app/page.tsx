'use client';

import { useState, useEffect } from 'react';
import { MobileSearch } from '@/components/ui/mobile-search';
import { InfiniteScrollGrid } from '@/components/ui/infinite-scroll-grid';
import { HeroBanner } from '@/components/hero-banner';
import { AnimatedLoading, SkeletonGrid } from '@/components/ui/animated-loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Clock, Star, TrendingUp, Film, Tv, Download, Wifi, WifiOff } from 'lucide-react';
import { getWatchlist, getHistory, type WatchlistItem, type HistoryItem } from '@/lib/storage';
import { fetchLibrary, type ContentItem } from '@/lib/api';

export default function Home() {
  const [searchItems, setSearchItems] = useState<ContentItem[]>([]);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // PWA installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load content from Google Drive
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch library data from Google Drive
        const library = await fetchLibrary();
        
        setMovies(library.movies);
        setSeries(library.series);
        setSearchItems([...library.movies, ...library.series]);
        setWatchlist(getWatchlist());
        setHistory(getHistory());
      } catch (err) {
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handlePlay = (item: ContentItem) => {
    // Navigate to player page
    if (item.type === 'movie') {
      window.location.href = `/watch/${item.id}`;
    } else {
      window.location.href = `/series/${item.id}`;
    }
  };

  const handleSearch = (item: ContentItem) => {
    handlePlay(item);
  };

  const handleInfo = (item: ContentItem) => {
    // Show info modal or navigate to details page
    console.log('Show info for:', item);
  };

  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const featuredMovie = movies[0];
  const continueWatching = history.slice(0, 6).map(h => ({
    ...h,
    resumePosition: h.position
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AnimatedLoading text="Loading your entertainment" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-2">Oops! Something went wrong</h1>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="relative z-50 bg-black/80 backdrop-blur-sm sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-8">
              <h1 className="text-red-600 text-xl md:text-2xl font-bold">Abdul Sohail Samad</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#home" className="text-white hover:text-red-500 transition-colors">Home</a>
                <a href="#movies" className="text-white hover:text-red-500 transition-colors">Movies</a>
                <a href="#series" className="text-white hover:text-red-500 transition-colors">TV Shows</a>
                <a href="#watchlist" className="text-white hover:text-red-500 transition-colors">My List</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Online/Offline indicator */}
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="hidden md:inline text-xs text-zinc-400">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Install app button */}
              {installPrompt && (
                <Button
                  onClick={installApp}
                  size="sm"
                  variant="outline"
                  className="hidden md:flex border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
              
              <MobileSearch
                items={searchItems}
                onSelect={handleSearch}
                className="w-full md:w-64"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {featuredMovie && (
        <HeroBanner
          title={featuredMovie.title}
          description={featuredMovie.description || 'Experience the ultimate entertainment adventure.'}
          year={featuredMovie.year}
          type={featuredMovie.type}
          backgroundImage={featuredMovie.thumbnail}
          videoId={featuredMovie.id}
          onPlay={() => handlePlay(featuredMovie)}
          onInfo={() => handleInfo(featuredMovie)}
        />
      )}

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-red-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Continue Watching</h2>
            </div>
            <InfiniteScrollGrid
              items={continueWatching}
              onPlay={handlePlay}
              onInfo={handleInfo}
              itemsPerPage={12}
              enableHoverPreview={true}
            />
          </section>
        )}

        {/* My List */}
        {watchlist.length > 0 && (
          <section>
            <div className="flex items-center space-x-3 mb-6">
              <Star className="w-6 h-6 text-red-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">My List</h2>
            </div>
            <InfiniteScrollGrid
              items={watchlist.map(w => ({
                id: w.id,
                title: w.title,
                type: w.type,
                thumbnail: w.thumbnail
              }))}
              onPlay={handlePlay}
              onInfo={handleInfo}
              itemsPerPage={12}
              enableHoverPreview={true}
            />
          </section>
        )}

        {/* Browse by Category */}
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Browse Content</h2>
          </div>
          
          <Tabs defaultValue="movies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md bg-zinc-800 border-zinc-700">
              <TabsTrigger value="movies" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Film className="w-4 h-4 mr-2" />
                Movies
              </TabsTrigger>
              <TabsTrigger value="series" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Tv className="w-4 h-4 mr-2" />
                TV Shows
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="movies" className="mt-6">
              <InfiniteScrollGrid
                items={movies}
                onPlay={handlePlay}
                onInfo={handleInfo}
                itemsPerPage={20}
                enableHoverPreview={true}
              />
            </TabsContent>
            
            <TabsContent value="series" className="mt-6">
              <InfiniteScrollGrid
                items={series}
                onPlay={handlePlay}
                onInfo={handleInfo}
                itemsPerPage={20}
                enableHoverPreview={true}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Install app prompt for mobile */}
        {installPrompt && (
          <section className="md:hidden">
            <Card className="bg-gradient-to-r from-red-600 to-red-700 border-red-500">
              <CardContent className="p-6 text-center">
                <h3 className="text-white text-lg font-semibold mb-2">Install App</h3>
                <p className="text-red-100 mb-4">Get the full experience with our mobile app</p>
                <Button
                  onClick={installApp}
                  className="bg-white text-red-600 hover:bg-red-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}