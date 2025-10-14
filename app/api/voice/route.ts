import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVEN_LABS_VOICE_ID = 'NOpBlnGInO9m6vDvFkFC';

const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.4,
  use_speaker_boost: true,
};

type VoiceRequest = {
  text?: string;
};

export async function POST(request: Request) {
  noStore();

  let payload: VoiceRequest;

  try {
    payload = await request.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid JSON payload for voice synthesis', error);
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const text = payload.text?.trim();

  if (!text) {
    return NextResponse.json(
      { error: 'Text is required for voice synthesis.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error('Missing ELEVENLABS_API_KEY environment variable.');
    return NextResponse.json(
      { error: 'Voice service is not configured.' },
      { status: 500 }
    );
  }

  try {
    const elevenResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: DEFAULT_VOICE_SETTINGS,
        }),
      }
    );

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text();
      // eslint-disable-next-line no-console
      console.error('ElevenLabs API error', elevenResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to synthesise voice guidance.' },
        { status: 502 }
      );
    }

    const arrayBuffer = await elevenResponse.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Voice synthesis request failed', error);
    return NextResponse.json(
      { error: 'Unable to contact voice service.' },
      { status: 500 }
    );
  }
}
