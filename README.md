# StreamFlix - Private Streaming Platform

A beautiful, Netflix-style streaming platform built with Next.js that uses Google Drive for video storage. Perfect for creating your own private streaming service for home use.

## Features

- 🎬 **Netflix-inspired UI** with dark theme and smooth animations
- 📁 **Google Drive Integration** for video and subtitle storage
- 🎥 **Universal Video Player** with subtitle support and resume functionality
- 🔍 **Fuzzy Search** powered by Fuse.js for instant content discovery
- ⭐ **Watchlist & History** stored in browser localStorage
- 📱 **Responsive Design** optimized for all devices
- 🏠 **No Authentication** - perfect for home/LAN use
- 🎯 **Folder-based Organization** for series and movies

## Setup Instructions

### 1. Google Drive Setup

1. Create a folder structure in your Google Drive:
   ```
   My Drive/Streaming/
   ├── Movies/
   │   ├── movie1.mp4
   │   ├── movie1.en.vtt (subtitle file)
   │   └── movie2.mkv
   └── Series/
       └── ShowName/
           └── Season 1/
               ├── S01E01.mp4
               ├── S01E01.en.vtt
               └── S01E02.mp4
   ```

2. Get a Google Drive API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable the Google Drive API
   - Create credentials (API Key)
   - Copy the API key

### 2. Environment Configuration

1. Copy `.env.local` and add your Google Drive API key:
   ```bash
   GOOGLE_DRIVE_API_KEY=your_actual_api_key_here
   ```

### 3. Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Video Formats Supported

- MP4 (recommended)
- MKV
- WebM
- AVI
- MOV
- WMV
- FLV
- M4V

## Subtitle Formats Supported

- VTT (WebVTT) - recommended
- SRT (SubRip)

## File Naming Conventions

### Movies
- `MovieName (Year).mp4`
- `MovieName (Year).en.vtt` (subtitle)

### TV Series
- `SeriesName/Season 1/S01E01 - Episode Title.mp4`
- `SeriesName/Season 1/S01E01 - Episode Title.en.vtt` (subtitle)

## Features in Detail

### Search & Discovery
- Real-time fuzzy search across all content
- Search by title, year, or type
- Keyboard navigation support
- Instant results with thumbnails

### Video Player
- Custom HTML5 video player with full controls
- Subtitle support with multiple languages
- Resume playback from last position
- Keyboard shortcuts (Space, Arrow keys, etc.)
- Fullscreen support
- Volume control with mute

### Content Management
- Watchlist with add/remove functionality
- Viewing history with progress tracking
- Continue watching section
- Automatic progress saving

### User Experience
- Netflix-style hero banner
- Smooth hover animations
- Responsive grid layouts
- Loading states and error handling
- Clean, modern interface

## Technical Architecture

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom Netflix theme
- **UI Components**: Radix UI primitives
- **Video Player**: Custom HTML5 implementation
- **Search**: Fuse.js fuzzy search
- **Storage**: Browser localStorage for user data
- **API**: Google Drive API v3

## Development

The app is structured with:
- `app/` - Next.js 14 app router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and helpers
- `public/` - Static assets

Key components:
- `VideoPlayer` - Custom video player with controls
- `ContentGrid` - Netflix-style content grid
- `SearchBar` - Fuzzy search with results
- `HeroBanner` - Featured content showcase

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Performance

- Lazy loading for images
- Efficient video streaming
- Optimized bundle size
- Client-side caching

## Security

- No authentication required
- Local network access only
- No user data stored on server
- Google Drive API for secure file access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for personal use only. Please respect copyright laws and only use with content you own or have permission to stream.