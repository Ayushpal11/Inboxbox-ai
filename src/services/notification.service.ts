import axios from 'axios';
import { config } from '../config';
import { Email } from '../types';

class NotificationService {
  async sendSlackNotification(email: Email): Promise<void> {
    if (!config.slack.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      const message = {
        text: '🎯 New Interested Email Received!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from}`
              },
              {
                type: 'mrkdwn',
                text: `*Account:*\n${email.accountId}`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${new Date(email.date).toLocaleString()}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${email.textBody?.substring(0, 200) || email.body.substring(0, 200)}...`
            }
          }
        ]
      };

      await axios.post(config.slack.webhookUrl, message);
      console.log('✅ Slack notification sent');
    } catch (error) {
      console.error('❌ Error sending Slack notification:', error);
    }
  }

  async triggerWebhook(email: Email): Promise<void> {
    if (!config.webhook.url) {
      console.warn('⚠️ Webhook URL not configured');
      return;
    }

    try {
      const payload = {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        email: {
          id: email.id,
          accountId: email.accountId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          preview: email.textBody?.substring(0, 500) || email.body.substring(0, 500),
          date: email.date,
          category: email.category,
          folder: email.folder
        }
      };

      await axios.post(config.webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': 'email.interested'
        }
      });

      console.log('✅ Webhook triggered');
    } catch (error) {
      console.error('❌ Error triggering webhook:', error);
    }
  }
}

export const notificationService = new NotificationService();