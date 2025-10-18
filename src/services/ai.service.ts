import OpenAI from 'openai';
import { config } from '../config';
import { Email, EmailCategory, SuggestedReply } from '../types';

class AIService {
  private openai?: OpenAI;

  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    }
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    if (!this.openai) {
      console.warn('⚠️ OpenAI not configured, using fallback categorization');
      return this.fallbackCategorization(email);
    }

    try {
      const prompt = `Analyze this email and respond with ONLY one of the following category keywords: interested, meeting_booked, not_interested, spam, out_of_office, uncategorized.\n\nEmail: From: ${email.from}\nSubject: ${email.subject}\nBody: ${email.textBody?.substring(0,1000) || email.body.substring(0,1000)}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an email categorization assistant. Respond with exactly one keyword from the allowed list.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 10
      });

      const raw = (response.choices?.[0]?.message?.content || '').trim().toLowerCase();

      if (Object.values(EmailCategory).includes(raw as EmailCategory)) {
        return raw as EmailCategory;
      }

      return this.fallbackCategorization(email);
    } catch (error) {
      console.error('❌ Error in AI categorization:', error);
      return this.fallbackCategorization(email);
    }
  }

  private fallbackCategorization(email: Email): EmailCategory {
    const content = `${email.subject} ${email.textBody || email.body}`.toLowerCase();

    if (
      content.includes('out of office') ||
      content.includes('automatic reply') ||
      content.includes('away from') ||
      content.includes('on vacation')
    ) {
      return EmailCategory.OUT_OF_OFFICE;
    }

    if (
      content.includes('meeting confirmed') ||
      content.includes('calendar invite') ||
      content.includes('scheduled') ||
      content.includes('booking confirmed') ||
      content.includes('accepted your invitation')
    ) {
      return EmailCategory.MEETING_BOOKED;
    }

    if (
      content.includes('interested') ||
      content.includes('tell me more') ||
      content.includes('sounds good') ||
      content.includes('would like to') ||
      content.includes("let's discuss") ||
      content.includes('more information')
    ) {
      return EmailCategory.INTERESTED;
    }

    if (
      content.includes('not interested') ||
      content.includes('no thank') ||
      content.includes('unsubscribe') ||
      content.includes('remove me') ||
      content.includes('not at this time')
    ) {
      return EmailCategory.NOT_INTERESTED;
    }

    if (
      content.includes('click here') ||
      content.includes('limited time offer') ||
      content.includes('act now') ||
      content.includes('congratulations') ||
      content.includes('you have won')
    ) {
      return EmailCategory.SPAM;
    }

    return EmailCategory.UNCATEGORIZED;
  }

  async generateSuggestedReply(email: Email): Promise<SuggestedReply> {
    if (!this.openai) {
      return {
        reply: 'OpenAI API key not configured. Please add your API key to generate AI-powered replies.',
        confidence: 0,
        context: 'API not configured'
      };
    }

    try {
      const context = `Product/Service: ${config.product.name}\nOutreach Purpose: ${config.product.outreachAgenda}\nMeeting Link: ${config.product.meetingLink}`;

      const prompt = `Based on the context below, generate a professional and concise reply (max 150 words). Include the meeting link if the sender shows interest.\n\n${context}\n\nIncoming Email:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.textBody?.substring(0,1500) || email.body.substring(0,1500)}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional email assistant. Generate only the reply body, do not add signatures.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const reply = (response.choices?.[0]?.message?.content || '').trim();

      return {
        reply: reply || `Thanks for reaching out regarding ${email.subject}. I'll get back to you shortly.`,
        confidence: reply ? 0.85 : 0.4,
        context: 'AI-generated'
      };
    } catch (error) {
      console.error('❌ Error generating suggested reply:', error);
      return {
        reply: `Thank you for your email regarding ${email.subject}. I appreciate your message and will follow up shortly.`,
        confidence: 0.3,
        context: 'Fallback template'
      };
    }
  }
}

export const aiService = new AIService();