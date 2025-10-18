import { Router, Request, Response } from 'express';
import { vectorService } from '../services/vector.service';
import { VectorDocument } from '../types';

const router = Router();

// Get all documents from vector DB
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const documents = vectorService.getAllDocuments();

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

// Add a new document to vector DB
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const { id, content, metadata } = req.body;

    if (!id || !content || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'id, content, and metadata are required'
      });
    }

    const document: VectorDocument = {
      id,
      content,
      metadata
    };

    vectorService.addDocument(document);

    res.json({
      success: true,
      message: 'Document added successfully',
      document
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add document'
    });
  }
});

// Search documents
router.post('/documents/search', async (req: Request, res: Response) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required'
      });
    }

    const results = vectorService.searchDocuments(query, limit || 5);

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    });
  }
});

// Delete a document
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const deleted = vectorService.deleteDocument(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

export default router;