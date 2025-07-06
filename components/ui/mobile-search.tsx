'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import Fuse from 'fuse.js';

interface SearchResult {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  thumbnail?: string;
  genre?: string;
}

interface MobileSearchProps {
  items: SearchResult[];
  onSelect: (item: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function MobileSearch({ items, onSelect, placeholder = "Search...", className = "" }: MobileSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const fuse = useRef(new Fuse(items, {
    keys: ['title', 'year', 'genre'],
    threshold: 0.3,
    minMatchCharLength: 1,
    includeScore: true
  }));

  useEffect(() => {
    fuse.current = new Fuse(items, {
      keys: ['title', 'year', 'genre'],
      threshold: 0.3,
      minMatchCharLength: 1,
      includeScore: true
    });
  }, [items]);

  useEffect(() => {
    let filteredItems = items;

    // Apply filters
    if (typeFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === typeFilter);
    }
    if (yearFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.year === yearFilter);
    }
    if (genreFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.genre === genreFilter);
    }

    if (query.length >= 1) {
      const searchResults = fuse.current.search(query);
      const filtered = searchResults
        .map(result => result.item)
        .filter(item => {
          if (typeFilter !== 'all' && item.type !== typeFilter) return false;
          if (yearFilter !== 'all' && item.year !== yearFilter) return false;
          if (genreFilter !== 'all' && item.genre !== genreFilter) return false;
          return true;
        })
        .slice(0, 20);
      setResults(filtered);
    } else {
      setResults(filteredItems.slice(0, 20));
    }
  }, [query, items, typeFilter, yearFilter, genreFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    onSelect(item);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const openSearch = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const uniqueYears = [...new Set(items.map(item => item.year).filter(Boolean))].sort().reverse();
  const uniqueGenres = [...new Set(items.map(item => item.genre).filter(Boolean))].sort();

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Mobile search trigger */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={openSearch}
          className="text-white hover:bg-white/20"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop search bar */}
      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-20 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile fullscreen search overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year!}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {uniqueGenres.length > 0 && (
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueGenres.map(genre => (
                      <SelectItem key={genre} value={genre!}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Mobile search results */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-16 h-20 bg-zinc-900 rounded overflow-hidden mr-3">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        🎬
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-zinc-400 mt-1">
                      {item.year && <span>{item.year}</span>}
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop filters */}
      {showFilters && !isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border-zinc-700 shadow-xl z-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="series">TV Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={year!}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {uniqueGenres.length > 0 && (
                <div>
                  <label className="text-white text-sm mb-2 block">Genre</label>
                  <Select value={genreFilter} onValueChange={setGenreFilter}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {uniqueGenres.map(genre => (
                        <SelectItem key={genre} value={genre!}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop search results */}
      {isOpen && results.length > 0 && (
        <Card className="hidden md:block absolute top-full left-0 right-0 mt-1 bg-zinc-800 border-zinc-700 shadow-xl z-50">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center p-3 hover:bg-zinc-700 cursor-pointer transition-colors border-b border-zinc-700 last:border-b-0"
                >
                  <div className="flex-shrink-0 w-12 h-16 bg-zinc-900 rounded overflow-hidden mr-3">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        🎬
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-zinc-400">
                      {item.year && <span>{item.year}</span>}
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}