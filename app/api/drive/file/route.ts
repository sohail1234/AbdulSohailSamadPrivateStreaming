import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }
    
    const downloadUrl = getDownloadUrl(fileId);
    
    return NextResponse.json({
      url: downloadUrl,
      fileId
    });
    
  } catch (error) {
    console.error('File URL error:', error);
    return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
  }
}