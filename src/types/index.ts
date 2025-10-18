export interface EmailAccount {
  id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
}

export interface Email {
  id: string;
  accountId: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  textBody?: string;
  date: Date;
  folder: string;
  flags: string[];
  category?: EmailCategory;
  raw?: string;
}

export enum EmailCategory {
  INTERESTED = 'interested',
  MEETING_BOOKED = 'meeting_booked',
  NOT_INTERESTED = 'not_interested',
  SPAM = 'spam',
  OUT_OF_OFFICE = 'out_of_office',
  UNCATEGORIZED = 'uncategorized'
}

export interface SearchQuery {
  query?: string;
  folder?: string;
  accountId?: string;
  category?: EmailCategory;
  from?: number;
  size?: number;
}

export interface AIResponse {
  category: EmailCategory;
  confidence: number;
  reasoning?: string;
}

export interface SuggestedReply {
  reply: string;
  confidence: number;
  context?: string;
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type: string;
    [key: string]: any;
  };
  embedding?: number[];
}