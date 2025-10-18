import { Router, Request, Response } from 'express';
import { elasticsearchService } from '../services/elasticsearch.service';
import { aiService } from '../services/ai.service';
import { SearchQuery } from '../types';

const router = Router();

// Get all emails with search and filters
router.get('/emails', async (req: Request, res: Response) => {
  try {
    const searchQuery: SearchQuery = {
      query: req.query.query as string,
      folder: req.query.folder as string,
      accountId: req.query.accountId as string,
      category: req.query.category as any,
      from: req.query.from ? parseInt(req.query.from as string, 10) : 0,
      size: req.query.size ? parseInt(req.query.size as string, 10) : 20
    };

    const emails = await elasticsearchService.searchEmails(searchQuery);
    
    res.json({
      success: true,
      count: emails.length,
      emails
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emails'
    });
  }
});

// Get email by ID
router.get('/emails/:id', async (req: Request, res: Response) => {
  try {
    const email = await elasticsearchService.getEmailById(req.params.id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      email
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email'
    });
  }
});

// Update email category
router.patch('/emails/:id/category', async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    await elasticsearchService.updateEmailCategory(req.params.id, category);

    res.json({
      success: true,
      message: 'Email category updated successfully'
    });
  } catch (error) {
    console.error('Error updating email category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email category'
    });
  }
});

// Generate AI suggested reply for an email
router.post('/emails/:id/suggest-reply', async (req: Request, res: Response) => {
  try {
    const email = await elasticsearchService.getEmailById(req.params.id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    const suggestedReply = await aiService.generateSuggestedReply(email);

    res.json({
      success: true,
      suggestedReply
    });
  } catch (error) {
    console.error('Error generating suggested reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggested reply'
    });
  }
});

// Get statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await elasticsearchService.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export default router;