import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import { elasticsearchService } from './services/elasticsearch.service';
import { imapService } from './services/imap.service';
import emailRoutes from './routes/email.routes';
import vectorRoutes from './routes/vector.routes';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', emailRoutes);
app.use('/api/vector', vectorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Onebox Email Aggregator API is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting Onebox Email Aggregator...\n');

    // Initialize Elasticsearch
    console.log('📊 Initializing Elasticsearch...');
    await elasticsearchService.initialize();

    // Connect to IMAP accounts
    console.log('\n📬 Connecting to IMAP accounts...');
    
    if (config.emailAccounts.length === 0) {
      console.warn('⚠️ No email accounts configured. Please add email credentials to .env file');
    } else {
      for (const account of config.emailAccounts) {
        await imapService.connectAccount(account);
      }
    }

    // Start Express server
    app.listen(config.port, () => {
      console.log(`\n✅ Server is running on port ${config.port}`);
      console.log(`🌐 API URL: http://localhost:${config.port}`);
      console.log(`🏥 Health check: http://localhost:${config.port}/health`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET    /api/emails - Get all emails with filters');
      console.log('   GET    /api/emails/:id - Get email by ID');
      console.log('   PATCH  /api/emails/:id/category - Update email category');
      console.log('   POST   /api/emails/:id/suggest-reply - Get AI suggested reply');
      console.log('   GET    /api/stats - Get statistics');
      console.log('   GET    /api/vector/documents - Get all vector documents');
      console.log('   POST   /api/vector/documents - Add new document');
      console.log('   POST   /api/vector/documents/search - Search documents');
      console.log('   DELETE /api/vector/documents/:id - Delete document');
      console.log('\n🎉 Onebox is ready to receive emails!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await imapService.disconnectAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await imapService.disconnectAll();
  process.exit(0);
});

// Start the server
startServer();