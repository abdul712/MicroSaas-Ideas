import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TicketAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  urgencyScore: number
  suggestedTags: string[]
  suggestedResponse?: string
  escalationRecommended: boolean
}

export async function analyzeTicket(
  subject: string,
  description: string,
  customerEmail?: string
): Promise<TicketAnalysis> {
  try {
    const prompt = `
Analyze the following customer support ticket and provide a structured analysis:

Subject: ${subject}
Description: ${description}
Customer Email: ${customerEmail || 'Not provided'}

Please provide a JSON response with the following structure:
{
  "sentiment": "positive|negative|neutral",
  "category": "string (e.g., technical, billing, feature-request, bug-report)",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "urgencyScore": number (0-100),
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedResponse": "string (optional, if appropriate)",
  "escalationRecommended": boolean
}

Analysis guidelines:
- Sentiment: positive (happy/satisfied), negative (frustrated/angry), neutral
- Category: classify based on the nature of the issue
- Priority: LOW (general inquiries), MEDIUM (standard issues), HIGH (important problems), URGENT (critical/blocking issues)
- Urgency Score: 0-25 (LOW), 26-50 (MEDIUM), 51-75 (HIGH), 76-100 (URGENT)
- Suggested Tags: relevant keywords for categorization (max 5)
- Suggested Response: only if it's a simple query that can be answered directly
- Escalation: recommend if issue seems complex or customer is very frustrated
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in analyzing customer support tickets. Provide accurate, helpful analysis to help support teams prioritize and respond effectively.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const analysis = JSON.parse(response) as TicketAnalysis
    
    // Validate the response structure
    if (!analysis.sentiment || !analysis.category || !analysis.priority) {
      throw new Error('Invalid analysis structure from OpenAI')
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing ticket with OpenAI:', error)
    
    // Return default analysis on error
    return {
      sentiment: 'neutral',
      category: 'general',
      priority: 'MEDIUM',
      urgencyScore: 50,
      suggestedTags: ['general'],
      escalationRecommended: false,
    }
  }
}

export async function generateResponse(
  ticketSubject: string,
  ticketDescription: string,
  context?: {
    customerName?: string
    previousMessages?: string[]
    agentName?: string
  }
): Promise<string> {
  try {
    const prompt = `
Generate a professional, helpful response to the following customer support ticket:

Subject: ${ticketSubject}
Description: ${ticketDescription}
Customer Name: ${context?.customerName || 'Customer'}
Agent Name: ${context?.agentName || 'Support Agent'}

${context?.previousMessages?.length ? `
Previous conversation:
${context.previousMessages.join('\n')}
` : ''}

Please provide a response that:
- Is professional and empathetic
- Addresses the customer's concern directly
- Provides clear next steps or solutions
- Maintains a helpful tone
- Is personalized using the customer's name
- Includes a signature with the agent's name

Do not include any JSON formatting or metadata, just the response text.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional customer support agent. Write helpful, empathetic responses that solve customer problems while maintaining a friendly and professional tone.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return response.trim()
  } catch (error) {
    console.error('Error generating response with OpenAI:', error)
    
    // Return default response on error
    return `Hello ${context?.customerName || 'there'},

Thank you for contacting our support team. I've received your message regarding "${ticketSubject}" and I'm here to help you resolve this issue.

I'll review your request and get back to you with a solution as soon as possible. If you have any additional information that might help me assist you better, please feel free to share it.

Best regards,
${context?.agentName || 'Support Team'}`
  }
}

export async function categorizeTicket(subject: string, description: string): Promise<{
  category: string
  confidence: number
  suggestedDepartment?: string
}> {
  try {
    const prompt = `
Categorize the following support ticket:

Subject: ${subject}
Description: ${description}

Available categories:
- technical: Technical issues, bugs, system problems
- billing: Payment, invoicing, subscription issues
- account: Account management, login, profile issues
- feature-request: New feature suggestions, improvements
- general: General questions, information requests
- sales: Sales inquiries, product information
- compliance: Privacy, security, legal questions

Provide a JSON response with:
{
  "category": "category_name",
  "confidence": number (0-100),
  "suggestedDepartment": "department_name (optional)"
}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a ticket categorization system. Accurately categorize support tickets based on their content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('Error categorizing ticket:', error)
    return {
      category: 'general',
      confidence: 50,
    }
  }
}

export async function suggestKnowledgeBaseArticles(
  query: string,
  maxResults: number = 3
): Promise<string[]> {
  try {
    // This would typically search your knowledge base
    // For now, we'll generate relevant article titles based on the query
    const prompt = `
Given the following customer query, suggest ${maxResults} relevant knowledge base article titles that would help answer their question:

Query: ${query}

Provide ${maxResults} article titles that would be most helpful, formatted as a JSON array of strings.
Make the titles specific and actionable.

Example format: ["How to reset your password", "Troubleshooting login issues", "Setting up two-factor authentication"]
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledge base assistant. Suggest relevant article titles that would help customers solve their problems.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return []
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('Error suggesting knowledge base articles:', error)
    return []
  }
}

export default openai