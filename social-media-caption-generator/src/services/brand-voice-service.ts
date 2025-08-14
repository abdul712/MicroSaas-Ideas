import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { prisma } from '@/lib/prisma';
import { BrandVoice, User } from '@prisma/client';

// Types
export interface BrandVoiceAnalysis {
  tone: string[];
  personality: string[];
  vocabulary: string[];
  writingStyle: {
    sentenceLength: 'short' | 'medium' | 'long';
    formality: 'casual' | 'professional' | 'mixed';
    emotion: 'neutral' | 'enthusiastic' | 'warm' | 'authoritative';
  };
  topicFocus: string[];
  avoidWords: string[];
}

export interface BrandVoiceTraining {
  examples: string[];
  guidelines?: string;
  targetAudience?: string;
  industry?: string;
  brandPersonality?: string[];
}

export interface VoiceMatchResult {
  similarity: number;
  confidence: number;
  recommendations: string[];
}

// Initialize services
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

let pinecone: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });
}

// Brand Voice Service Class
export class BrandVoiceService {
  private static instance: BrandVoiceService;
  
  public static getInstance(): BrandVoiceService {
    if (!BrandVoiceService.instance) {
      BrandVoiceService.instance = new BrandVoiceService();
    }
    return BrandVoiceService.instance;
  }

  // Analyze brand voice from examples
  async analyzeBrandVoice(examples: string[]): Promise<BrandVoiceAnalysis> {
    if (examples.length === 0) {
      throw new Error('At least one example is required for brand voice analysis');
    }

    try {
      const combinedText = examples.join('\n\n');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert brand voice analyst. Analyze the provided text examples and extract detailed characteristics of the brand voice. Return a JSON object with the following structure:

{
  "tone": ["array of tone descriptors"],
  "personality": ["array of personality traits"],
  "vocabulary": ["array of characteristic words/phrases"],
  "writingStyle": {
    "sentenceLength": "short|medium|long",
    "formality": "casual|professional|mixed",
    "emotion": "neutral|enthusiastic|warm|authoritative"
  },
  "topicFocus": ["array of topic areas"],
  "avoidWords": ["words that seem inconsistent with the voice"]
}`
          },
          {
            role: 'user',
            content: `Analyze these brand voice examples and extract detailed characteristics:\n\n${combinedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to analyze brand voice');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Brand voice analysis failed:', error);
      throw new Error('Failed to analyze brand voice');
    }
  }

  // Create embeddings for brand voice
  async createBrandVoiceEmbedding(examples: string[]): Promise<number[]> {
    try {
      const combinedText = examples.join(' ').slice(0, 8000); // Limit for embeddings
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: combinedText
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Embedding creation failed:', error);
      throw new Error('Failed to create brand voice embedding');
    }
  }

  // Store brand voice in vector database
  async storeBrandVoiceVector(
    brandVoiceId: string,
    embedding: number[],
    metadata: {
      userId: string;
      organizationId?: string;
      name: string;
      description?: string;
      analysis: BrandVoiceAnalysis;
    }
  ): Promise<void> {
    if (!pinecone) {
      console.warn('Pinecone not configured, skipping vector storage');
      return;
    }

    try {
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'caption-brand-voices');
      
      await index.upsert([
        {
          id: brandVoiceId,
          values: embedding,
          metadata: {
            userId: metadata.userId,
            organizationId: metadata.organizationId,
            name: metadata.name,
            description: metadata.description,
            tone: metadata.analysis.tone.join(','),
            personality: metadata.analysis.personality.join(','),
            formality: metadata.analysis.writingStyle.formality,
            emotion: metadata.analysis.writingStyle.emotion
          }
        }
      ]);
    } catch (error) {
      console.error('Vector storage failed:', error);
      throw new Error('Failed to store brand voice vector');
    }
  }

  // Find similar brand voices
  async findSimilarBrandVoices(
    queryEmbedding: number[],
    userId: string,
    limit: number = 5
  ): Promise<Array<{ id: string; similarity: number; metadata?: any }>> {
    if (!pinecone) {
      return [];
    }

    try {
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'caption-brand-voices');
      
      const results = await index.query({
        vector: queryEmbedding,
        filter: { userId: { $eq: userId } },
        topK: limit,
        includeMetadata: true
      });

      return results.matches?.map(match => ({
        id: match.id || '',
        similarity: match.score || 0,
        metadata: match.metadata
      })) || [];
    } catch (error) {
      console.error('Similar brand voice search failed:', error);
      return [];
    }
  }

  // Create brand voice from training data
  async createBrandVoice(
    userId: string,
    organizationId: string | null,
    training: BrandVoiceTraining & { name: string; description?: string }
  ): Promise<BrandVoice> {
    try {
      // Step 1: Analyze the brand voice
      const analysis = await this.analyzeBrandVoice(training.examples);
      
      // Step 2: Create embeddings
      const embedding = await this.createBrandVoiceEmbedding(training.examples);
      
      // Step 3: Store in database
      const brandVoice = await prisma.brandVoice.create({
        data: {
          name: training.name,
          description: training.description,
          userId,
          organizationId,
          tone: analysis.tone,
          personality: analysis.personality,
          vocabulary: analysis.vocabulary,
          avoidWords: analysis.avoidWords,
          examples: training.examples,
          guidelines: training.guidelines,
          embedding: embedding as any, // Prisma will handle vector type
          usageCount: 0,
          lastUsedAt: null
        }
      });

      // Step 4: Store in vector database
      await this.storeBrandVoiceVector(brandVoice.id, embedding, {
        userId,
        organizationId: organizationId || undefined,
        name: training.name,
        description: training.description,
        analysis
      });

      return brandVoice;
    } catch (error) {
      console.error('Brand voice creation failed:', error);
      throw new Error('Failed to create brand voice');
    }
  }

  // Update brand voice with new examples
  async updateBrandVoice(
    brandVoiceId: string,
    updates: Partial<BrandVoiceTraining> & { name?: string; description?: string }
  ): Promise<BrandVoice> {
    try {
      const existingVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId }
      });

      if (!existingVoice) {
        throw new Error('Brand voice not found');
      }

      let newAnalysis: BrandVoiceAnalysis | undefined;
      let newEmbedding: number[] | undefined;

      // Re-analyze if examples changed
      if (updates.examples && updates.examples.length > 0) {
        newAnalysis = await this.analyzeBrandVoice(updates.examples);
        newEmbedding = await this.createBrandVoiceEmbedding(updates.examples);
      }

      // Update database
      const updatedVoice = await prisma.brandVoice.update({
        where: { id: brandVoiceId },
        data: {
          name: updates.name || existingVoice.name,
          description: updates.description !== undefined ? updates.description : existingVoice.description,
          tone: newAnalysis?.tone || existingVoice.tone,
          personality: newAnalysis?.personality || existingVoice.personality,
          vocabulary: newAnalysis?.vocabulary || existingVoice.vocabulary,
          avoidWords: newAnalysis?.avoidWords || existingVoice.avoidWords,
          examples: updates.examples || existingVoice.examples,
          guidelines: updates.guidelines !== undefined ? updates.guidelines : existingVoice.guidelines,
          embedding: newEmbedding ? (newEmbedding as any) : existingVoice.embedding,
          updatedAt: new Date()
        }
      });

      // Update vector database if embedding changed
      if (newEmbedding && newAnalysis) {
        await this.storeBrandVoiceVector(brandVoiceId, newEmbedding, {
          userId: existingVoice.userId,
          organizationId: existingVoice.organizationId || undefined,
          name: updatedVoice.name,
          description: updatedVoice.description || undefined,
          analysis: newAnalysis
        });
      }

      return updatedVoice;
    } catch (error) {
      console.error('Brand voice update failed:', error);
      throw new Error('Failed to update brand voice');
    }
  }

  // Apply brand voice to caption generation
  async applyBrandVoiceToCaption(
    originalCaption: string,
    brandVoiceId: string
  ): Promise<{ 
    adaptedCaption: string;
    confidence: number;
    appliedCharacteristics: string[];
  }> {
    try {
      const brandVoice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId }
      });

      if (!brandVoice) {
        throw new Error('Brand voice not found');
      }

      // Update usage tracking
      await prisma.brandVoice.update({
        where: { id: brandVoiceId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert copywriter tasked with adapting social media captions to match a specific brand voice. 

Brand Voice Characteristics:
- Tone: ${brandVoice.tone.join(', ')}
- Personality: ${brandVoice.personality.join(', ')}
- Key Vocabulary: ${brandVoice.vocabulary.join(', ')}
- Words to Avoid: ${brandVoice.avoidWords.join(', ')}

Guidelines: ${brandVoice.guidelines || 'None provided'}

Example brand voice content:
${brandVoice.examples.slice(0, 3).join('\n\n')}

Adapt the provided caption to match this brand voice while maintaining its core message and effectiveness.`
          },
          {
            role: 'user',
            content: `Original caption: "${originalCaption}"

Please adapt this caption to match the brand voice. Return a JSON object with:
{
  "adaptedCaption": "the adapted caption",
  "confidence": 0.85,
  "appliedCharacteristics": ["list of characteristics you applied"]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to adapt caption');
      }

      const result = JSON.parse(content);
      return {
        adaptedCaption: result.adaptedCaption || originalCaption,
        confidence: result.confidence || 0.7,
        appliedCharacteristics: result.appliedCharacteristics || []
      };
    } catch (error) {
      console.error('Brand voice application failed:', error);
      throw new Error('Failed to apply brand voice to caption');
    }
  }

  // Get brand voice recommendations for a caption
  async getBrandVoiceRecommendations(
    caption: string,
    userId: string,
    organizationId?: string
  ): Promise<Array<{
    brandVoice: BrandVoice;
    matchScore: number;
    reasonsForMatch: string[];
  }>> {
    try {
      // Create embedding for the caption
      const captionEmbedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: caption.slice(0, 8000)
      });

      // Find similar brand voices
      const similarVoices = await this.findSimilarBrandVoices(
        captionEmbedding.data[0]?.embedding || [],
        userId,
        5
      );

      // Get full brand voice data
      const recommendations = await Promise.all(
        similarVoices.map(async (similar) => {
          const brandVoice = await prisma.brandVoice.findUnique({
            where: { id: similar.id }
          });

          if (!brandVoice) return null;

          // Analyze why this voice matches
          const reasonsForMatch = this.generateMatchReasons(
            caption,
            brandVoice,
            similar.similarity
          );

          return {
            brandVoice,
            matchScore: similar.similarity,
            reasonsForMatch
          };
        })
      );

      return recommendations.filter(Boolean) as Array<{
        brandVoice: BrandVoice;
        matchScore: number;
        reasonsForMatch: string[];
      }>;
    } catch (error) {
      console.error('Brand voice recommendations failed:', error);
      return [];
    }
  }

  // Generate reasons why a brand voice matches a caption
  private generateMatchReasons(
    caption: string,
    brandVoice: BrandVoice,
    similarity: number
  ): string[] {
    const reasons: string[] = [];
    const captionLower = caption.toLowerCase();

    // Check tone alignment
    const toneMatches = brandVoice.tone.some(tone => 
      captionLower.includes(tone.toLowerCase())
    );
    if (toneMatches) {
      reasons.push(`Matches ${brandVoice.name}'s tone`);
    }

    // Check vocabulary overlap
    const vocabMatches = brandVoice.vocabulary.some(vocab => 
      captionLower.includes(vocab.toLowerCase())
    );
    if (vocabMatches) {
      reasons.push(`Uses similar vocabulary`);
    }

    // High similarity score
    if (similarity > 0.8) {
      reasons.push('High semantic similarity');
    } else if (similarity > 0.6) {
      reasons.push('Good semantic alignment');
    }

    // Check for avoided words (negative reason)
    const hasAvoidedWords = brandVoice.avoidWords.some(word => 
      captionLower.includes(word.toLowerCase())
    );
    if (hasAvoidedWords) {
      reasons.push('Contains words to avoid');
    }

    if (reasons.length === 0) {
      reasons.push('General style compatibility');
    }

    return reasons;
  }

  // Delete brand voice
  async deleteBrandVoice(brandVoiceId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const brandVoice = await prisma.brandVoice.findFirst({
        where: {
          id: brandVoiceId,
          userId: userId
        }
      });

      if (!brandVoice) {
        throw new Error('Brand voice not found or access denied');
      }

      // Delete from database
      await prisma.brandVoice.delete({
        where: { id: brandVoiceId }
      });

      // Delete from vector database
      if (pinecone) {
        try {
          const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'caption-brand-voices');
          await index.deleteOne(brandVoiceId);
        } catch (error) {
          console.error('Failed to delete from vector database:', error);
        }
      }
    } catch (error) {
      console.error('Brand voice deletion failed:', error);
      throw new Error('Failed to delete brand voice');
    }
  }

  // Get user's brand voices
  async getUserBrandVoices(
    userId: string,
    organizationId?: string
  ): Promise<BrandVoice[]> {
    return prisma.brandVoice.findMany({
      where: {
        userId,
        organizationId: organizationId || null
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
  }

  // Set default brand voice
  async setDefaultBrandVoice(brandVoiceId: string, userId: string): Promise<void> {
    try {
      // Remove default from all other brand voices
      await prisma.brandVoice.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // Set new default
      await prisma.brandVoice.update({
        where: {
          id: brandVoiceId,
          userId: userId
        },
        data: { isDefault: true }
      });
    } catch (error) {
      console.error('Setting default brand voice failed:', error);
      throw new Error('Failed to set default brand voice');
    }
  }
}

export const brandVoiceService = BrandVoiceService.getInstance();