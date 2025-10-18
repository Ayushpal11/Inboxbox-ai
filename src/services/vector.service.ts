import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { VectorDocument } from '../types';

class VectorService {
  private dbPath: string;
  private documents: VectorDocument[] = [];

  constructor() {
    this.dbPath = config.vectorDb.path;
    this.initializeDb();
  }

  private initializeDb(): void {
    const dir = path.dirname(this.dbPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.documents = JSON.parse(data);
        console.log(`✅ Loaded ${this.documents.length} documents from vector DB`);
      } catch (error) {
        console.error('❌ Error loading vector DB:', error);
        this.documents = [];
      }
    } else {
      this.initializeDefaultDocuments();
      this.saveDb();
    }
  }

  private initializeDefaultDocuments(): void {
    // Add default product and outreach information
    this.documents = [
      {
        id: 'product-info',
        content: `Product: ${config.product.name}\nDescription: ${config.product.outreachAgenda}`,
        metadata: {
          type: 'product',
          name: config.product.name
        }
      },
      {
        id: 'meeting-link',
        content: `Meeting booking link: ${config.product.meetingLink}`,
        metadata: {
          type: 'meeting',
          link: config.product.meetingLink
        }
      },
      {
        id: 'response-template-interested',
        content: `When someone shows interest, thank them and share the meeting link: ${config.product.meetingLink}`,
        metadata: {
          type: 'template',
          category: 'interested'
        }
      },
      {
        id: 'response-template-questions',
        content: 'When someone has questions, provide clear answers and offer to schedule a call to discuss further.',
        metadata: {
          type: 'template',
          category: 'questions'
        }
      }
    ];

    console.log('✅ Initialized vector DB with default documents');
  }

  private saveDb(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error('❌ Error saving vector DB:', error);
    }
  }

  addDocument(doc: VectorDocument): void {
    const existingIndex = this.documents.findIndex(d => d.id === doc.id);
    
    if (existingIndex >= 0) {
      this.documents[existingIndex] = doc;
    } else {
      this.documents.push(doc);
    }
    
    this.saveDb();
    console.log(`✅ Added/Updated document: ${doc.id}`);
  }

  searchDocuments(query: string, limit: number = 5): VectorDocument[] {
    // Simple keyword-based search (in production, use proper vector embeddings)
    const queryLower = query.toLowerCase();
    
    const scored = this.documents.map(doc => {
      const contentLower = doc.content.toLowerCase();
      let score = 0;

      // Simple scoring based on keyword matches
      const queryWords = queryLower.split(/\s+/);
      queryWords.forEach(word => {
        if (contentLower.includes(word)) {
          score += 1;
        }
      });

      return { doc, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.doc);
  }

  getRelevantContext(emailContent: string): string {
    const relevantDocs = this.searchDocuments(emailContent, 3);
    
    if (relevantDocs.length === 0) {
      return 'No specific context found.';
    }

    return relevantDocs.map(doc => doc.content).join('\n\n');
  }

  getAllDocuments(): VectorDocument[] {
    return this.documents;
  }

  deleteDocument(id: string): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.id !== id);
    
    if (this.documents.length < initialLength) {
      this.saveDb();
      console.log(`✅ Deleted document: ${id}`);
      return true;
    }
    
    return false;
  }
}

export const vectorService = new VectorService();