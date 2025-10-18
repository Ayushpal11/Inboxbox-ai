import { EmailAccount, Email } from '../types';
import { elasticsearchService } from './elasticsearch.service';
import { aiService } from './ai.service';
import { notificationService } from './notification.service';
import * as crypto from 'crypto';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

class ImapService {
  private connections: Map<string, ImapFlow> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  async connectAccount(account: EmailAccount): Promise<void> {
    try {
      const client = new ImapFlow({
        host: account.host,
        port: account.port,
        secure: account.secure,
        auth: {
          user: account.user,
          pass: account.password
        },
        logger: false
      });

      client.on('error', (err) => {
        console.error(`❌ IMAP error for ${account.id}:`, err.message);
        this.handleReconnect(account);
      });

      client.on('close', () => {
        console.log(`🔌 IMAP connection closed for ${account.id}`);
        this.handleReconnect(account);
      });

      await client.connect();
      console.log(`✅ Connected to IMAP account: ${account.id} (${account.user})`);

      this.connections.set(account.id, client);

      // Fetch last 30 days of emails
      await this.fetchRecentEmails(account.id);

      // Start IDLE mode for real-time updates
      await this.startIdleMode(account.id);
    } catch (error) {
      console.error(`❌ Failed to connect to ${account.id}:`, error);
      this.handleReconnect(account);
    }
  }

  private async handleReconnect(account: EmailAccount): Promise<void> {
    const existingTimer = this.reconnectTimers.get(account.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect ${account.id}...`);
      this.connectAccount(account);
    }, 30000); // Reconnect after 30 seconds

    this.reconnectTimers.set(account.id, timer);
  }

  private async fetchRecentEmails(accountId: string): Promise<void> {
    const client = this.connections.get(accountId);
    if (!client) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mailbox = await client.mailboxOpen('INBOX');
      console.log(`📬 Opened INBOX for ${accountId}, ${mailbox.exists} emails exist`);

      if (mailbox.exists === 0) {
        console.log(`📭 No emails in INBOX for ${accountId}`);
        return;
      }

      const messages = client.fetch(
        { since: thirtyDaysAgo },
        {
          envelope: true,
          source: true,
          flags: true,
          uid: true
        }
      );

      const emails: Email[] = [];

      for await (const msg of messages) {
        try {
          const source = msg.source ? Buffer.isBuffer(msg.source) ? msg.source : Buffer.from(String(msg.source)) : Buffer.from('');
          const parsed = await simpleParser(source);

          const toList: string[] = (parsed.to?.value || []).map((v: any) => (v && v.address) ? String(v.address) : '');

          const email: Email = {
            id: this.generateEmailId(accountId, Number(msg.uid)),
            accountId,
            messageId: parsed.messageId || `${accountId}-${msg.uid}`,
            from: parsed.from?.text || '',
            to: toList,
            subject: parsed.subject || '(No Subject)',
            body: parsed.html || parsed.textAsHtml || '',
            textBody: parsed.text || '',
            date: parsed.date || new Date(),
            folder: 'INBOX',
            flags: Array.isArray(msg.flags) ? msg.flags : Array.from(msg.flags || []),
            raw: source.toString()
          };

          emails.push(email);
        } catch (err) {
          console.error(`❌ Error parsing email:`, err);
        }
      }

      console.log(`📧 Fetched ${emails.length} emails from ${accountId}`);

      // First index emails in bulk, then categorize/process them.
      // This avoids attempting to update a document in Elasticsearch before it exists.
      if (emails.length > 0) {
        await elasticsearchService.bulkIndexEmails(emails);

        for (const email of emails) {
          await this.processEmail(email);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching recent emails for ${accountId}:`, error);
    }
  }

  private async startIdleMode(accountId: string): Promise<void> {
    const client = this.connections.get(accountId);
    if (!client) return;

    try {
      console.log(`👀 Starting IDLE mode for ${accountId}`);

      client.on('exists', async (data) => {
        console.log(`📨 New email detected in ${accountId}`);
        await this.fetchNewEmail(accountId, data.path);
      });

      // Keep IDLE connection alive
      setInterval(async () => {
        try {
          if (client.usable) {
            await client.noop();
          }
        } catch (err) {
          console.error(`❌ NOOP error for ${accountId}:`, err);
        }
      }, 5 * 60 * 1000); // Every 5 minutes

    } catch (error) {
      console.error(`❌ Error starting IDLE mode for ${accountId}:`, error);
    }
  }

  private async fetchNewEmail(accountId: string, path: string): Promise<void> {
    const client = this.connections.get(accountId);
    if (!client) return;

    try {
      const mailbox = await client.mailboxOpen('INBOX');
      const lastUid = mailbox.uidNext - 1;

      const message = await client.fetchOne(String(lastUid), {
        envelope: true,
        source: true,
        flags: true,
        uid: true
      });

      if (message) {
        const source = message.source ? (Buffer.isBuffer(message.source) ? message.source : Buffer.from(String(message.source))) : Buffer.from('');
        const parsed = await simpleParser(source);

  const toList: string[] = (parsed.to?.value || []).map((v: any) => (v && v.address) ? String(v.address) : '');

        const email: Email = {
          id: this.generateEmailId(accountId, Number(message.uid)),
          accountId,
          messageId: parsed.messageId || `${accountId}-${message.uid}`,
          from: parsed.from?.text || '',
          to: toList,
          subject: parsed.subject || '(No Subject)',
          body: parsed.html || parsed.textAsHtml || '',
          textBody: parsed.text || '',
          date: parsed.date || new Date(),
          folder: 'INBOX',
          flags: Array.isArray(message.flags) ? message.flags : Array.from(message.flags || []),
          raw: source.toString()
        };

  // Index the new message first, then process (categorize/notify)
  await elasticsearchService.indexEmail(email);
  await this.processEmail(email);

  console.log(`✅ Processed new email: ${email.subject}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching new email for ${accountId}:`, error);
    }
  }

  private async processEmail(email: Email): Promise<void> {
    try {
      // AI Categorization
      const category = await aiService.categorizeEmail(email);
      email.category = category;

      await elasticsearchService.updateEmailCategory(email.id, category);

      // Send notifications for interested emails
      if (category === 'interested') {
        await notificationService.sendSlackNotification(email);
        await notificationService.triggerWebhook(email);
      }
    } catch (error) {
      console.error(`❌ Error processing email:`, error);
    }
  }

  private generateEmailId(accountId: string, uid: number): string {
    return crypto
      .createHash('md5')
      .update(`${accountId}-${uid}`)
      .digest('hex');
  }

  async disconnectAll(): Promise<void> {
    for (const [accountId, client] of this.connections) {
      try {
        await client.logout();
        console.log(`👋 Disconnected from ${accountId}`);
      } catch (error) {
        console.error(`❌ Error disconnecting ${accountId}:`, error);
      }
    }
    this.connections.clear();

    // Clear all reconnect timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
  }
}

export const imapService = new ImapService();