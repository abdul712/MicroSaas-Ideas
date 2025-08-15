import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Google Vision client
const vision = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export interface ImageAnalysisResult {
  objects: string[];
  labels: string[];
  text: string;
  faces: number;
  colors: string[];
  landmarks: string[];
  logos: string[];
  safeSearch: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  imageProperties: {
    dominantColors: Array<{
      color: { red: number; green: number; blue: number };
      score: number;
      pixelFraction: number;
    }>;
  };
  confidence: number;
  emotions?: Array<{
    emotion: string;
    confidence: number;
  }>;
}

export async function analyzeImage(imageBuffer: Buffer | string): Promise<ImageAnalysisResult> {
  try {
    // Prepare image for analysis
    const imageInput = typeof imageBuffer === 'string' 
      ? { source: { imageUri: imageBuffer } }
      : { content: imageBuffer };

    // Perform multiple types of analysis in parallel
    const [
      objectLocalizationResult,
      labelDetectionResult,
      textDetectionResult,
      faceDetectionResult,
      imagePropertiesResult,
      landmarkDetectionResult,
      logoDetectionResult,
      safeSearchResult,
    ] = await Promise.all([
      vision.objectLocalization(imageInput).catch(() => [[]]),
      vision.labelDetection(imageInput).catch(() => [[]]),
      vision.textDetection(imageInput).catch(() => [[]]),
      vision.faceDetection(imageInput).catch(() => [[]]),
      vision.imageProperties(imageInput).catch(() => [[]]),
      vision.landmarkDetection(imageInput).catch(() => [[]]),
      vision.logoDetection(imageInput).catch(() => [[]]),
      vision.safeSearchDetection(imageInput).catch(() => [[]]),
    ]);

    // Process object localization
    const objects = objectLocalizationResult[0]?.localizedObjectAnnotations?.map(
      obj => obj.name || ''
    ).filter(Boolean) || [];

    // Process label detection
    const labels = labelDetectionResult[0]?.labelAnnotations?.map(
      label => label.description || ''
    ).filter(Boolean) || [];

    // Process text detection
    const textAnnotations = textDetectionResult[0]?.textAnnotations || [];
    const detectedText = textAnnotations.length > 0 ? textAnnotations[0].description || '' : '';

    // Process face detection
    const faces = faceDetectionResult[0]?.faceAnnotations?.length || 0;

    // Process image properties for colors
    const colorInfo = imagePropertiesResult[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const colors = colorInfo.slice(0, 5).map(colorObj => {
      const color = colorObj.color;
      if (color) {
        return rgbToHex(color.red || 0, color.green || 0, color.blue || 0);
      }
      return '#000000';
    });

    // Process landmarks
    const landmarks = landmarkDetectionResult[0]?.landmarkAnnotations?.map(
      landmark => landmark.description || ''
    ).filter(Boolean) || [];

    // Process logos
    const logos = logoDetectionResult[0]?.logoAnnotations?.map(
      logo => logo.description || ''
    ).filter(Boolean) || [];

    // Process safe search
    const safeSearch = safeSearchResult[0]?.safeSearchAnnotation || {};

    // Calculate overall confidence
    const confidenceScores = [
      objectLocalizationResult[0]?.localizedObjectAnnotations?.[0]?.score || 0,
      labelDetectionResult[0]?.labelAnnotations?.[0]?.score || 0,
      faceDetectionResult[0]?.faceAnnotations?.[0]?.detectionConfidence || 0,
    ].filter(score => score > 0);

    const confidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0.5;

    // Extract emotion information from face analysis
    const emotions = extractEmotions(faceDetectionResult[0]?.faceAnnotations || []);

    return {
      objects: [...new Set([...objects, ...labels])].slice(0, 10), // Combine and dedupe
      labels: labels.slice(0, 15),
      text: detectedText.slice(0, 500), // Limit text length
      faces,
      colors,
      landmarks,
      logos,
      safeSearch: {
        adult: safeSearch.adult || 'UNKNOWN',
        spoof: safeSearch.spoof || 'UNKNOWN',
        medical: safeSearch.medical || 'UNKNOWN',
        violence: safeSearch.violence || 'UNKNOWN',
        racy: safeSearch.racy || 'UNKNOWN',
      },
      imageProperties: {
        dominantColors: colorInfo.slice(0, 5).map(colorObj => ({
          color: {
            red: colorObj.color?.red || 0,
            green: colorObj.color?.green || 0,
            blue: colorObj.color?.blue || 0,
          },
          score: colorObj.score || 0,
          pixelFraction: colorObj.pixelFraction || 0,
        })),
      },
      confidence,
      emotions,
    };

  } catch (error) {
    console.error('Image analysis failed:', error);
    
    // Return fallback analysis
    return {
      objects: [],
      labels: [],
      text: '',
      faces: 0,
      colors: ['#000000'],
      landmarks: [],
      logos: [],
      safeSearch: {
        adult: 'UNKNOWN',
        spoof: 'UNKNOWN',
        medical: 'UNKNOWN',
        violence: 'UNKNOWN',
        racy: 'UNKNOWN',
      },
      imageProperties: {
        dominantColors: [],
      },
      confidence: 0,
      emotions: [],
    };
  }
}

function extractEmotions(faceAnnotations: any[]): Array<{ emotion: string; confidence: number }> {
  if (!faceAnnotations || faceAnnotations.length === 0) {
    return [];
  }

  const face = faceAnnotations[0]; // Use first face
  const emotions = [];

  // Map Google Vision emotion likelihood to confidence scores
  const likelihoodToScore = {
    VERY_UNLIKELY: 0.1,
    UNLIKELY: 0.3,
    POSSIBLE: 0.5,
    LIKELY: 0.7,
    VERY_LIKELY: 0.9,
  };

  if (face.joyLikelihood) {
    emotions.push({
      emotion: 'joy',
      confidence: likelihoodToScore[face.joyLikelihood as keyof typeof likelihoodToScore] || 0.5,
    });
  }

  if (face.sorrowLikelihood) {
    emotions.push({
      emotion: 'sorrow',
      confidence: likelihoodToScore[face.sorrowLikelihood as keyof typeof likelihoodToScore] || 0.5,
    });
  }

  if (face.angerLikelihood) {
    emotions.push({
      emotion: 'anger',
      confidence: likelihoodToScore[face.angerLikelihood as keyof typeof likelihoodToScore] || 0.5,
    });
  }

  if (face.surpriseLikelihood) {
    emotions.push({
      emotion: 'surprise',
      confidence: likelihoodToScore[face.surpriseLikelihood as keyof typeof likelihoodToScore] || 0.5,
    });
  }

  // Sort by confidence and return top emotions
  return emotions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateImageSummary(analysis: ImageAnalysisResult): string {
  const parts = [];

  // Objects and scene
  if (analysis.objects.length > 0) {
    parts.push(`Image contains: ${analysis.objects.slice(0, 5).join(', ')}`);
  }

  // People
  if (analysis.faces > 0) {
    parts.push(`${analysis.faces} person${analysis.faces > 1 ? 's' : ''} visible`);
  }

  // Text
  if (analysis.text && analysis.text.length > 10) {
    parts.push(`Text overlay: "${analysis.text.slice(0, 100)}${analysis.text.length > 100 ? '...' : ''}"`);
  }

  // Colors
  if (analysis.colors.length > 0) {
    parts.push(`Dominant colors: ${analysis.colors.slice(0, 3).join(', ')}`);
  }

  // Emotions
  if (analysis.emotions && analysis.emotions.length > 0) {
    const topEmotion = analysis.emotions[0];
    if (topEmotion.confidence > 0.5) {
      parts.push(`Emotional tone: ${topEmotion.emotion}`);
    }
  }

  // Landmarks or logos
  if (analysis.landmarks.length > 0) {
    parts.push(`Landmarks: ${analysis.landmarks.slice(0, 2).join(', ')}`);
  }

  if (analysis.logos.length > 0) {
    parts.push(`Brands: ${analysis.logos.slice(0, 2).join(', ')}`);
  }

  return parts.join('. ') + '.';
}

export function categorizeImageContent(analysis: ImageAnalysisResult): {
  category: string;
  subcategory: string;
  mood: string;
  style: string;
} {
  const objects = analysis.objects.map(obj => obj.toLowerCase());
  const labels = analysis.labels.map(label => label.toLowerCase());
  const allContent = [...objects, ...labels];

  // Determine category
  let category = 'general';
  let subcategory = 'lifestyle';

  if (allContent.some(item => ['person', 'people', 'human', 'face', 'group'].includes(item))) {
    category = 'people';
    subcategory = analysis.faces > 1 ? 'group' : 'portrait';
  } else if (allContent.some(item => ['product', 'technology', 'device', 'gadget'].includes(item))) {
    category = 'product';
    subcategory = 'technology';
  } else if (allContent.some(item => ['food', 'drink', 'meal', 'restaurant'].includes(item))) {
    category = 'food';
    subcategory = 'culinary';
  } else if (allContent.some(item => ['building', 'architecture', 'city', 'urban'].includes(item))) {
    category = 'architecture';
    subcategory = 'urban';
  } else if (allContent.some(item => ['nature', 'landscape', 'tree', 'sky', 'mountain'].includes(item))) {
    category = 'nature';
    subcategory = 'landscape';
  } else if (allContent.some(item => ['business', 'office', 'meeting', 'professional'].includes(item))) {
    category = 'business';
    subcategory = 'professional';
  }

  // Determine mood
  let mood = 'neutral';
  if (analysis.emotions && analysis.emotions.length > 0) {
    const topEmotion = analysis.emotions[0];
    if (topEmotion.confidence > 0.6) {
      mood = topEmotion.emotion;
    }
  }

  // Fallback mood based on content
  if (mood === 'neutral') {
    if (allContent.some(item => ['party', 'celebration', 'fun', 'happy'].includes(item))) {
      mood = 'joyful';
    } else if (allContent.some(item => ['professional', 'business', 'formal'].includes(item))) {
      mood = 'professional';
    } else if (allContent.some(item => ['relax', 'calm', 'peaceful', 'serene'].includes(item))) {
      mood = 'calm';
    }
  }

  // Determine style
  let style = 'casual';
  if (allContent.some(item => ['professional', 'business', 'formal', 'suit'].includes(item))) {
    style = 'professional';
  } else if (allContent.some(item => ['art', 'creative', 'design', 'artistic'].includes(item))) {
    style = 'artistic';
  } else if (allContent.some(item => ['minimal', 'clean', 'simple'].includes(item))) {
    style = 'minimal';
  } else if (allContent.some(item => ['vintage', 'retro', 'classic'].includes(item))) {
    style = 'vintage';
  }

  return {
    category,
    subcategory,
    mood,
    style,
  };
}

export function extractHashtagSuggestions(analysis: ImageAnalysisResult): string[] {
  const hashtags = new Set<string>();

  // Add object-based hashtags
  analysis.objects.forEach(obj => {
    const cleanObj = obj.toLowerCase().replace(/\s+/g, '');
    if (cleanObj.length > 2) {
      hashtags.add(cleanObj);
    }
  });

  // Add label-based hashtags
  analysis.labels.slice(0, 10).forEach(label => {
    const cleanLabel = label.toLowerCase().replace(/\s+/g, '');
    if (cleanLabel.length > 2) {
      hashtags.add(cleanLabel);
    }
  });

  // Add categorical hashtags
  const categorization = categorizeImageContent(analysis);
  hashtags.add(categorization.category);
  hashtags.add(categorization.mood);
  hashtags.add(categorization.style);

  // Add emotion-based hashtags
  if (analysis.emotions && analysis.emotions.length > 0) {
    analysis.emotions.forEach(emotion => {
      if (emotion.confidence > 0.5) {
        hashtags.add(emotion.emotion);
      }
    });
  }

  // Add face-related hashtags
  if (analysis.faces > 0) {
    hashtags.add('people');
    if (analysis.faces === 1) {
      hashtags.add('portrait');
    } else {
      hashtags.add('group');
    }
  }

  // Convert to array and limit
  return Array.from(hashtags).slice(0, 15);
}