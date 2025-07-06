import { NextRequest, NextResponse } from 'next/server';
import { scanStreamingLibrary } from '@/lib/drive-enhanced';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    console.log('[API] /api/drive/scan called');
    if (!apiKey) {
      console.error('[API] Google Drive API key not configured');
      return NextResponse.json({ error: 'Google Drive API key not configured' }, { status: 500 });
    }
    console.log('[API] Google Drive API key found, scanning library...');
    const library = await scanStreamingLibrary(apiKey);
    console.log('[API] Library scan successful:', {
      movies: library.movies.length,
      series: Object.keys(library.series).length,
      totalFiles: library.totalFiles
    });
    
    // Convert series to the format expected by the frontend
    const seriesArray = Object.entries(library.series).map(([seriesName, seriesData]) => {
      // Get the first episode for thumbnail and basic info
      const firstSeason = Object.values(seriesData.seasons)[0];
      const firstEpisode = firstSeason?.[0];
      
      return {
        id: `series-${seriesName}`,
        title: seriesName,
        type: 'series' as const,
        year: firstEpisode?.title ? extractYearFromTitle(firstEpisode.title) : undefined,
        genre: 'Drama', // Default genre, could be enhanced
        thumbnail: firstEpisode?.thumbnail || undefined,
        description: `Watch ${seriesName} online`,
        duration: firstEpisode?.duration || undefined,
        seasons: seriesData.seasons,
        subtitles: firstEpisode?.subtitles || undefined
      };
    });
    
    // Transform movies to remove path property and match expected interface
    const transformedMovies = library.movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      type: movie.type,
      year: movie.year,
      thumbnail: movie.thumbnail,
      duration: movie.duration,
      resumePosition: movie.resumePosition,
      description: `Watch ${movie.title} online`,
      genre: movie.genre,
      quality: movie.quality,
      fileSize: movie.fileSize,
      subtitles: movie.subtitles
    }));

    return NextResponse.json({
      movies: transformedMovies,
      series: seriesArray,
      totalFiles: library.totalFiles,
      lastScanned: library.lastScanned
    });
    
  } catch (error) {
    console.error('[API] Library scan error:', error);
    return NextResponse.json({ error: 'Failed to scan library' }, { status: 500 });
  }
}

function extractYearFromTitle(title: string): string | undefined {
  const yearMatch = title.match(/\((\d{4})\)|(\d{4})/);
  return yearMatch ? yearMatch[1] || yearMatch[2] : undefined;
} 