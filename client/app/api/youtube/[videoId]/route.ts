import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const videoId = params.videoId;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const videoInfo = await ytdl.getInfo(videoId);
    const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
    const bestAudio = audioFormats.find((format) => format.container === 'mp4') || audioFormats[0];

    if (!bestAudio) {
      return NextResponse.json({ error: 'No audio format available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      url: bestAudio.url,
      title: videoInfo.videoDetails.title,
      duration: parseInt(videoInfo.videoDetails.lengthSeconds),
      thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json(
      { error: 'Failed to get YouTube video info' },
      { status: 500 }
    );
  }
}