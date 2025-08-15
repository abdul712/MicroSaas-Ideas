export interface AssemblyAISegment {
  start: number
  end: number
  text: string
  confidence: number
  speaker?: string
}

export interface AssemblyAITranscriptionResponse {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text?: string
  segments?: AssemblyAISegment[]
  language_code?: string
  duration?: number
  confidence?: number
  error?: string
}

export class AssemblyAIService {
  private static instance: AssemblyAIService
  private apiKey: string
  private baseUrl = 'https://api.assemblyai.com/v2'

  private constructor() {
    if (!process.env.ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY is not set in environment variables')
    }
    this.apiKey = process.env.ASSEMBLYAI_API_KEY
  }

  static getInstance(): AssemblyAIService {
    if (!AssemblyAIService.instance) {
      AssemblyAIService.instance = new AssemblyAIService()
    }
    return AssemblyAIService.instance
  }

  async uploadFile(audioFile: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', audioFile)

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.upload_url
    } catch (error) {
      console.error('AssemblyAI upload error:', error)
      throw new Error('Failed to upload audio file')
    }
  }

  async transcribeAudio(
    audioUrl: string,
    options: {
      speakerLabels?: boolean
      autoChapters?: boolean
      punctuate?: boolean
      formatText?: boolean
      disfluencies?: boolean
      languageCode?: string
    } = {}
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript`, {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: options.speakerLabels ?? true,
          auto_chapters: options.autoChapters ?? true,
          punctuate: options.punctuate ?? true,
          format_text: options.formatText ?? true,
          filter_profanity: false,
          disfluencies: options.disfluencies ?? false,
          language_code: options.languageCode ?? 'en',
        }),
      })

      if (!response.ok) {
        throw new Error(`Transcription request failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.id
    } catch (error) {
      console.error('AssemblyAI transcription error:', error)
      throw new Error('Failed to start transcription')
    }
  }

  async getTranscription(transcriptionId: string): Promise<AssemblyAITranscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript/${transcriptionId}`, {
        method: 'GET',
        headers: {
          authorization: this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get transcription: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        id: data.id,
        status: data.status,
        text: data.text,
        segments: data.words?.map((word: any) => ({
          start: word.start,
          end: word.end,
          text: word.text,
          confidence: word.confidence,
          speaker: word.speaker,
        })),
        language_code: data.language_code,
        duration: data.audio_duration,
        confidence: data.confidence,
        error: data.error,
      }
    } catch (error) {
      console.error('AssemblyAI get transcription error:', error)
      throw new Error('Failed to retrieve transcription')
    }
  }

  async pollTranscription(
    transcriptionId: string,
    maxAttempts: number = 120,
    intervalMs: number = 5000
  ): Promise<AssemblyAITranscriptionResponse> {
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const result = await this.getTranscription(transcriptionId)

        if (result.status === 'completed') {
          return result
        }

        if (result.status === 'error') {
          throw new Error(result.error || 'Transcription failed')
        }

        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        attempts++
      } catch (error) {
        console.error(`Polling attempt ${attempts + 1} failed:`, error)
        attempts++
        
        if (attempts >= maxAttempts) {
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    throw new Error('Transcription polling timeout')
  }

  async transcribeFromFile(
    audioFile: File,
    options?: {
      speakerLabels?: boolean
      autoChapters?: boolean
      punctuate?: boolean
      formatText?: boolean
      disfluencies?: boolean
      languageCode?: string
    }
  ): Promise<AssemblyAITranscriptionResponse> {
    try {
      // Step 1: Upload the file
      const audioUrl = await this.uploadFile(audioFile)

      // Step 2: Start transcription
      const transcriptionId = await this.transcribeAudio(audioUrl, options)

      // Step 3: Poll for completion
      const result = await this.pollTranscription(transcriptionId)

      return result
    } catch (error) {
      console.error('AssemblyAI full transcription error:', error)
      throw error
    }
  }

  async getSpeakerLabels(transcriptionId: string): Promise<Array<{
    speaker: string
    start: number
    end: number
    text: string
    confidence: number
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript/${transcriptionId}/sentences`, {
        method: 'GET',
        headers: {
          authorization: this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get speaker labels: ${response.statusText}`)
      }

      const data = await response.json()
      return data.sentences || []
    } catch (error) {
      console.error('AssemblyAI speaker labels error:', error)
      throw new Error('Failed to retrieve speaker labels')
    }
  }

  async getChapters(transcriptionId: string): Promise<Array<{
    headline: string
    summary: string
    gist: string
    start: number
    end: number
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/transcript/${transcriptionId}/chapters`, {
        method: 'GET',
        headers: {
          authorization: this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get chapters: ${response.statusText}`)
      }

      const data = await response.json()
      return data.chapters || []
    } catch (error) {
      console.error('AssemblyAI chapters error:', error)
      throw new Error('Failed to retrieve chapters')
    }
  }
}