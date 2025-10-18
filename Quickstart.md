# 🚀 Quick Start Guide

Get Onebox running in 5 minutes!

## Step 1: Install Missing Dependency

```bash
npm install mailparser
```

## Step 2: Create `.env` File

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your email credentials:

```env
PORT=3000

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Email Account 1 (Gmail)
EMAIL1_HOST=imap.gmail.com
EMAIL1_PORT=993
EMAIL1_USER=youremail@gmail.com
EMAIL1_PASSWORD=your-app-password
EMAIL1_SECURE=true

# Email Account 2 (optional)
EMAIL2_HOST=outlook.office365.com
EMAIL2_PORT=993
EMAIL2_USER=youremail@outlook.com
EMAIL2_PASSWORD=your-password
EMAIL2_SECURE=true

# OpenAI (for AI features)
OPENAI_API_KEY=sk-your-key-here

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Webhook (optional - use webhook.site)
WEBHOOK_URL=https://webhook.site/unique-url

# Product Info (for RAG)
PRODUCT_NAME=Job Application
OUTREACH_AGENDA=I am applying for a software engineer position
MEETING_LINK=https://cal.com/yourname
```

### Getting Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password to `.env`

## Step 3: Start Elasticsearch

```bash
docker-compose up -d
```

Verify it's running:
```bash
curl http://localhost:9200
```

## Step 4: Run the Application

```bash
npm run dev
```

You should see:
```
✅ Connected to IMAP account: account1
✅ Connected to IMAP account: account2
📧 Fetched X emails from account1
✅ Server is running on port 3000
```

## Step 5: Test with Postman

### Import Collection
1. Open Postman
2. Import `Postman_Collection.json`
3. Test endpoints:

**Get All Emails:**
```
GET http://localhost:3000/api/emails
```

**Search Emails:**
```
GET http://localhost:3000/api/emails?query=meeting
```

**Get Stats:**
```
GET http://localhost:3000/api/stats
```

## Step 6: Open Frontend

### Option A: Direct File Access
Open `public/index.html` in your browser

### Option B: HTTP Server (Recommended)
```bash
npx http-server public -p 8080
```

Then visit: http://localhost:8080

## 🎯 Quick Test Checklist

- [ ] Elasticsearch running (`docker ps`)
- [ ] Backend started (`npm run dev`)
- [ ] Emails synced (check console logs)
- [ ] API responding (`GET /health`)
- [ ] Frontend loaded
- [ ] Search working
- [ ] AI categorization active
- [ ] Suggested replies generated

## Common Issues

### Issue: "Cannot connect to Elasticsearch"
**Solution:** 
```bash
docker-compose down
docker-compose up -d
# Wait 30 seconds
npm run dev
```

### Issue: "IMAP connection failed"
**Solution:**
- Check email/password in `.env`
- For Gmail, ensure App Password is used
- Enable IMAP in email settings

### Issue: "OpenAI API error"
**Solution:**
- Verify API key
- Check https://platform.openai.com/account/billing
- App works without OpenAI (fallback categorization)

### Issue: Frontend not loading emails
**Solution:**
- Check console for CORS errors
- Verify API is running on port 3000
- Try `npx http-server public` instead of direct file

## 📹 Demo Flow

1. **Start Everything:**
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. **Send yourself a test email** with subject: "I'm interested in your product"

3. **Watch Console:** See real-time sync and AI categorization

4. **Check Slack:** Get notification (if configured)

5. **Open Frontend:** See the email appear

6. **Click Email:** View details and get AI suggested reply

7. **Test Postman:** Run all API endpoints

## 🎓 Next Steps

- Add more email accounts to `.env`
- Customize AI categories in `ai.service.ts`
- Train vector DB with your product info
- Set up Slack notifications
- Deploy to production

## 📚 Full Documentation

See `README.md` for complete documentation.

## Need Help?

Check the logs:
```bash
# Backend logs (in terminal running npm run dev)
# Elasticsearch logs
docker logs onebox-elasticsearch
```

Happy coding! 🚀