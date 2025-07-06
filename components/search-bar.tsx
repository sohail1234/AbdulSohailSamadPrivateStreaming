'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import Fuse from 'fuse.js';

interface SearchResult {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  thumbnail?: string;
}

interface SearchBarProps {
  items: SearchResult[];
  onSelect: (item: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ items, onSelect, placeholder = "Search movies and series...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const fuse = useRef(new Fuse(items, {
    keys: ['title', 'year'],
    threshold: 0.3,
    minMatchCharLength: 2,
    includeScore: true
  }));

  useEffect(() => {
    fuse.current = new Fuse(items, {
      keys: ['title', 'year'],
      threshold: 0.3,
      minMatchCharLength: 2,
      includeScore: true
    });
  }, [items]);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = fuse.current.search(query);
      setResults(searchResults.map(result => result.item).slice(0, 8));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (item: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(item);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:border-red-500 focus:ring-red-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border-zinc-700 shadow-xl z-50">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`flex items-center p-3 hover:bg-zinc-700 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-zinc-700' : ''
                  }`}
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
                      <span className="capitalize">{item.type}</span>
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