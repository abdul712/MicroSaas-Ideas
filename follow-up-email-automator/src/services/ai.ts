import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailGenerationOptions {
  prompt: string;
  context?: {
    recipientName?: string;
    recipientCompany?: string;
    recipientJobTitle?: string;
    previousEmails?: string[];
    customFields?: Record<string, any>;
  };
  tone?: "professional" | "casual" | "friendly" | "urgent" | "grateful";
  length?: "short" | "medium" | "long";
  includeSubject?: boolean;
  emailType?: "cold_outreach" | "follow_up" | "welcome" | "reminder" | "thank_you";
}

export interface GeneratedEmail {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  spamScore?: number;
  suggestions?: string[];
}

export class AIEmailService {
  async generateEmailContent(options: EmailGenerationOptions): Promise<GeneratedEmail> {
    try {
      const systemPrompt = this.buildSystemPrompt(options);
      const userPrompt = this.buildUserPrompt(options);

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from AI");
      }

      return this.parseAIResponse(response);
    } catch (error) {
      console.error("AI email generation error:", error);
      throw new Error("Failed to generate email content");
    }
  }

  async optimizeSubjectLine(
    currentSubject: string,
    emailContent: string,
    targetAudience?: string
  ): Promise<string[]> {
    try {
      const prompt = `
        Given this email subject line: "${currentSubject}"
        And this email content: "${emailContent.substring(0, 500)}..."
        ${targetAudience ? `For target audience: ${targetAudience}` : ''}
        
        Generate 5 optimized subject line variations that would increase open rates.
        Focus on:
        - Curiosity and intrigue
        - Personalization
        - Clear value proposition
        - Urgency when appropriate
        - A/B testing potential
        
        Return only the subject lines, one per line.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return [];

      return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error("Subject line optimization error:", error);
      return [];
    }
  }

  async generateSequence(
    description: string,
    numberOfEmails: number,
    targetAudience: string,
    goal: string
  ): Promise<Array<{ subject: string; content: string; delayDays: number }>> {
    try {
      const prompt = `
        Create an email sequence with ${numberOfEmails} emails based on:
        - Description: ${description}
        - Target audience: ${targetAudience}
        - Goal: ${goal}
        
        For each email, provide:
        1. Subject line
        2. Email content (HTML format)
        3. Delay in days from previous email
        
        Make the sequence progressive, building trust and value with each email.
        Include clear calls-to-action and personalization opportunities.
        
        Format as JSON array with objects containing: subject, content, delayDays
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return [];

      try {
        return JSON.parse(response);
      } catch {
        // If JSON parsing fails, return empty array
        return [];
      }
    } catch (error) {
      console.error("Sequence generation error:", error);
      return [];
    }
  }

  async analyzeEmailSentiment(emailContent: string): Promise<{
    sentiment: "positive" | "neutral" | "negative";
    score: number;
    suggestions: string[];
  }> {
    try {
      const prompt = `
        Analyze the sentiment and tone of this email:
        "${emailContent}"
        
        Provide:
        1. Overall sentiment (positive/neutral/negative)
        2. Sentiment score (0-100, where 0 is very negative, 100 is very positive)
        3. 3 suggestions to improve the tone and effectiveness
        
        Format as JSON: { "sentiment": "", "score": 0, "suggestions": [] }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return { sentiment: "neutral", score: 50, suggestions: [] };
      }

      try {
        return JSON.parse(response);
      } catch {
        return { sentiment: "neutral", score: 50, suggestions: [] };
      }
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return { sentiment: "neutral", score: 50, suggestions: [] };
    }
  }

  async checkSpamScore(emailContent: string, subject: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `
        Analyze this email for spam indicators:
        Subject: "${subject}"
        Content: "${emailContent}"
        
        Check for:
        - Excessive caps, exclamation points
        - Spam trigger words
        - Poor HTML structure
        - Missing unsubscribe links
        - Suspicious links or attachments
        
        Return JSON: { "score": 0-100, "issues": [], "suggestions": [] }
        Score: 0 = very likely spam, 100 = clean
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 600,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return { score: 50, issues: [], suggestions: [] };
      }

      try {
        return JSON.parse(response);
      } catch {
        return { score: 50, issues: [], suggestions: [] };
      }
    } catch (error) {
      console.error("Spam score analysis error:", error);
      return { score: 50, issues: [], suggestions: [] };
    }
  }

  private buildSystemPrompt(options: EmailGenerationOptions): string {
    return `
      You are an expert email marketing specialist and copywriter. Your task is to generate high-converting, personalized email content.
      
      Guidelines:
      - Write in a ${options.tone || 'professional'} tone
      - Keep the length ${options.length || 'medium'} (short: <100 words, medium: 100-200 words, long: 200+ words)
      - Include personalization variables where appropriate (use {{variableName}} format)
      - Make the content engaging and action-oriented
      - Avoid spam trigger words and phrases
      - Include a clear call-to-action
      - Ensure mobile-friendly formatting
      
      Email type: ${options.emailType || 'follow_up'}
      
      Return the response in this exact JSON format:
      {
        "subject": "Email subject line",
        "bodyHtml": "HTML formatted email body",
        "bodyText": "Plain text version",
        "variables": ["array", "of", "variables", "used"],
        "suggestions": ["suggestions", "for", "improvement"]
      }
    `;
  }

  private buildUserPrompt(options: EmailGenerationOptions): string {
    let prompt = `Generate an email based on this prompt: ${options.prompt}`;
    
    if (options.context) {
      prompt += `\n\nContext:`;
      if (options.context.recipientName) {
        prompt += `\n- Recipient: ${options.context.recipientName}`;
      }
      if (options.context.recipientCompany) {
        prompt += `\n- Company: ${options.context.recipientCompany}`;
      }
      if (options.context.recipientJobTitle) {
        prompt += `\n- Job Title: ${options.context.recipientJobTitle}`;
      }
      if (options.context.previousEmails?.length) {
        prompt += `\n- Previous emails in sequence: ${options.context.previousEmails.length}`;
      }
      if (options.context.customFields) {
        prompt += `\n- Custom data: ${JSON.stringify(options.context.customFields)}`;
      }
    }
    
    return prompt;
  }

  private parseAIResponse(response: string): GeneratedEmail {
    try {
      const parsed = JSON.parse(response);
      return {
        subject: parsed.subject || "Generated Subject",
        bodyHtml: parsed.bodyHtml || parsed.content || "Generated content",
        bodyText: parsed.bodyText || this.htmlToText(parsed.bodyHtml || ""),
        variables: parsed.variables || [],
        suggestions: parsed.suggestions || [],
      };
    } catch {
      // Fallback parsing if JSON fails
      const lines = response.split('\n');
      const subject = lines.find(line => line.toLowerCase().includes('subject'))?.replace(/subject:?/i, '').trim() || "Generated Subject";
      const bodyHtml = response.replace(/subject:?.*/i, '').trim();
      
      return {
        subject,
        bodyHtml,
        bodyText: this.htmlToText(bodyHtml),
        variables: this.extractVariables(bodyHtml),
        suggestions: [],
      };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/[{}]/g, ''));
  }
}

export const aiEmailService = new AIEmailService();