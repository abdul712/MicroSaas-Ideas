import { prisma } from "@/lib/prisma";
import { aiEmailService } from "@/services/ai";

export interface TemplateData {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  variables?: string[];
}

export interface TemplateFilters {
  search?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  aiGenerated?: boolean;
}

export interface AIGenerationOptions {
  prompt: string;
  tone?: "professional" | "casual" | "friendly" | "urgent" | "grateful";
  length?: "short" | "medium" | "long";
  emailType?: "cold_outreach" | "follow_up" | "welcome" | "reminder" | "thank_you";
  targetAudience?: string;
  includePersonalization?: boolean;
}

class TemplateService {
  async createTemplate(
    organizationId: string,
    userId: string,
    data: TemplateData
  ) {
    // Extract variables from template content
    const variables = this.extractVariables(data.bodyHtml);

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText || this.htmlToText(data.bodyHtml),
        category: data.category,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        variables: variables,
        organizationId,
        userId,
      },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "template.created", "template", template.id, {
      name: template.name,
      category: template.category,
      isPublic: template.isPublic,
    });

    return template;
  }

  async updateTemplate(
    templateId: string,
    organizationId: string,
    userId: string,
    data: Partial<TemplateData>
  ) {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        organizationId,
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Extract variables if body content is updated
    let variables = template.variables;
    if (data.bodyHtml) {
      variables = this.extractVariables(data.bodyHtml);
    }

    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject && { subject: data.subject }),
        ...(data.bodyHtml && { 
          bodyHtml: data.bodyHtml,
          bodyText: data.bodyText || this.htmlToText(data.bodyHtml),
        }),
        ...(data.bodyText && { bodyText: data.bodyText }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        variables,
      },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "template.updated", "template", templateId, {
      name: updatedTemplate.name,
      changes: Object.keys(data),
    });

    return updatedTemplate;
  }

  async deleteTemplate(templateId: string, organizationId: string, userId: string) {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        organizationId,
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Check if template is being used in any sequences
    const usage = await prisma.sequenceStep.findFirst({
      where: { templateId },
    });

    if (usage) {
      throw new Error("Cannot delete template that is being used in email sequences");
    }

    await prisma.emailTemplate.delete({
      where: { id: templateId },
    });

    // Log activity
    await this.logActivity(organizationId, userId, "template.deleted", "template", templateId, {
      name: template.name,
    });

    return true;
  }

  async getTemplates(
    organizationId: string,
    filters: TemplateFilters = {},
    page = 1,
    limit = 20
  ) {
    const where: any = {
      OR: [
        { organizationId },
        { isPublic: true },
      ],
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { subject: { contains: filters.search, mode: "insensitive" } },
        { bodyHtml: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.aiGenerated !== undefined) {
      where.aiGenerated = filters.aiGenerated;
    }

    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              sequenceSteps: true,
              emailSends: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(template => ({
        ...template,
        usageCount: template._count.sequenceSteps + template._count.emailSends,
        isOwner: template.organizationId === organizationId,
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getTemplateById(templateId: string, organizationId: string) {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { organizationId },
          { isPublic: true },
        ],
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            sequenceSteps: true,
            emailSends: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return {
      ...template,
      usageCount: template._count.sequenceSteps + template._count.emailSends,
      isOwner: template.organizationId === organizationId,
    };
  }

  async duplicateTemplate(
    templateId: string,
    organizationId: string,
    userId: string,
    newName?: string
  ) {
    const original = await this.getTemplateById(templateId, organizationId);
    
    const template = await this.createTemplate(organizationId, userId, {
      name: newName || `${original.name} (Copy)`,
      subject: original.subject,
      bodyHtml: original.bodyHtml,
      bodyText: original.bodyText,
      category: original.category,
      tags: original.tags,
      isPublic: false, // Always create private copies
    });

    return template;
  }

  async generateTemplate(
    organizationId: string,
    userId: string,
    options: AIGenerationOptions
  ) {
    try {
      const generatedContent = await aiEmailService.generateEmailContent({
        prompt: options.prompt,
        tone: options.tone,
        length: options.length,
        emailType: options.emailType,
        includeSubject: true,
        context: {
          recipientName: options.includePersonalization ? "{{firstName}}" : undefined,
          recipientCompany: options.includePersonalization ? "{{company}}" : undefined,
        },
      });

      // Create template with AI-generated content
      const template = await this.createTemplate(organizationId, userId, {
        name: this.generateTemplateName(options),
        subject: generatedContent.subject,
        bodyHtml: generatedContent.bodyHtml,
        bodyText: generatedContent.bodyText,
        category: options.emailType || "ai_generated",
        tags: ["ai-generated", options.emailType || "general"],
        isPublic: false,
        variables: generatedContent.variables,
      });

      // Mark as AI generated and store prompt
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          aiGenerated: true,
          aiPrompt: options.prompt,
        },
      });

      // Log activity
      await this.logActivity(organizationId, userId, "template.ai_generated", "template", template.id, {
        prompt: options.prompt,
        options,
      });

      return {
        ...template,
        aiGenerated: true,
        aiPrompt: options.prompt,
        spamScore: generatedContent.spamScore,
        suggestions: generatedContent.suggestions,
      };
    } catch (error) {
      throw new Error(`Failed to generate template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async optimizeTemplate(
    templateId: string,
    organizationId: string,
    userId: string,
    optimization: "subject" | "content" | "both" = "both"
  ) {
    const template = await this.getTemplateById(templateId, organizationId);
    
    if (!template.isOwner) {
      throw new Error("Cannot optimize templates you don't own");
    }

    const optimizations: any = {};

    try {
      if (optimization === "subject" || optimization === "both") {
        const subjectVariations = await aiEmailService.optimizeSubjectLine(
          template.subject,
          template.bodyHtml
        );
        optimizations.subjectVariations = subjectVariations;
      }

      if (optimization === "content" || optimization === "both") {
        const sentiment = await aiEmailService.analyzeEmailSentiment(template.bodyHtml);
        const spamCheck = await aiEmailService.checkSpamScore(template.bodyHtml, template.subject);
        
        optimizations.sentiment = sentiment;
        optimizations.spamCheck = spamCheck;
      }

      // Log activity
      await this.logActivity(organizationId, userId, "template.optimized", "template", templateId, {
        optimization,
        results: optimizations,
      });

      return optimizations;
    } catch (error) {
      throw new Error(`Failed to optimize template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getTemplatePerformance(templateId: string, organizationId: string) {
    const template = await this.getTemplateById(templateId, organizationId);
    
    // Get email sends for this template
    const emailSends = await prisma.emailSend.findMany({
      where: { templateId },
      include: {
        events: true,
      },
    });

    const stats = {
      totalSent: emailSends.length,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    emailSends.forEach(email => {
      const events = email.events;
      if (events.some(e => e.type === "DELIVERED")) stats.delivered++;
      if (events.some(e => e.type === "OPENED")) stats.opened++;
      if (events.some(e => e.type === "CLICKED")) stats.clicked++;
      if (events.some(e => e.type === "REPLIED")) stats.replied++;
      if (events.some(e => e.type === "BOUNCED")) stats.bounced++;
      if (events.some(e => e.type === "UNSUBSCRIBED")) stats.unsubscribed++;
    });

    const rates = {
      deliveryRate: stats.totalSent > 0 ? (stats.delivered / stats.totalSent) * 100 : 0,
      openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
      clickRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
      replyRate: stats.totalSent > 0 ? (stats.replied / stats.totalSent) * 100 : 0,
      bounceRate: stats.totalSent > 0 ? (stats.bounced / stats.totalSent) * 100 : 0,
      unsubscribeRate: stats.totalSent > 0 ? (stats.unsubscribed / stats.totalSent) * 100 : 0,
    };

    // Update template performance metrics
    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        openRate: rates.openRate / 100,
        clickRate: rates.clickRate / 100,
        replyRate: rates.replyRate / 100,
      },
    });

    return {
      ...stats,
      ...rates,
    };
  }

  async getTemplateCategories(organizationId: string) {
    const categories = await prisma.emailTemplate.groupBy({
      by: ["category"],
      where: {
        OR: [
          { organizationId },
          { isPublic: true },
        ],
        category: { not: null },
      },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));
  }

  async getTemplateVariables(templateId: string) {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
      select: { variables: true, bodyHtml: true, subject: true },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Extract current variables from content
    const currentVariables = this.extractVariables(
      template.subject + " " + template.bodyHtml
    );

    return {
      stored: template.variables || [],
      current: currentVariables,
      needsUpdate: JSON.stringify(template.variables?.sort()) !== JSON.stringify(currentVariables.sort()),
    };
  }

  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.replace(/[{}]/g, "")))];
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  private generateTemplateName(options: AIGenerationOptions): string {
    const type = options.emailType || "general";
    const tone = options.tone || "professional";
    const timestamp = new Date().toISOString().slice(0, 10);
    
    return `AI ${type.replace("_", " ")} (${tone}) - ${timestamp}`;
  }

  private async logActivity(
    organizationId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: any
  ) {
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
      },
    });
  }
}

export const templateService = new TemplateService();