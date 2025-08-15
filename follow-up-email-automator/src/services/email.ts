import sgMail from "@sendgrid/mail";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Initialize providers
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  organizationId: string;
  contactId: string;
  templateId: string;
  emailSendId: string;
  trackingEnabled?: boolean;
  unsubscribeUrl?: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string;
  provider: "SENDGRID" | "RESEND";
  error?: string;
}

export interface DeliverabilityAnalysis {
  spamScore: number;
  issues: string[];
  suggestions: string[];
  dkimValid: boolean;
  spfValid: boolean;
}

class EmailService {
  private defaultFrom = process.env.DEFAULT_FROM_EMAIL || "noreply@yourdomain.com";
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const {
      to,
      subject,
      html,
      text,
      from = this.defaultFrom,
      replyTo,
      organizationId,
      contactId,
      templateId,
      emailSendId,
      trackingEnabled = true,
      unsubscribeUrl,
    } = options;

    // Process email content with tracking and personalization
    const processedContent = await this.processEmailContent({
      html,
      text,
      trackingEnabled,
      unsubscribeUrl,
      emailSendId,
      organizationId,
    });

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        const result = await this.sendWithSendGrid({
          to,
          from,
          subject,
          html: processedContent.html,
          text: processedContent.text,
          replyTo,
        });
        
        return {
          success: true,
          messageId: result.messageId,
          provider: "SENDGRID",
        };
      } catch (error) {
        console.error("SendGrid failed:", error);
        // Fall back to Resend
      }
    }

    // Try Resend as fallback
    if (resend) {
      try {
        const result = await this.sendWithResend({
          to,
          from,
          subject,
          html: processedContent.html,
          text: processedContent.text,
          replyTo,
        });
        
        return {
          success: true,
          messageId: result.messageId,
          provider: "RESEND",
        };
      } catch (error) {
        console.error("Resend failed:", error);
        return {
          success: false,
          messageId: "",
          provider: "RESEND",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return {
      success: false,
      messageId: "",
      provider: "SENDGRID",
      error: "No email providers available",
    };
  }

  private async sendWithSendGrid(options: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }) {
    const msg = {
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
        ganalytics: { enable: false },
      },
    };

    const [response] = await sgMail.send(msg);
    return {
      messageId: response.headers["x-message-id"] || response.headers["message-id"] || "",
    };
  }

  private async sendWithResend(options: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }) {
    const result = await resend!.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      messageId: result.data?.id || "",
    };
  }

  private async processEmailContent(options: {
    html: string;
    text?: string;
    trackingEnabled: boolean;
    unsubscribeUrl?: string;
    emailSendId: string;
    organizationId: string;
  }): Promise<{ html: string; text?: string }> {
    let { html, text } = options;
    const baseUrl = process.env.APP_URL || "http://localhost:3000";

    if (options.trackingEnabled) {
      // Add open tracking pixel
      const openTrackingPixel = `<img src="${baseUrl}/api/track/open/${options.emailSendId}" width="1" height="1" style="display:none;" />`;
      html = html.replace("</body>", `${openTrackingPixel}</body>`);

      // Wrap all links with click tracking
      html = html.replace(
        /href="([^"]+)"/g,
        (match, url) => {
          if (url.startsWith("mailto:") || url.startsWith("tel:")) {
            return match;
          }
          const trackingUrl = `${baseUrl}/api/track/click/${options.emailSendId}?url=${encodeURIComponent(url)}`;
          return `href="${trackingUrl}"`;
        }
      );
    }

    // Add unsubscribe link if provided
    if (options.unsubscribeUrl) {
      const unsubscribeLink = `<div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <a href="${options.unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
      </div>`;
      html = html.replace("</body>", `${unsubscribeLink}</body>`);
      
      if (text) {
        text += `\n\nUnsubscribe: ${options.unsubscribeUrl}`;
      }
    }

    return { html, text };
  }

  async verifyDomain(domain: string): Promise<{
    isVerified: boolean;
    dkim: boolean;
    spf: boolean;
    dmarc: boolean;
    mx: boolean;
  }> {
    // This would typically involve DNS lookups
    // For now, return a mock response
    return {
      isVerified: true,
      dkim: true,
      spf: true,
      dmarc: true,
      mx: true,
    };
  }

  async analyzeDeliverability(
    subject: string,
    html: string,
    text?: string
  ): Promise<DeliverabilityAnalysis> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let spamScore = 0;

    // Check subject line
    if (subject.includes("!!!") || subject.includes("$$$")) {
      issues.push("Subject contains spam trigger symbols");
      spamScore += 20;
    }

    if (subject.length > 50) {
      issues.push("Subject line is too long");
      suggestions.push("Keep subject lines under 50 characters");
      spamScore += 10;
    }

    if (subject.toUpperCase() === subject) {
      issues.push("Subject line is all caps");
      suggestions.push("Use normal capitalization in subject line");
      spamScore += 15;
    }

    // Check content
    const spamWords = ["guarantee", "free money", "act now", "limited time", "urgent"];
    const htmlLower = html.toLowerCase();
    
    spamWords.forEach(word => {
      if (htmlLower.includes(word)) {
        spamScore += 5;
      }
    });

    // Check for proper unsubscribe link
    if (!html.includes("unsubscribe")) {
      issues.push("Missing unsubscribe link");
      suggestions.push("Include a clear unsubscribe link");
      spamScore += 25;
    }

    // Check HTML/text ratio
    if (!text && html.length > 1000) {
      issues.push("Missing plain text version");
      suggestions.push("Include a plain text version of your email");
      spamScore += 10;
    }

    // Check for excessive images
    const imgCount = (html.match(/<img/g) || []).length;
    if (imgCount > 5) {
      issues.push("Too many images");
      suggestions.push("Reduce the number of images in your email");
      spamScore += 10;
    }

    return {
      spamScore: Math.min(spamScore, 100),
      issues,
      suggestions,
      dkimValid: true, // Would need actual DNS verification
      spfValid: true,  // Would need actual DNS verification
    };
  }

  async handleWebhook(
    provider: "SENDGRID" | "RESEND",
    payload: any
  ): Promise<void> {
    try {
      if (provider === "SENDGRID") {
        await this.processSendGridWebhook(payload);
      } else if (provider === "RESEND") {
        await this.processResendWebhook(payload);
      }
    } catch (error) {
      console.error(`Error processing ${provider} webhook:`, error);
      throw error;
    }
  }

  private async processSendGridWebhook(events: any[]) {
    for (const event of events) {
      try {
        const { event: eventType, sg_message_id, timestamp, email } = event;
        
        // Find the email send record
        const emailSend = await prisma.emailSend.findFirst({
          where: { providerId: sg_message_id },
        });

        if (!emailSend) {
          console.warn(`Email send not found for message ID: ${sg_message_id}`);
          continue;
        }

        // Map SendGrid events to our event types
        const eventTypeMap: Record<string, string> = {
          delivered: "DELIVERED",
          open: "OPENED",
          click: "CLICKED",
          bounce: "BOUNCED",
          dropped: "FAILED",
          deferred: "FAILED",
          unsubscribe: "UNSUBSCRIBED",
          spamreport: "COMPLAINED",
        };

        const mappedEventType = eventTypeMap[eventType];
        if (!mappedEventType) continue;

        // Create email event
        await prisma.emailEvent.create({
          data: {
            emailId: emailSend.id,
            contactId: emailSend.contactId,
            type: mappedEventType as any,
            timestamp: new Date(timestamp * 1000),
            providerId: sg_message_id,
            url: event.url,
            userAgent: event.useragent,
            ipAddress: event.ip,
            metadata: event,
          },
        });

        // Update email send record
        const updateData: any = {};
        switch (eventType) {
          case "open":
            updateData.openedAt = new Date(timestamp * 1000);
            updateData.status = "OPENED";
            break;
          case "click":
            updateData.clickedAt = new Date(timestamp * 1000);
            updateData.status = "CLICKED";
            break;
          case "bounce":
          case "dropped":
          case "deferred":
            updateData.bouncedAt = new Date(timestamp * 1000);
            updateData.status = "BOUNCED";
            updateData.errorMessage = event.reason;
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.emailSend.update({
            where: { id: emailSend.id },
            data: updateData,
          });
        }

        // Update sequence step stats if applicable
        if (emailSend.stepId) {
          const stepUpdateData: any = {};
          switch (eventType) {
            case "open":
              stepUpdateData.openCount = { increment: 1 };
              break;
            case "click":
              stepUpdateData.clickCount = { increment: 1 };
              break;
          }

          if (Object.keys(stepUpdateData).length > 0) {
            await prisma.sequenceStep.update({
              where: { id: emailSend.stepId },
              data: stepUpdateData,
            });
          }
        }

        // Queue analytics update
        const { addAnalyticsToQueue } = await import("@/lib/queue");
        await addAnalyticsToQueue({
          organizationId: emailSend.organizationId,
          eventType: mappedEventType,
          eventData: event,
          timestamp: new Date(timestamp * 1000),
        });

      } catch (error) {
        console.error("Error processing SendGrid webhook event:", error);
      }
    }
  }

  private async processResendWebhook(event: any) {
    try {
      const { type, data } = event;
      const { email_id, to, timestamp } = data;

      // Find the email send record
      const emailSend = await prisma.emailSend.findFirst({
        where: { providerId: email_id },
      });

      if (!emailSend) {
        console.warn(`Email send not found for message ID: ${email_id}`);
        return;
      }

      // Map Resend events to our event types
      const eventTypeMap: Record<string, string> = {
        "email.sent": "SENT",
        "email.delivered": "DELIVERED",
        "email.delivery_delayed": "FAILED",
        "email.complained": "COMPLAINED",
        "email.bounced": "BOUNCED",
        "email.opened": "OPENED",
        "email.clicked": "CLICKED",
      };

      const mappedEventType = eventTypeMap[type];
      if (!mappedEventType) return;

      // Create email event
      await prisma.emailEvent.create({
        data: {
          emailId: emailSend.id,
          contactId: emailSend.contactId,
          type: mappedEventType as any,
          timestamp: new Date(timestamp),
          providerId: email_id,
          metadata: data,
        },
      });

      // Update email send record based on event type
      const updateData: any = {};
      switch (type) {
        case "email.opened":
          updateData.openedAt = new Date(timestamp);
          updateData.status = "OPENED";
          break;
        case "email.clicked":
          updateData.clickedAt = new Date(timestamp);
          updateData.status = "CLICKED";
          break;
        case "email.bounced":
          updateData.bouncedAt = new Date(timestamp);
          updateData.status = "BOUNCED";
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.emailSend.update({
          where: { id: emailSend.id },
          data: updateData,
        });
      }

      // Queue analytics update
      const { addAnalyticsToQueue } = await import("@/lib/queue");
      await addAnalyticsToQueue({
        organizationId: emailSend.organizationId,
        eventType: mappedEventType,
        eventData: data,
        timestamp: new Date(timestamp),
      });

    } catch (error) {
      console.error("Error processing Resend webhook event:", error);
    }
  }

  async getEmailStats(organizationId: string, days = 30): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.emailSend.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    const eventStats = await prisma.emailEvent.groupBy({
      by: ["type"],
      where: {
        email: { organizationId },
        timestamp: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    const eventCounts = eventStats.reduce((acc, event) => {
      acc[event.type] = event._count.id;
      return acc;
    }, {} as Record<string, number>);

    const sent = stats._count.id;
    const delivered = eventCounts.DELIVERED || 0;
    const opened = eventCounts.OPENED || 0;
    const clicked = eventCounts.CLICKED || 0;
    const bounced = eventCounts.BOUNCED || 0;

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    };
  }
}

export const emailService = new EmailService();