import dotenv from 'dotenv';
import { EmailAccount } from '../types';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: 'emails'
  },
  
  emailAccounts: [
    {
      id: 'account1',
      host: process.env.EMAIL1_HOST || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL1_PORT || '993', 10),
      user: process.env.EMAIL1_USER || '',
      password: process.env.EMAIL1_PASSWORD || '',
      secure: process.env.EMAIL1_SECURE === 'true'
    },
    {
      id: 'account2',
      host: process.env.EMAIL2_HOST || 'outlook.office365.com',
      port: parseInt(process.env.EMAIL2_PORT || '993', 10),
      user: process.env.EMAIL2_USER || '',
      password: process.env.EMAIL2_PASSWORD || '',
      secure: process.env.EMAIL2_SECURE === 'true'
    }
  ].filter(account => account.user && account.password) as EmailAccount[],
  
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
  },
  
  webhook: {
    url: process.env.WEBHOOK_URL || ''
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  
  vectorDb: {
    path: process.env.VECTOR_DB_PATH || './data/vector_db.json'
  },
  
  product: {
    name: process.env.PRODUCT_NAME || '',
    outreachAgenda: process.env.OUTREACH_AGENDA || '',
    meetingLink: process.env.MEETING_LINK || ''
  }
};