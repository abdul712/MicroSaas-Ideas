import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Types
export interface ImageAnalysisResult {
  description: string;
  objects: DetectedObject[];
  faces: FaceDetection[];
  text: ExtractedText[];
  colors: DominantColor[];
  emotions: EmotionAnalysis;
  scene: SceneAnalysis;
  safetyRating: SafetyRating;
  brandingElements: BrandingElement[];
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FaceDetection {
  confidence: number;
  emotions: {
    joy: number;
    sorrow: number;
    anger: number;
    surprise: number;
  };
  age?: string;
  gender?: string;
}

export interface ExtractedText {
  text: string;
  confidence: number;
  language?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DominantColor {
  color: string;
  percentage: number;
  hex: string;
}

export interface EmotionAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  specificEmotions: string[];
}

export interface SceneAnalysis {
  setting: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: string;
  location?: 'indoor' | 'outdoor';
  activity?: string;
}

export interface SafetyRating {
  adult: 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'very_unlikely';
  violence: 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'very_unlikely';
  racy: 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'very_unlikely';
  medical: 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'very_unlikely';
}

export interface BrandingElement {
  type: 'logo' | 'text' | 'color' | 'style';
  description: string;
  confidence: number;
}

// Initialize services
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

let visionClient: ImageAnnotatorClient | null = null;
if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
  try {
    visionClient = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
      }
    });
  } catch (error) {
    console.error('Failed to initialize Google Vision client:', error);
  }
}

// Image Analysis Service Class
export class ImageAnalysisService {
  private static instance: ImageAnalysisService;
  
  public static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  // Main image analysis function
  async analyzeImage(
    imageUrl: string,
    options: {
      includeObjects?: boolean;
      includeFaces?: boolean;
      includeText?: boolean;
      includeColors?: boolean;
      includeSafety?: boolean;
      includeBranding?: boolean;
      generateDescription?: boolean;
    } = {}
  ): Promise<ImageAnalysisResult> {
    try {
      // Set defaults
      const opts = {
        includeObjects: true,
        includeFaces: true,
        includeText: true,
        includeColors: true,
        includeSafety: true,
        includeBranding: false,
        generateDescription: true,
        ...options
      };

      // Parallel analysis with both services
      const [visionResults, openaiResults] = await Promise.allSettled([
        this.analyzeWithGoogleVision(imageUrl, opts),
        this.analyzeWithOpenAI(imageUrl, opts)
      ]);

      // Combine results
      const vision = visionResults.status === 'fulfilled' ? visionResults.value : null;
      const openai = openaiResults.status === 'fulfilled' ? openaiResults.value : null;

      return this.combineAnalysisResults(vision, openai);
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error('Failed to analyze image');
    }
  }

  // Google Vision API analysis
  private async analyzeWithGoogleVision(
    imageUrl: string,
    options: any
  ): Promise<Partial<ImageAnalysisResult>> {
    if (!visionClient) {
      throw new Error('Google Vision client not configured');
    }

    try {
      // Build feature requests
      const features = [];
      if (options.includeObjects) features.push({ type: 'OBJECT_LOCALIZATION' });
      if (options.includeFaces) features.push({ type: 'FACE_DETECTION' });
      if (options.includeText) features.push({ type: 'TEXT_DETECTION' });
      if (options.includeColors) features.push({ type: 'IMAGE_PROPERTIES' });
      if (options.includeSafety) features.push({ type: 'SAFE_SEARCH_DETECTION' });
      features.push({ type: 'LABEL_DETECTION' });

      const [result] = await visionClient.annotateImage({
        image: { source: { imageUri: imageUrl } },
        features
      });

      return this.parseGoogleVisionResult(result);
    } catch (error) {
      console.error('Google Vision analysis failed:', error);
      throw error;
    }
  }

  // OpenAI GPT-4V analysis
  private async analyzeWithOpenAI(
    imageUrl: string,
    options: any
  ): Promise<Partial<ImageAnalysisResult>> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image comprehensively for social media caption generation. 
                
Please provide a detailed JSON response with:
{
  "description": "Detailed description of the image",
  "objects": [{"name": "object", "confidence": 0.95}],
  "emotions": {
    "overall": "positive|negative|neutral",
    "confidence": 0.85,
    "specificEmotions": ["joy", "excitement"]
  },
  "scene": {
    "setting": "description of setting",
    "timeOfDay": "morning|afternoon|evening|night",
    "location": "indoor|outdoor",
    "activity": "what's happening"
  },
  "colors": [{"color": "blue", "hex": "#0066CC", "percentage": 30}],
  "brandingElements": [{"type": "logo|text|color|style", "description": "element", "confidence": 0.8}]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI image analysis failed:', error);
      throw error;
    }
  }

  // Parse Google Vision results
  private parseGoogleVisionResult(result: any): Partial<ImageAnalysisResult> {
    const parsed: Partial<ImageAnalysisResult> = {};

    // Objects
    if (result.localizedObjectAnnotations) {
      parsed.objects = result.localizedObjectAnnotations.map((obj: any) => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: obj.boundingPoly?.normalizedVertices ? {
          x: obj.boundingPoly.normalizedVertices[0]?.x || 0,
          y: obj.boundingPoly.normalizedVertices[0]?.y || 0,
          width: (obj.boundingPoly.normalizedVertices[2]?.x || 1) - (obj.boundingPoly.normalizedVertices[0]?.x || 0),
          height: (obj.boundingPoly.normalizedVertices[2]?.y || 1) - (obj.boundingPoly.normalizedVertices[0]?.y || 0)
        } : undefined
      }));
    }

    // Faces
    if (result.faceAnnotations) {
      parsed.faces = result.faceAnnotations.map((face: any) => ({
        confidence: face.detectionConfidence,
        emotions: {
          joy: this.mapEmotionConfidence(face.joyLikelihood),
          sorrow: this.mapEmotionConfidence(face.sorrowLikelihood),
          anger: this.mapEmotionConfidence(face.angerLikelihood),
          surprise: this.mapEmotionConfidence(face.surpriseLikelihood)
        }
      }));
    }

    // Text
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      // Skip first annotation (full text) and get individual words
      parsed.text = result.textAnnotations.slice(1).map((text: any) => ({
        text: text.description,
        confidence: 0.9, // Google doesn't provide text confidence
        boundingBox: text.boundingPoly?.vertices ? {
          x: text.boundingPoly.vertices[0]?.x || 0,
          y: text.boundingPoly.vertices[0]?.y || 0,
          width: (text.boundingPoly.vertices[2]?.x || 0) - (text.boundingPoly.vertices[0]?.x || 0),
          height: (text.boundingPoly.vertices[2]?.y || 0) - (text.boundingPoly.vertices[0]?.y || 0)
        } : undefined
      }));
    }

    // Colors
    if (result.imagePropertiesAnnotation?.dominantColors?.colors) {
      parsed.colors = result.imagePropertiesAnnotation.dominantColors.colors
        .slice(0, 5) // Top 5 colors
        .map((color: any) => ({
          color: this.rgbToColorName(color.color.red, color.color.green, color.color.blue),
          hex: this.rgbToHex(color.color.red || 0, color.color.green || 0, color.color.blue || 0),
          percentage: Math.round(color.pixelFraction * 100)
        }));
    }

    // Safety
    if (result.safeSearchAnnotation) {
      parsed.safetyRating = {
        adult: result.safeSearchAnnotation.adult?.toLowerCase() || 'very_unlikely',
        violence: result.safeSearchAnnotation.violence?.toLowerCase() || 'very_unlikely',
        racy: result.safeSearchAnnotation.racy?.toLowerCase() || 'very_unlikely',
        medical: result.safeSearchAnnotation.medical?.toLowerCase() || 'very_unlikely'
      };
    }

    return parsed;
  }

  // Combine results from both services
  private combineAnalysisResults(
    vision: Partial<ImageAnalysisResult> | null,
    openai: Partial<ImageAnalysisResult> | null
  ): ImageAnalysisResult {
    // Prioritize OpenAI for descriptive content, Google Vision for technical analysis
    return {
      description: openai?.description || vision?.description || 'No description available',
      objects: vision?.objects || openai?.objects || [],
      faces: vision?.faces || openai?.faces || [],
      text: vision?.text || openai?.text || [],
      colors: openai?.colors || vision?.colors || [],
      emotions: openai?.emotions || {
        overall: 'neutral',
        confidence: 0.5,
        specificEmotions: []
      },
      scene: openai?.scene || {
        setting: 'Unknown setting',
        location: 'indoor'
      },
      safetyRating: vision?.safetyRating || {
        adult: 'very_unlikely',
        violence: 'very_unlikely',
        racy: 'very_unlikely',
        medical: 'very_unlikely'
      },
      brandingElements: openai?.brandingElements || vision?.brandingElements || []
    };
  }

  // Generate caption context from analysis
  async generateCaptionContext(analysis: ImageAnalysisResult): Promise<string> {
    const context = [];

    // Scene description
    context.push(`Image shows: ${analysis.description}`);

    // Key objects
    if (analysis.objects.length > 0) {
      const topObjects = analysis.objects
        .filter(obj => obj.confidence > 0.7)
        .slice(0, 5)
        .map(obj => obj.name)
        .join(', ');
      if (topObjects) {
        context.push(`Key elements: ${topObjects}`);
      }
    }

    // Colors
    if (analysis.colors.length > 0) {
      const dominantColors = analysis.colors
        .slice(0, 3)
        .map(color => `${color.color} (${color.percentage}%)`)
        .join(', ');
      context.push(`Dominant colors: ${dominantColors}`);
    }

    // Emotions and mood
    if (analysis.emotions.overall !== 'neutral') {
      context.push(`Mood: ${analysis.emotions.overall}`);
      if (analysis.emotions.specificEmotions.length > 0) {
        context.push(`Emotions: ${analysis.emotions.specificEmotions.join(', ')}`);
      }
    }

    // Scene details
    if (analysis.scene.timeOfDay) {
      context.push(`Time: ${analysis.scene.timeOfDay}`);
    }
    if (analysis.scene.activity) {
      context.push(`Activity: ${analysis.scene.activity}`);
    }

    // Text content
    if (analysis.text.length > 0) {
      const textContent = analysis.text
        .map(t => t.text)
        .join(' ')
        .slice(0, 200);
      if (textContent.trim()) {
        context.push(`Text in image: "${textContent}"`);
      }
    }

    return context.join('. ');
  }

  // Store analysis results
  async storeImageAnalysis(
    imageUrl: string,
    analysis: ImageAnalysisResult,
    userId: string
  ): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO image_analysis (
          image_url, 
          user_id, 
          analysis_data, 
          created_at
        ) VALUES (
          ${imageUrl}, 
          ${userId}, 
          ${JSON.stringify(analysis)}, 
          NOW()
        )
        ON CONFLICT (image_url) 
        DO UPDATE SET 
          analysis_data = EXCLUDED.analysis_data,
          updated_at = NOW()
      `;
    } catch (error) {
      console.error('Failed to store image analysis:', error);
      // Don't throw - analysis storage is not critical
    }
  }

  // Get cached analysis
  async getCachedImageAnalysis(imageUrl: string): Promise<ImageAnalysisResult | null> {
    try {
      const result = await prisma.$queryRaw<Array<{ analysis_data: any }>>`
        SELECT analysis_data 
        FROM image_analysis 
        WHERE image_url = ${imageUrl} 
        AND created_at > NOW() - INTERVAL '7 days'
        LIMIT 1
      `;

      if (result.length > 0) {
        return result[0].analysis_data as ImageAnalysisResult;
      }
    } catch (error) {
      console.error('Failed to get cached image analysis:', error);
    }
    return null;
  }

  // Utility functions
  private mapEmotionConfidence(likelihood: string): number {
    const mapping: Record<string, number> = {
      'VERY_UNLIKELY': 0.1,
      'UNLIKELY': 0.3,
      'POSSIBLE': 0.5,
      'LIKELY': 0.7,
      'VERY_LIKELY': 0.9
    };
    return mapping[likelihood] || 0.5;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => Math.round(x).toString(16).padStart(2, '0'))
      .join('');
  }

  private rgbToColorName(r: number, g: number, b: number): string {
    // Simple color name mapping - in production, use a comprehensive color library
    const colors = [
      { name: 'red', r: 255, g: 0, b: 0 },
      { name: 'green', r: 0, g: 255, b: 0 },
      { name: 'blue', r: 0, g: 0, b: 255 },
      { name: 'yellow', r: 255, g: 255, b: 0 },
      { name: 'orange', r: 255, g: 165, b: 0 },
      { name: 'purple', r: 128, g: 0, b: 128 },
      { name: 'pink', r: 255, g: 192, b: 203 },
      { name: 'brown', r: 165, g: 42, b: 42 },
      { name: 'black', r: 0, g: 0, b: 0 },
      { name: 'white', r: 255, g: 255, b: 255 },
      { name: 'gray', r: 128, g: 128, b: 128 }
    ];

    let closestColor = colors[0];
    let minDistance = Number.MAX_VALUE;

    for (const color of colors) {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return closestColor.name;
  }
}

export const imageAnalysisService = ImageAnalysisService.getInstance();