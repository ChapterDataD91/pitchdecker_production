import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'

const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const audio = formData.get('audio')
    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "audio" in form data' },
        { status: 400 },
      )
    }

    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 },
      )
    }

    // Upload the audio buffer to AssemblyAI
    const uploadUrl = await assemblyClient.files.upload(buffer)

    // Request transcription
    const transcript = await assemblyClient.transcripts.transcribe({
      audio_url: uploadUrl,
    })

    if (transcript.status === 'error') {
      console.error('[transcribe] AssemblyAI error:', transcript.error)
      return NextResponse.json(
        { error: `Transcription failed: ${transcript.error}` },
        { status: 502 },
      )
    }

    return NextResponse.json({
      transcript: transcript.text ?? '',
    })
  } catch (error) {
    console.error('[transcribe] Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
