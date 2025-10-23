# InboxboxAI - Feature-Rich Email Aggregator

A comprehensive email onebox system with real-time IMAP synchronization, AI-powered categorization, and advanced search capabilities.

## 🚀 Features Implemented

### ✅ 1. Real-Time Email Synchronization
- Connects to multiple IMAP accounts simultaneously
- Fetches last 30 days of emails on startup
- Uses persistent IMAP connections with IDLE mode for real-time updates
- Automatic reconnection on connection loss
- No polling - purely event-driven

### ✅ 2. Searchable Storage with Elasticsearch
- Locally hosted Elasticsearch instance (Docker)
- Full-text search across subject, body, and sender
- Filter by folder, account, and AI category
- Indexed for fast retrieval

### ✅ 3. AI-Based Email Categorization
- Automatic categorization using OpenAI GPT-3.5
- Categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
- Fallback rule-based categorization when API unavailable
- Real-time categorization as emails arrive

### ✅ 4. Slack & Webhook Integration
- Slack notifications for "Interested" emails with rich formatting
- Webhook triggers to webhook.site for external automation
- Instant notifications when interest is detected

### ✅ 5. Frontend Interface
- Clean, modern UI with Tailwind CSS
- Real-time email display and filtering
- Search functionality powered by Elasticsearch
- Visual category badges
- Email detail view with full content

### ✅ 6. AI-Powered Suggested Replies (RAG)
- Vector database for storing product/outreach context
- RAG implementation using OpenAI
- Context-aware reply generation
- Training data storage and retrieval
- One-click copy suggested replies

## 📋 Prerequisites

- Node.js v24.10.0 or higher
- Docker and Docker Compose
- OpenAI API key (for AI features)
- IMAP-enabled email accounts (Gmail, Outlook, etc.)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd onebox
npm install
```

### 2. Install Additional Dependency (mailparser)

```bash
npm install mailparser
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Email Account 1 (Gmail example)
EMAIL1_HOST=imap.gmail.com
EMAIL1_PORT=993
EMAIL1_USER=your-email@gmail.com
EMAIL1_PASSWORD=your-app-password
EMAIL1_SECURE=true

# Email Account 2
EMAIL2_HOST=outlook.office365.com
EMAIL2_PORT=993
EMAIL2_USER=your-email@outlook.com
EMAIL2_PASSWORD=your-password
EMAIL2_SECURE=true

# OpenAI for AI features
OPENAI_API_KEY=sk-your-openai-api-key

# Slack webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Webhook.site for testing
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### 4. Start Elasticsearch

```bash
docker-compose up -d
```

Wait for Elasticsearch to be ready (check with `docker ps`).

### 5. Build and Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 📧 Gmail App Password Setup

For Gmail accounts, you need to create an App Password:

1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in your `.env` file

## 🧪 Testing with Postman

### Available Endpoints

#### 1. Get All Emails
```
GET http://localhost:3000/api/emails
Query params: query, folder, accountId, category, from, size
```

#### 2. Get Email by ID
```
GET http://localhost:3000/api/emails/:id
```

#### 3. Update Email Category
```
PATCH http://localhost:3000/api/emails/:id/category
Body: { "category": "interested" }
```

#### 4. Get AI Suggested Reply
```
POST http://localhost:3000/api/emails/:id/suggest-reply
```

#### 5. Get Statistics
```
GET http://localhost:3000/api/stats
```

#### 6. Vector DB - Get Documents
```
GET http://localhost:3000/api/vector/documents
```

#### 7. Vector DB - Add Document
```
POST http://localhost:3000/api/vector/documents
Body: {
  "id": "custom-doc",
  "content": "Your content here",
  "metadata": { "type": "custom" }
}
```

#### 8. Vector DB - Search Documents
```
POST http://localhost:3000/api/vector/documents/search
Body: { "query": "meeting link", "limit": 5 }
```

## 🌐 Frontend Access

Open your browser and navigate to:
```
file:///path/to/onebox/public/index.html
```

Or serve it with a simple HTTP server:
```bash
npx http-server public -p 8080
```

Then visit: `http://localhost:8080`

## 🏗️ Project Structure

```
onebox/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── services/
│   │   ├── elasticsearch.service.ts  # Elasticsearch operations
│   │   ├── imap.service.ts          # IMAP client & sync
│   │   ├── ai.service.ts            # AI categorization & RAG
│   │   ├── notification.service.ts  # Slack & webhooks
│   │   └── vector.service.ts        # Vector database
│   ├── routes/
│   │   ├── email.routes.ts          # Email API endpoints
│   │   └── vector.routes.ts         # Vector DB endpoints
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   └── index.ts                     # Main application
├── public/
│   └── index.html                   # Frontend interface
├── data/                            # Vector DB storage
├── docker-compose.yml               # Elasticsearch setup
├── tsconfig.json                    # TypeScript config
├── package.json
├── .env.example
└── README.md
```

## 🎯 Feature Checklist

- [x] **Feature 1**: Real-time IMAP sync with IDLE mode
- [x] **Feature 2**: Elasticsearch storage and search
- [x] **Feature 3**: AI email categorization
- [x] **Feature 4**: Slack & webhook notifications
- [x] **Feature 5**: Frontend UI with filters
- [x] **Feature 6**: RAG-powered suggested replies

## 🔧 Troubleshooting

### Elasticsearch Connection Error
```bash
# Check if Elasticsearch is running
docker ps

# View Elasticsearch logs
docker logs onebox-elasticsearch

# Restart Elasticsearch
docker-compose restart
```

### IMAP Connection Issues
- Ensure IMAP is enabled in your email account
- For Gmail: Use App Password, not regular password
- Check firewall settings for ports 993/143

### OpenAI API Errors
- Verify API key is correct
- Check API quota and billing
- System falls back to rule-based categorization

## 📊 Performance

- Handles multiple IMAP accounts concurrently
- Processes emails in real-time with sub-second latency
- Elasticsearch provides fast search (< 100ms for typical queries)
- AI categorization typically completes in 1-3 seconds

## 🔐 Security Considerations

- Store credentials in `.env` file (never commit)
- Use App Passwords for Gmail
- Implement rate limiting in production
- Sanitize email content before display
- Use HTTPS in production

## 🚀 Deployment

For production deployment:

1. Use environment-specific `.env` files
2. Set up proper logging
3. Implement authentication/authorization
4. Use managed Elasticsearch (AWS, Elastic Cloud)
5. Set up monitoring and alerts
6. Use process managers (PM2, Docker)

## 📝 License

ISC

## 👨‍💻 Author

Made with ❤️ for u

## 🙏 Acknowledgments

- Elasticsearch for powerful search
- ImapFlow for IMAP connectivity
- OpenAI for AI capabilities
- Tailwind CSS for beautiful UI
