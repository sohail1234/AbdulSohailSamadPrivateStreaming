import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🎬 Streaming API called for file ID:', params.id);
    console.log('🌐 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Google Drive API key not configured');
      return NextResponse.json({ error: 'Google Drive API key not configured' }, { status: 500 });
    }
    
    const fileId = params.id;
    const rangeHeader = request.headers.get('range');
    
    console.log('📡 Making request to Google Drive API for file:', fileId);
    console.log('📏 Range header:', rangeHeader);
    
    // Get the direct download URL from Google Drive API
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`,
      {
        headers: {
          'Range': rangeHeader || 'bytes=0-',
        }
      }
    );
    
    console.log('📊 Google Drive API response status:', response.status);
    console.log('📋 Google Drive API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ Failed to fetch video from Google Drive:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch video from Google Drive' }, { status: response.status });
    }
    
    // Stream the video content
    const videoStream = response.body;
    const headers = new Headers();
    
    // Copy relevant headers from Google Drive response
    if (response.headers.get('content-type')) {
      headers.set('content-type', response.headers.get('content-type')!);
      console.log('🎥 Content-Type:', response.headers.get('content-type'));
    }
    if (response.headers.get('content-length')) {
      headers.set('content-length', response.headers.get('content-length')!);
      console.log('📏 Content-Length:', response.headers.get('content-length'));
    }
    if (response.headers.get('accept-ranges')) {
      headers.set('accept-ranges', response.headers.get('accept-ranges')!);
      console.log('📐 Accept-Ranges:', response.headers.get('accept-ranges'));
    }
    if (response.headers.get('content-range')) {
      headers.set('content-range', response.headers.get('content-range')!);
      console.log('📊 Content-Range:', response.headers.get('content-range'));
    }
    
    // Add CORS headers for video streaming
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range');
    
    console.log('✅ Streaming video successfully');
    console.log('📤 Response headers:', Object.fromEntries(headers.entries()));
    
    return new NextResponse(videoStream, {
      status: response.status,
      headers
    });
    
  } catch (error) {
    console.error('❌ Video streaming error:', error);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 });
  }
}

export async function generateStaticParams() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return [];
  const { scanStreamingLibrary } = await import('@/lib/drive-enhanced');
  const library = await scanStreamingLibrary(apiKey);
  const movieParams = library.movies.map(movie => ({ id: movie.id }));
  const episodeParams = Object.values(library.series).flatMap(seriesData =>
    Object.values(seriesData.seasons).flatMap(episodes =>
      episodes.map(ep => ({ id: ep.id }))
    )
  );
  return [...movieParams, ...episodeParams];
} 