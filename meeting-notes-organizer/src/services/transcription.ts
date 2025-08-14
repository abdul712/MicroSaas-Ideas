import OpenAI from 'openai'
import { createReadStream } from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
  segments?: TranscriptionSegment[]
}

export interface TranscriptionSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface SpeakerSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export class TranscriptionService {
  async transcribeAudio(
    audioBuffer: Buffer | string,
    options?: {
      language?: string
      prompt?: string
      response_format?: 'json' | 'text' | 'verbose_json'
      temperature?: number
    }
  ): Promise<TranscriptionResult> {
    try {
      let audioFile: any
      
      if (typeof audioBuffer === 'string') {
        // If it's a file path, create a read stream
        audioFile = createReadStream(audioBuffer)
      } else {
        // Convert buffer to file-like object
        audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' })
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options?.language || 'en',
        prompt: options?.prompt,
        response_format: options?.response_format || 'verbose_json',
        temperature: options?.temperature || 0,
      })

      if (typeof transcription === 'string') {
        return {
          text: transcription,
          confidence: 1.0,
          language: options?.language || 'en',
        }
      }

      return {
        text: transcription.text,
        confidence: this.calculateConfidence(transcription.segments || []),
        language: transcription.language || 'en',
        segments: transcription.segments,
      }
    } catch (error) {
      console.error('Transcription error:', error)
      throw new Error('Failed to transcribe audio')
    }
  }

  async translateAudio(audioBuffer: Buffer | string): Promise<TranscriptionResult> {
    try {
      let audioFile: any
      
      if (typeof audioBuffer === 'string') {
        audioFile = createReadStream(audioBuffer)
      } else {
        audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' })
      }

      const translation = await openai.audio.translations.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
      })

      if (typeof translation === 'string') {
        return {
          text: translation,
          confidence: 1.0,
          language: 'en',
        }
      }

      return {
        text: translation.text,
        confidence: this.calculateConfidence(translation.segments || []),
        language: 'en', // Translations are always to English
        segments: translation.segments,
      }
    } catch (error) {
      console.error('Translation error:', error)
      throw new Error('Failed to translate audio')
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts action items from meeting transcriptions. 
            Extract clear, actionable tasks from the meeting transcript. 
            Return only the action items as a JSON array of strings.
            Focus on tasks that have clear ownership or next steps.
            Do not include general discussion points or decisions unless they require action.`
          },
          {
            role: 'user',
            content: `Extract action items from this meeting transcript:\n\n${text}`
          }
        ],
        temperature: 0.1,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return []

      try {
        const actionItems = JSON.parse(response)
        return Array.isArray(actionItems) ? actionItems : []
      } catch {
        // If JSON parsing fails, try to extract manually
        const lines = response.split('\n').filter(line => line.trim())
        return lines.map(line => line.replace(/^[•\-\*\d\.]\s*/, '').trim()).filter(Boolean)
      }
    } catch (error) {
      console.error('Action items extraction error:', error)
      return []
    }
  }

  async extractDecisions(text: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts decisions from meeting transcriptions.
            Extract clear decisions that were made during the meeting.
            Return only the decisions as a JSON array of strings.
            Focus on concrete decisions, not ongoing discussions or options being considered.`
          },
          {
            role: 'user',
            content: `Extract decisions from this meeting transcript:\n\n${text}`
          }
        ],
        temperature: 0.1,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return []

      try {
        const decisions = JSON.parse(response)
        return Array.isArray(decisions) ? decisions : []
      } catch {
        const lines = response.split('\n').filter(line => line.trim())
        return lines.map(line => line.replace(/^[•\-\*\d\.]\s*/, '').trim()).filter(Boolean)
      }
    } catch (error) {
      console.error('Decisions extraction error:', error)
      return []
    }
  }

  async generateSummary(text: string, maxLength: number = 500): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that creates concise meeting summaries.
            Create a clear, professional summary of the meeting transcript.
            Focus on key topics discussed, main points, and outcomes.
            Keep the summary under ${maxLength} characters.`
          },
          {
            role: 'user',
            content: `Summarize this meeting transcript:\n\n${text}`
          }
        ],
        temperature: 0.2,
        max_tokens: Math.floor(maxLength / 3), // Approximate token limit
      })

      return completion.choices[0]?.message?.content?.trim() || 'No summary available'
    } catch (error) {
      console.error('Summary generation error:', error)
      return 'Summary generation failed'
    }
  }

  async identifySpeakers(segments: TranscriptionSegment[]): Promise<SpeakerSegment[]> {
    // This is a simplified implementation
    // In production, you would use a proper speaker diarization model
    const speakers: SpeakerSegment[] = []
    let currentSpeaker = 'Speaker 1'
    let speakerCount = 1

    for (const segment of segments) {
      // Simple heuristic: detect speaker changes based on pauses
      const pauseDuration = segment.start - (speakers[speakers.length - 1]?.end || 0)
      
      if (pauseDuration > 2.0 && Math.random() > 0.7) {
        // Potential speaker change
        speakerCount++
        currentSpeaker = `Speaker ${Math.min(speakerCount, 6)}` // Limit to 6 speakers
      }

      speakers.push({
        speaker: currentSpeaker,
        start: segment.start,
        end: segment.end,
        text: segment.text,
      })
    }

    return speakers
  }

  async extractKeyTopics(text: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that identifies key topics from meeting transcriptions.
            Extract the main topics and themes discussed in the meeting.
            Return only the topics as a JSON array of strings.
            Focus on concrete subjects, not vague concepts.
            Limit to the 5-7 most important topics.`
          },
          {
            role: 'user',
            content: `Extract key topics from this meeting transcript:\n\n${text}`
          }
        ],
        temperature: 0.1,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return []

      try {
        const topics = JSON.parse(response)
        return Array.isArray(topics) ? topics.slice(0, 7) : []
      } catch {
        const lines = response.split('\n').filter(line => line.trim())
        return lines.map(line => line.replace(/^[•\-\*\d\.]\s*/, '').trim()).filter(Boolean).slice(0, 7)
      }
    } catch (error) {
      console.error('Key topics extraction error:', error)
      return []
    }
  }

  private calculateConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) return 1.0

    const avgLogProb = segments.reduce((sum, segment) => {
      return sum + (segment.avg_logprob || 0)
    }, 0) / segments.length

    // Convert log probability to confidence score (0-1)
    return Math.max(0, Math.min(1, Math.exp(avgLogProb)))
  }
}

export const transcriptionService = new TranscriptionService()