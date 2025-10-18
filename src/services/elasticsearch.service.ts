import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { Email, SearchQuery } from '../types';

class ElasticsearchService {
  private client: Client;
  private index: string;

  constructor() {
    this.client = new Client({ node: config.elasticsearch.node });
    this.index = config.elasticsearch.index;
  }

  async initialize(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.index });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.index,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                accountId: { type: 'keyword' },
                messageId: { type: 'keyword' },
                from: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                to: { type: 'text' },
                subject: { type: 'text' },
                body: { type: 'text' },
                textBody: { type: 'text' },
                date: { type: 'date' },
                folder: { type: 'keyword' },
                flags: { type: 'keyword' },
                category: { type: 'keyword' },
                raw: { type: 'text', index: false }
              }
            },
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0
            }
          }
        });
        console.log(`✅ Elasticsearch index '${this.index}' created`);
      } else {
        console.log(`✅ Elasticsearch index '${this.index}' already exists`);
      }
    } catch (error) {
      console.error('❌ Error initializing Elasticsearch:', error);
      throw error;
    }
  }

  async indexEmail(email: Email): Promise<void> {
    try {
      await this.client.index({
        index: this.index,
        id: email.id,
        document: email
      });
      console.log(`📧 Indexed email: ${email.subject}`);
    } catch (error) {
      console.error('❌ Error indexing email:', error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: Email[]): Promise<void> {
    if (emails.length === 0) return;

    try {
      const body = emails.flatMap(email => [
        { index: { _index: this.index, _id: email.id } },
        email
      ]);

      const result = await this.client.bulk({ body, refresh: true });
      
      if (result.errors) {
        console.error('❌ Bulk indexing had errors');
      } else {
        console.log(`✅ Bulk indexed ${emails.length} emails`);
      }
    } catch (error) {
      console.error('❌ Error bulk indexing emails:', error);
      throw error;
    }
  }

  async searchEmails(searchQuery: SearchQuery): Promise<Email[]> {
    try {
      const must: any[] = [];
      
      if (searchQuery.query) {
        must.push({
          multi_match: {
            query: searchQuery.query,
            fields: ['subject^3', 'body^2', 'textBody^2', 'from', 'to']
          }
        });
      }

      if (searchQuery.folder) {
        must.push({ term: { folder: searchQuery.folder } });
      }

      if (searchQuery.accountId) {
        must.push({ term: { accountId: searchQuery.accountId } });
      }

      if (searchQuery.category) {
        must.push({ term: { category: searchQuery.category } });
      }

      const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

      const result = await this.client.search({
        index: this.index,
        body: {
          query,
          from: searchQuery.from || 0,
          size: searchQuery.size || 20,
          sort: [{ date: { order: 'desc' } }]
        }
      });

      return result.hits.hits.map(hit => hit._source as Email);
    } catch (error) {
      console.error('❌ Error searching emails:', error);
      throw error;
    }
  }

  async updateEmailCategory(emailId: string, category: string): Promise<void> {
    try {
      await this.client.update({
        index: this.index,
        id: emailId,
        body: {
          doc: { category }
        }
      });
      console.log(`✅ Updated email ${emailId} category to ${category}`);
    } catch (error) {
      console.error('❌ Error updating email category:', error);
      throw error;
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const result = await this.client.get({
        index: this.index,
        id: emailId
      });
      return result._source as Email;
    } catch (error) {
      if ((error as any).meta?.statusCode === 404) {
        return null;
      }
      console.error('❌ Error getting email by ID:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const result = await this.client.count({ index: this.index });
      return {
        totalEmails: result.count
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { totalEmails: 0 };
    }
  }
}

export const elasticsearchService = new ElasticsearchService();