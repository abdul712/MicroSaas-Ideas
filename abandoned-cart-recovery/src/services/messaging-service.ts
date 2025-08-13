import { MessageChannel, MessageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { emailQueue, smsQueue } from './queue-service';
import sendgrid from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize external services
sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export interface MessageData {
  id?: string;
  campaignId: string;
  cartId: string;
  customerId: string;
  channel: MessageChannel;
  templateId?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  trackingPixel?: string;
  unsubscribeUrl?: string;
  metadata?: Record<string, any>;
}

export interface SmsData {
  to: string;
  message: string;
  fromNumber?: string;
  metadata?: Record<string, any>;
}

export class MessagingService {
  private static instance: MessagingService;

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Send a recovery message through the specified channel
   */
  async sendRecoveryMessage(messageData: MessageData): Promise<string> {
    try {
      // Create message record in database
      const message = await prisma.message.create({
        data: {
          campaignId: messageData.campaignId,
          cartId: messageData.cartId,
          customerId: messageData.customerId,
          channel: messageData.channel,
          templateId: messageData.templateId,
          subject: messageData.subject,
          content: messageData.content,
          status: MessageStatus.QUEUED,
          metadata: messageData.metadata || {},
        },
        include: {
          customer: true,
          cart: true,
          campaign: {
            include: {
              store: true,
            },
          },
        },
      });

      // Queue message for delivery based on channel
      switch (messageData.channel) {
        case MessageChannel.EMAIL:
          await this.queueEmailMessage(message);
          break;
        case MessageChannel.SMS:
          await this.queueSmsMessage(message);
          break;
        case MessageChannel.PUSH:
          await this.queuePushMessage(message);
          break;
        default:
          throw new Error(`Unsupported message channel: ${messageData.channel}`);
      }

      return message.id;
    } catch (error) {
      console.error('Error sending recovery message:', error);
      throw error;
    }
  }

  /**
   * Queue email message for delivery
   */
  private async queueEmailMessage(message: any): Promise<void> {
    // Check customer consent
    if (!message.customer.consentEmail || message.customer.optOutEmail) {
      await this.updateMessageStatus(message.id, MessageStatus.FAILED, 'No email consent');
      return;
    }

    // Prepare email data
    const emailData: EmailData = {
      to: message.customer.email,
      subject: message.subject || 'Complete your purchase',
      htmlContent: await this.renderEmailContent(message, 'html'),
      textContent: await this.renderEmailContent(message, 'text'),
      fromEmail: process.env.FROM_EMAIL || 'noreply@cartrecovery.com',
      fromName: message.campaign.store.storeName || 'Cart Recovery',
      trackingPixel: this.generateTrackingPixel(message.id),
      unsubscribeUrl: this.generateUnsubscribeUrl(message.customer.id),
      metadata: {
        messageId: message.id,
        campaignId: message.campaignId,
        cartId: message.cartId,
        storeId: message.campaign.storeId,
      },
    };

    // Add to email queue
    await emailQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: 'exponential',
      delay: 0,
    });

    // Update message status
    await this.updateMessageStatus(message.id, MessageStatus.QUEUED);
  }

  /**
   * Queue SMS message for delivery
   */
  private async queueSmsMessage(message: any): Promise<void> {
    // Check customer consent and phone number
    if (!message.customer.consentSms || message.customer.optOutSms || !message.customer.phone) {
      await this.updateMessageStatus(message.id, MessageStatus.FAILED, 'No SMS consent or phone');
      return;
    }

    // Prepare SMS data
    const smsData: SmsData = {
      to: message.customer.phone,
      message: await this.renderSmsContent(message),
      fromNumber: process.env.TWILIO_PHONE_NUMBER,
      metadata: {
        messageId: message.id,
        campaignId: message.campaignId,
        cartId: message.cartId,
        storeId: message.campaign.storeId,
      },
    };

    // Add to SMS queue
    await smsQueue.add('send-sms', smsData, {
      attempts: 3,
      backoff: 'exponential',
      delay: 0,
    });

    // Update message status
    await this.updateMessageStatus(message.id, MessageStatus.QUEUED);
  }

  /**
   * Queue push notification for delivery
   */
  private async queuePushMessage(message: any): Promise<void> {
    // Implementation for push notifications
    // This would integrate with FCM, APNs, or web push services
    console.log('Push notification queued:', message.id);
    await this.updateMessageStatus(message.id, MessageStatus.QUEUED);
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const message = {
        to: emailData.to,
        from: {
          email: emailData.fromEmail!,
          name: emailData.fromName!,
        },
        replyTo: emailData.replyTo,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        customArgs: emailData.metadata,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      const response = await sendgrid.send(message);
      
      // Update message status in database
      if (emailData.metadata?.messageId) {
        await this.updateMessageStatus(
          emailData.metadata.messageId,
          MessageStatus.SENT,
          undefined,
          new Date()
        );
      }

      console.log('Email sent successfully:', response[0].statusCode);
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      // Update message status to failed
      if (emailData.metadata?.messageId) {
        await this.updateMessageStatus(
          emailData.metadata.messageId,
          MessageStatus.FAILED,
          error.message
        );
      }
      
      throw error;
    }
  }

  /**
   * Send SMS using Twilio
   */
  async sendSms(smsData: SmsData): Promise<void> {
    try {
      const message = await twilioClient.messages.create({
        body: smsData.message,
        from: smsData.fromNumber,
        to: smsData.to,
      });

      // Update message status in database
      if (smsData.metadata?.messageId) {
        await this.updateMessageStatus(
          smsData.metadata.messageId,
          MessageStatus.SENT,
          undefined,
          new Date()
        );
      }

      console.log('SMS sent successfully:', message.sid);
    } catch (error: any) {
      console.error('SMS sending failed:', error);
      
      // Update message status to failed
      if (smsData.metadata?.messageId) {
        await this.updateMessageStatus(
          smsData.metadata.messageId,
          MessageStatus.FAILED,
          error.message
        );
      }
      
      throw error;
    }
  }

  /**
   * Handle email tracking events (opens, clicks, bounces)
   */
  async handleEmailEvent(messageId: string, eventType: string, timestamp: Date, metadata?: any): Promise<void> {
    const updateData: any = {};

    switch (eventType) {
      case 'delivered':
        updateData.status = MessageStatus.DELIVERED;
        updateData.deliveredAt = timestamp;
        break;
      case 'open':
        updateData.openedAt = timestamp;
        break;
      case 'click':
        updateData.clickedAt = timestamp;
        break;
      case 'bounce':
        updateData.status = MessageStatus.BOUNCED;
        updateData.errorMessage = metadata?.reason || 'Email bounced';
        break;
      case 'spam_report':
        updateData.status = MessageStatus.COMPLAINED;
        updateData.errorMessage = 'Marked as spam';
        break;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    // Update campaign metrics
    await this.updateCampaignMetrics(messageId, eventType);
  }

  /**
   * Handle SMS delivery events
   */
  async handleSmsEvent(messageId: string, eventType: string, timestamp: Date, metadata?: any): Promise<void> {
    const updateData: any = {};

    switch (eventType) {
      case 'delivered':
        updateData.status = MessageStatus.DELIVERED;
        updateData.deliveredAt = timestamp;
        break;
      case 'failed':
        updateData.status = MessageStatus.FAILED;
        updateData.errorMessage = metadata?.errorMessage || 'SMS delivery failed';
        break;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    // Update campaign metrics
    await this.updateCampaignMetrics(messageId, eventType);
  }

  /**
   * Render email content with personalization
   */
  private async renderEmailContent(message: any, format: 'html' | 'text'): Promise<string> {
    let content = message.content;

    // Apply personalization variables
    const variables = {
      customer_first_name: message.customer.firstName || 'Valued Customer',
      customer_last_name: message.customer.lastName || '',
      customer_email: message.customer.email,
      cart_value: this.formatCurrency(message.cart.cartValue),
      cart_url: message.cart.cartUrl,
      store_name: message.campaign.store.storeName,
      store_url: message.campaign.store.storeUrl,
      unsubscribe_url: this.generateUnsubscribeUrl(message.customer.id),
      cart_items: this.renderCartItems(message.cart.cartItems, format),
    };

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add tracking pixel for HTML emails
    if (format === 'html') {
      const trackingPixel = this.generateTrackingPixel(message.id);
      content += `<img src="${trackingPixel}" width="1" height="1" style="display:none;" />`;
    }

    return content;
  }

  /**
   * Render SMS content with personalization
   */
  private async renderSmsContent(message: any): Promise<string> {
    let content = message.content;

    // Apply personalization variables
    const variables = {
      customer_first_name: message.customer.firstName || 'Customer',
      cart_value: this.formatCurrency(message.cart.cartValue),
      cart_url: await this.shortenUrl(message.cart.cartUrl),
      store_name: message.campaign.store.storeName,
    };

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add opt-out instructions
    content += '\n\nReply STOP to opt out.';

    return content;
  }

  /**
   * Render cart items for email content
   */
  private renderCartItems(cartItems: any[], format: 'html' | 'text'): string {
    if (!cartItems || cartItems.length === 0) return '';

    if (format === 'html') {
      return cartItems.map(item => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <strong>${item.title}</strong><br>
          Quantity: ${item.quantity}<br>
          Price: ${this.formatCurrency(item.price)}
        </div>
      `).join('');
    } else {
      return cartItems.map(item => 
        `${item.title} - Qty: ${item.quantity} - ${this.formatCurrency(item.price)}`
      ).join('\n');
    }
  }

  /**
   * Update message status in database
   */
  private async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    errorMessage?: string,
    timestamp?: Date
  ): Promise<void> {
    const updateData: any = { status };

    if (errorMessage) updateData.errorMessage = errorMessage;
    if (timestamp) {
      switch (status) {
        case MessageStatus.SENT:
          updateData.sentAt = timestamp;
          break;
        case MessageStatus.DELIVERED:
          updateData.deliveredAt = timestamp;
          break;
      }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });
  }

  /**
   * Update campaign metrics
   */
  private async updateCampaignMetrics(messageId: string, eventType: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { campaign: true },
    });

    if (!message) return;

    // Update campaign performance metrics
    const metrics = message.campaign.performanceMetrics as any || {};
    
    switch (eventType) {
      case 'sent':
        metrics.sent = (metrics.sent || 0) + 1;
        break;
      case 'delivered':
        metrics.delivered = (metrics.delivered || 0) + 1;
        break;
      case 'open':
        metrics.opened = (metrics.opened || 0) + 1;
        break;
      case 'click':
        metrics.clicked = (metrics.clicked || 0) + 1;
        break;
    }

    await prisma.campaign.update({
      where: { id: message.campaignId },
      data: { performanceMetrics: metrics },
    });
  }

  /**
   * Generate tracking pixel URL
   */
  private generateTrackingPixel(messageId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/track/open/${messageId}`;
  }

  /**
   * Generate unsubscribe URL
   */
  private generateUnsubscribeUrl(customerId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${customerId}`;
  }

  /**
   * Shorten URL for SMS
   */
  private async shortenUrl(url: string): Promise<string> {
    // Implementation would use a URL shortening service
    // For now, return the original URL
    return url;
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number | string, currency: string = 'USD'): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  /**
   * Get message delivery statistics for a campaign
   */
  async getCampaignStats(campaignId: string): Promise<any> {
    const stats = await prisma.message.groupBy({
      by: ['status', 'channel'],
      where: { campaignId },
      _count: true,
    });

    const result: any = {
      total: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      byChannel: {},
    };

    stats.forEach(stat => {
      result.total += stat._count;
      
      if (!result.byChannel[stat.channel]) {
        result.byChannel[stat.channel] = {};
      }
      
      result.byChannel[stat.channel][stat.status] = stat._count;
      
      switch (stat.status) {
        case MessageStatus.SENT:
        case MessageStatus.DELIVERED:
          result.sent += stat._count;
          break;
        case MessageStatus.FAILED:
        case MessageStatus.BOUNCED:
          result.failed += stat._count;
          break;
      }
    });

    // Get open and click counts
    const openCount = await prisma.message.count({
      where: { campaignId, openedAt: { not: null } },
    });
    
    const clickCount = await prisma.message.count({
      where: { campaignId, clickedAt: { not: null } },
    });

    result.opened = openCount;
    result.clicked = clickCount;

    return result;
  }
}