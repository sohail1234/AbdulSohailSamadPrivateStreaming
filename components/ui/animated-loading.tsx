'use client';

import { useState, useEffect } from 'react';

interface AnimatedLoadingProps {
  text?: string;
  className?: string;
}

export function AnimatedLoading({ text = "Loading", className = "" }: AnimatedLoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-600/20 rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      {/* Animated text */}
      <div className="text-white text-lg font-medium">
        {text}
        <span className="inline-block w-8 text-left">{dots}</span>
      </div>
      
      {/* Pulse animation bars */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-red-600 rounded-full animate-pulse"
            style={{
              height: '20px',
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-zinc-800"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}