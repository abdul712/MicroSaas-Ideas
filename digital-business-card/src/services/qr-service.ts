import QRCode from 'qrcode';
import { QRCodeOptions } from '@/types';

export class QRCodeService {
  private static defaultOptions: QRCodeOptions = {
    size: 256,
    errorCorrectionLevel: 'M',
    type: 'canvas',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };

  static async generateQRCode(url: string, options?: Partial<QRCodeOptions>): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        errorCorrectionLevel: finalOptions.errorCorrectionLevel,
        type: 'image/png',
        quality: finalOptions.quality,
        margin: finalOptions.margin,
        color: {
          dark: finalOptions.color.dark,
          light: finalOptions.color.light,
        },
        width: finalOptions.size,
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async generateCustomQRCode(
    url: string, 
    options: Partial<QRCodeOptions> & { logo?: { src: string; size: number } }
  ): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };

    try {
      // Generate base QR code
      const qrCodeBuffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: finalOptions.errorCorrectionLevel,
        margin: finalOptions.margin,
        color: {
          dark: finalOptions.color.dark,
          light: finalOptions.color.light,
        },
        width: finalOptions.size,
      });

      // If no logo, return the basic QR code
      if (!options.logo) {
        return `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
      }

      // TODO: Add logo overlay functionality using canvas or sharp
      // For now, return the basic QR code
      return `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error generating custom QR code:', error);
      throw new Error('Failed to generate custom QR code');
    }
  }

  static generateCardURL(slug: string, baseUrl?: string): string {
    const base = baseUrl || process.env.APP_URL || 'http://localhost:3000';
    return `${base}/card/${slug}`;
  }

  static async generateAndSaveQRCode(cardId: string, slug: string, options?: Partial<QRCodeOptions>): Promise<string> {
    const cardURL = this.generateCardURL(slug);
    const qrCodeDataURL = await this.generateQRCode(cardURL, options);
    
    // In a real implementation, you might want to save this to S3 or another storage service
    // For now, we'll return the data URL directly
    return qrCodeDataURL;
  }

  static validateQRCodeData(data: string): boolean {
    try {
      // Basic URL validation
      new URL(data);
      return true;
    } catch {
      return false;
    }
  }

  static async generateVCard(cardData: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  }): Promise<string> {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      cardData.name ? `FN:${cardData.name}` : '',
      cardData.title ? `TITLE:${cardData.title}` : '',
      cardData.company ? `ORG:${cardData.company}` : '',
      cardData.phone ? `TEL:${cardData.phone}` : '',
      cardData.email ? `EMAIL:${cardData.email}` : '',
      cardData.website ? `URL:${cardData.website}` : '',
      cardData.address ? `ADR:;;${cardData.address};;;;` : '',
      'END:VCARD'
    ].filter(line => line !== '').join('\n');

    return vcard;
  }

  static async generateVCardQR(cardData: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  }, options?: Partial<QRCodeOptions>): Promise<string> {
    const vcard = await this.generateVCard(cardData);
    return this.generateQRCode(vcard, options);
  }
}