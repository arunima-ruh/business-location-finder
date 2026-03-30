# Quick Start Guide

Get your Business Location Finder running in 5 minutes! ⚡

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running
- Google Places API key
- WhatsApp Business API credentials

## Step 1: Clone & Install

```bash
cd business-location-finder
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```bash
# PostgreSQL
PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/business_finder

# Google Places API
GOOGLE_PLACES_API_KEY=your_api_key_here

# WhatsApp Business API
WHATSAPP_BUSINESS_API_TOKEN=your_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id_here

# Webhook
WEBHOOK_VERIFY_TOKEN=your_random_secure_token_here
```

## Step 3: Setup Database

```bash
npm run setup
```

## Step 4: Start Server

```bash
npm start
```

You should see:
```
🚀 Business Location Finder listening on port 3000
📍 Webhook URL: http://localhost:3000/webhook
```

## Step 5: Test Locally

### Option A: Using Test Scripts

```bash
# Test APIs
npm run test:api

# Simulate location message
npm run simulate:location

# Simulate search query
npm run simulate:text "coffee shops"

# Run full scenario
npm run simulate:scenario
```

### Option B: Using ngrok (for real WhatsApp)

```bash
# In a new terminal
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Configure in Meta Business Manager:
#   Webhook URL: https://abc123.ngrok.io/webhook
#   Verify Token: (from your .env WEBHOOK_VERIFY_TOKEN)
```

## Step 6: Use It!

1. **Open WhatsApp** on your phone
2. **Send location pin** to your business number
3. Bot responds: _"What are you looking for?"_
4. **Reply:** "coffee shops" (or any business type)
5. **Get results!** 🎉

## Common Issues

### Database connection failed
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
psql $PG_CONNECTION_STRING -c "SELECT 1"
```

### Google Places API error
- Verify API key is valid
- Ensure Places API is enabled in Google Cloud Console
- Check billing is set up

### WhatsApp webhook not working
- Ensure webhook URL is HTTPS (use ngrok for local dev)
- Verify token matches in both .env and Meta settings
- Check webhook subscriptions include "messages"

## Next Steps

- [Read full README](README.md) for detailed documentation
- [Deployment Guide](DEPLOYMENT.md) for production setup
- [Testing Guide](TESTING.md) for comprehensive testing

## Quick Commands Reference

```bash
# Development
npm run dev              # Auto-reload on changes
npm run test:api         # Test API connections
npm run simulate:scenario # Test full flow

# Database
npm run setup            # Initial setup
npm run clean            # Clean old data (30+ days)
npm run clean:dry        # Preview what would be deleted

# Production
npm start                # Start server
```

## Architecture Overview

```
WhatsApp → Webhook → Location Storage → User Query → Google Places → Results
                ↓                                            ↓
           PostgreSQL ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

1. User shares location via WhatsApp
2. Webhook receives location, stores in session
3. User sends search query
4. System fetches last location from session
5. Searches Google Places API
6. Saves results to database
7. Sends formatted results to WhatsApp

## Environment Variables Explained

| Variable | Purpose | Required |
|----------|---------|----------|
| `PG_CONNECTION_STRING` | PostgreSQL connection | ✅ |
| `GOOGLE_PLACES_API_KEY` | Google API access | ✅ |
| `WHATSAPP_BUSINESS_API_TOKEN` | WhatsApp auth | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone | ✅ |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp account | ✅ |
| `WEBHOOK_VERIFY_TOKEN` | Webhook security | ✅ |
| `PORT` | Server port | Optional (default: 3000) |
| `MAX_RESULTS` | Results to return | Optional (default: 5) |
| `SEARCH_RADIUS` | Search radius (meters) | Optional (default: 1000) |

## Support

- 📖 [Full Documentation](README.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🧪 [Testing Guide](TESTING.md)
- 🐛 Issues? Check logs: `npm start` shows real-time output

---

**Ready in 5 minutes! ⚡** Questions? Check the full README or open an issue.
