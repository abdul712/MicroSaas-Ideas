import { createWorker } from 'tesseract.js';
// import { ImageAnnotatorClient } from '@google-cloud/vision'; // Uncomment for Google Cloud Vision

interface OCRResult {
  confidence: number;
  rawData: any;
  extractedData: {
    amount?: number;
    date?: Date;
    merchant?: string;
    items?: any[];
    taxAmount?: number;
    currency?: string;
  };
}

interface OCRProvider {
  name: string;
  process(imageUrl: string, mimeType: string): Promise<OCRResult>;
}

// Tesseract.js provider for basic OCR
class TesseractProvider implements OCRProvider {
  name = 'tesseract';

  async process(imageUrl: string, mimeType: string): Promise<OCRResult> {
    const worker = await createWorker({
      logger: m => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Tesseract:', m);
        }
      },
    });

    try {
      // Configure for receipt processing
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/-: ',
        tessedit_pageseg_mode: '6', // Uniform block of text
      });

      const { data } = await worker.recognize(imageUrl);
      
      await worker.terminate();

      // Extract structured data from raw text
      const extractedData = this.extractReceiptData(data.text);

      return {
        confidence: data.confidence / 100, // Convert to 0-1 scale
        rawData: {
          text: data.text,
          words: data.words,
          lines: data.lines,
          blocks: data.blocks,
        },
        extractedData,
      };
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  }

  private extractReceiptData(text: string) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract amount (look for currency symbols and decimal patterns)
    const amountPattern = /[\$€£¥]?\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*[\$€£¥]?/g;
    const amounts = [];
    let match;
    
    while ((match = amountPattern.exec(text)) !== null) {
      const amount = parseFloat(match[1] || match[2].replace(',', '.'));
      if (!isNaN(amount)) {
        amounts.push(amount);
      }
    }

    // Extract date patterns
    const datePattern = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b|\b(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g;
    const dates = [];
    
    while ((match = datePattern.exec(text)) !== null) {
      try {
        let date: Date;
        if (match[1] && match[2] && match[3]) {
          // MM/DD/YYYY or DD/MM/YYYY format
          date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        } else if (match[4] && match[5] && match[6]) {
          // YYYY/MM/DD format
          date = new Date(parseInt(match[4]), parseInt(match[5]) - 1, parseInt(match[6]));
        } else {
          continue;
        }
        
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      } catch (error) {
        // Skip invalid dates
      }
    }

    // Extract merchant name (usually first few lines, avoid common receipt words)
    const skipWords = ['receipt', 'invoice', 'bill', 'total', 'subtotal', 'tax', 'date', 'time'];
    let merchant: string | undefined;
    
    for (const line of lines.slice(0, 5)) {
      const cleanLine = line.toLowerCase();
      if (cleanLine.length > 3 && 
          !skipWords.some(word => cleanLine.includes(word)) &&
          !/^\d+[\/\-.]/.test(cleanLine) && // Not a date
          !/[\$€£¥]\s*\d+/.test(cleanLine)) { // Not an amount
        merchant = line;
        break;
      }
    }

    // Extract line items (lines with amounts)
    const items = [];
    for (const line of lines) {
      const amountMatch = line.match(/[\$€£¥]?\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*[\$€£¥]?/);
      if (amountMatch && line.length > amountMatch[0].length + 2) {
        const description = line.replace(amountMatch[0], '').trim();
        const amount = parseFloat(amountMatch[1] || amountMatch[2].replace(',', '.'));
        
        if (description.length > 1 && !isNaN(amount)) {
          items.push({
            description,
            amount,
          });
        }
      }
    }

    return {
      amount: amounts.length > 0 ? Math.max(...amounts) : undefined, // Assume largest amount is total
      date: dates.length > 0 ? dates[0] : undefined, // Use first valid date
      merchant,
      items: items.length > 0 ? items : undefined,
      currency: 'USD', // Default, could be enhanced to detect currency
    };
  }
}

// Google Cloud Vision provider (premium option)
class GoogleVisionProvider implements OCRProvider {
  name = 'google-vision';

  async process(imageUrl: string, mimeType: string): Promise<OCRResult> {
    // Uncomment and configure when Google Cloud Vision is set up
    /*
    const client = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }

    const text = detections[0].description || '';
    const confidence = detections[0].confidence || 0;

    // Use similar extraction logic as Tesseract
    const extractedData = this.extractReceiptData(text);

    return {
      confidence,
      rawData: {
        text,
        detections,
      },
      extractedData,
    };
    */
    
    throw new Error('Google Cloud Vision not configured');
  }
}

// OCR processing orchestrator
class OCRProcessor {
  private providers: OCRProvider[];

  constructor() {
    this.providers = [
      new TesseractProvider(),
      // new GoogleVisionProvider(), // Enable when configured
    ];
  }

  async processReceipt(imageUrl: string, mimeType: string): Promise<OCRResult> {
    const preferredProvider = process.env.OCR_PROVIDER || 'tesseract';
    
    // Try preferred provider first
    const provider = this.providers.find(p => p.name === preferredProvider) || this.providers[0];
    
    try {
      return await provider.process(imageUrl, mimeType);
    } catch (error) {
      console.error(`OCR processing failed with ${provider.name}:`, error);
      
      // Fallback to other providers if available
      for (const fallbackProvider of this.providers) {
        if (fallbackProvider.name !== provider.name) {
          try {
            console.log(`Trying fallback provider: ${fallbackProvider.name}`);
            return await fallbackProvider.process(imageUrl, mimeType);
          } catch (fallbackError) {
            console.error(`Fallback provider ${fallbackProvider.name} failed:`, fallbackError);
          }
        }
      }
      
      throw new Error('All OCR providers failed');
    }
  }
}

// Main export function
const ocrProcessor = new OCRProcessor();

export async function processReceiptOCR(
  receiptId: string,
  imageUrl: string,
  mimeType: string
): Promise<OCRResult> {
  try {
    console.log(`Starting OCR processing for receipt ${receiptId}`);
    
    const result = await ocrProcessor.processReceipt(imageUrl, mimeType);
    
    console.log(`OCR processing completed for receipt ${receiptId} with confidence ${result.confidence}`);
    
    return result;
  } catch (error) {
    console.error(`OCR processing failed for receipt ${receiptId}:`, error);
    throw error;
  }
}

// Utility function to validate extracted data
export function validateExtractedData(data: any): boolean {
  // Basic validation rules
  if (data.amount && (data.amount <= 0 || data.amount > 100000)) {
    return false;
  }
  
  if (data.date && data.date > new Date()) {
    return false; // Future dates are suspicious
  }
  
  return true;
}

// Function to suggest expense categories based on merchant
export function suggestCategory(merchantName?: string): string[] {
  if (!merchantName) return [];
  
  const categoryMap: Record<string, string[]> = {
    'restaurant|cafe|food|dining|pizza|burger|sushi': ['Meals & Entertainment', 'Business Meals'],
    'gas|fuel|shell|exxon|chevron': ['Transportation', 'Vehicle Expenses'],
    'hotel|motel|inn|resort|accommodation': ['Travel', 'Lodging'],
    'office|supplies|staples|depot': ['Office Supplies', 'Equipment'],
    'uber|lyft|taxi|transport': ['Transportation', 'Rideshare'],
    'amazon|walmart|target|store': ['Supplies', 'Equipment'],
    'airline|airport|flight': ['Travel', 'Airfare'],
  };
  
  const merchant = merchantName.toLowerCase();
  
  for (const [pattern, categories] of Object.entries(categoryMap)) {
    if (new RegExp(pattern).test(merchant)) {
      return categories;
    }
  }
  
  return ['Uncategorized'];
}