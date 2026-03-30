# Business Location Finder

On-demand business finder that extracts GPS coordinates from WhatsApp location messages and searches for nearby businesses using Google Places API.

## Features

- 📍 Extract GPS coordinates from WhatsApp location messages
- 🔍 Search for businesses using Google Places API
- 💾 Store search history in PostgreSQL
- 📱 Send formatted results back to WhatsApp
- ⭐ Display ratings, opening hours, and distances
- 📊 Track search analytics

## Prerequisites

- Node.js 18+
- PostgreSQL database
- WhatsApp Business API account
- Google Places API key

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# PostgreSQL Connection
PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/business_finder

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# WhatsApp Business API
WHATSAPP_BUSINESS_API_TOKEN=your_whatsapp_business_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Application Settings
PORT=3000
WEBHOOK_VERIFY_TOKEN=random_secure_token_here
MAX_RESULTS=5
SEARCH_RADIUS=1000
```

## Installation

```bash
# Install dependencies
npm install

# Set up database
npm run setup

# Start the server
npm start

# Development mode (with auto-reload)
npm run dev
```

## Setup Instructions

### 1. PostgreSQL Setup

```bash
# Create database
createdb business_finder

# Run setup script
npm run setup
```

### 2. Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Places API
3. Create API key
4. Add restrictions (optional but recommended)

### 3. WhatsApp Business API

1. Create a [Meta Business Account](https://business.facebook.com/)
2. Set up WhatsApp Business API
3. Get your access token and phone number ID
4. Configure webhook:
   - URL: `https://your-domain.com/webhook`
   - Verify token: (set in `.env` as `WEBHOOK_VERIFY_TOKEN`)
   - Subscribe to: `messages`

### 4. Deploy Webhook

The webhook must be publicly accessible. Options:

**Development (ngrok):**
```bash
ngrok http 3000
# Use the ngrok URL for WhatsApp webhook
```

**Production:**
- Deploy to a cloud platform (AWS, Google Cloud, Heroku, etc.)
- Ensure HTTPS is enabled
- Set up proper DNS

## Usage

### User Flow

1. **User shares location** via WhatsApp
   - Send GPS location from WhatsApp
   - Bot asks: "What are you looking for?"

2. **User sends search query**
   - Example: "coffee shops", "restaurants", "pharmacies"
   - Bot searches Google Places API

3. **Bot returns results**
   - Up to 5 nearest businesses
   - Includes name, rating, status, address, distance

### Example Conversation

```
User: [Sends location pin]

Bot: 📍 Got your location: Times Square
     What are you looking for? (e.g., "restaurants", "coffee shops", "pharmacies")

User: coffee shops

Bot: 🔍 Found 5 coffee shops nearby:

     1. *Starbucks Reserve*
        ⭐ 4.5 • 🟢 Open
        33 Liberty St
        📏 120m away

     2. *Blue Bottle Coffee*
        ⭐ 4.7 • 🟢 Open
        1 Rockefeller Plaza
        📏 250m away
     
     [...]
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-30T12:39:00.000Z"
}
```

### `GET /webhook`
WhatsApp webhook verification.

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Your verify token
- `hub.challenge`: Challenge string to return

### `POST /webhook`
WhatsApp webhook handler. Receives messages from WhatsApp.

## Database Schema

### `searches` table
Stores user location searches.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| phone_number | VARCHAR(20) | User's phone number |
| latitude | DECIMAL(10,8) | Search latitude |
| longitude | DECIMAL(11,8) | Search longitude |
| query | VARCHAR(255) | Search query |
| created_at | TIMESTAMP | When the search was made |

### `businesses` table
Stores found businesses from searches.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| search_id | INTEGER | Foreign key to searches |
| place_id | VARCHAR(255) | Google Places ID |
| name | VARCHAR(255) | Business name |
| address | TEXT | Business address |
| latitude | DECIMAL(10,8) | Business latitude |
| longitude | DECIMAL(11,8) | Business longitude |
| rating | DECIMAL(2,1) | Rating (0-5) |
| open_now | BOOLEAN | Currently open status |
| types | JSONB | Business types/categories |
| created_at | TIMESTAMP | When the record was created |

### `user_sessions` table
Stores temporary location data for users.

| Column | Type | Description |
|--------|------|-------------|
| phone_number | VARCHAR(20) | Primary key |
| latitude | DECIMAL(10,8) | Last location latitude |
| longitude | DECIMAL(11,8) | Last location longitude |
| location_name | VARCHAR(255) | Location name |
| updated_at | TIMESTAMP | Last update time |

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| MAX_RESULTS | 5 | Maximum results to return |
| SEARCH_RADIUS | 1000 | Search radius in meters |

## Troubleshooting

### Webhook not receiving messages
- Verify webhook URL is publicly accessible (HTTPS)
- Check WhatsApp webhook subscription settings
- Ensure verify token matches

### Google Places API errors
- Verify API key is valid
- Check Places API is enabled
- Review API quotas and billing

### Database connection issues
- Verify `PG_CONNECTION_STRING` is correct
- Ensure PostgreSQL is running
- Check database permissions

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use HTTPS** for webhook endpoints
3. **Validate webhook signatures** (implement Meta signature verification)
4. **Rate limit** API calls
5. **Sanitize inputs** before database queries
6. **Rotate API keys** regularly
7. **Use environment-specific configs** (dev/staging/prod)

## Future Enhancements

- [ ] Support for multiple languages
- [ ] Save favorite places
- [ ] Share business details with friends
- [ ] Photo attachments from Google Places
- [ ] User preferences and filters
- [ ] Analytics dashboard
- [ ] Webhook signature verification
- [ ] Rate limiting middleware
- [ ] Caching layer (Redis)
- [ ] Error notifications (Sentry)

## License

MIT

## Support

For issues or questions, please open an issue on the project repository.
