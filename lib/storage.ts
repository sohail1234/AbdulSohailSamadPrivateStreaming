export interface WatchlistItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  thumbnail?: string;
  addedAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  thumbnail?: string;
  watchedAt: string;
  position: number;
  duration?: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  autoplay: boolean;
  subtitlesEnabled: boolean;
  volume: number;
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return defaultValue;
}

export function addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): void {
  const watchlist = loadFromStorage<WatchlistItem[]>('watchlist', []);
  const existingIndex = watchlist.findIndex(w => w.id === item.id);
  
  if (existingIndex === -1) {
    watchlist.push({ ...item, addedAt: new Date().toISOString() });
    saveToStorage('watchlist', watchlist);
  }
}

export function removeFromWatchlist(id: string): void {
  const watchlist = loadFromStorage<WatchlistItem[]>('watchlist', []);
  const filtered = watchlist.filter(item => item.id !== id);
  saveToStorage('watchlist', filtered);
}

export function isInWatchlist(id: string): boolean {
  const watchlist = loadFromStorage<WatchlistItem[]>('watchlist', []);
  return watchlist.some(item => item.id === id);
}

export function getWatchlist(): WatchlistItem[] {
  return loadFromStorage<WatchlistItem[]>('watchlist', []);
}

export function addToHistory(item: Omit<HistoryItem, 'watchedAt'>): void {
  const history = loadFromStorage<HistoryItem[]>('history', []);
  const existingIndex = history.findIndex(h => h.id === item.id);
  
  if (existingIndex !== -1) {
    history[existingIndex] = { ...item, watchedAt: new Date().toISOString() };
  } else {
    history.unshift({ ...item, watchedAt: new Date().toISOString() });
  }
  
  // Keep only last 50 items
  if (history.length > 50) {
    history.splice(50);
  }
  
  saveToStorage('history', history);
}

export function getHistory(): HistoryItem[] {
  return loadFromStorage<HistoryItem[]>('history', []);
}

export function saveResumePosition(id: string, position: number): void {
  const resumeData = loadFromStorage<Record<string, number>>('resume', {});
  resumeData[id] = position;
  saveToStorage('resume', resumeData);
}

export function getResumePosition(id: string): number {
  const resumeData = loadFromStorage<Record<string, number>>('resume', {});
  return resumeData[id] || 0;
}

export function saveUserPreferences(prefs: UserPreferences): void {
  saveToStorage('preferences', prefs);
}

export function getUserPreferences(): UserPreferences {
  return loadFromStorage<UserPreferences>('preferences', {
    theme: 'dark',
    autoplay: true,
    subtitlesEnabled: true,
    volume: 0.8
  });
}