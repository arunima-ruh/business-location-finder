# Testing Guide

## Manual Testing

### Test Flow

1. **Share Location**
   - Open WhatsApp
   - Send a location pin to your business number
   - Expected: Bot responds with "Got your location" + prompt for search query

2. **Send Search Query**
   - Reply with: "coffee shops" or "restaurants"
   - Expected: Bot returns list of nearby businesses with ratings and distances

### Test Cases

#### Happy Path
```
User: [Shares location: 40.7580° N, 73.9855° W]
Bot: 📍 Got your location: Times Square
     What are you looking for?
     
     Examples:
     • "restaurants"
     • "coffee shops"
     • "pharmacies"
     • "gas stations"

User: coffee shops
Bot: 🔍 Found 5 coffee shops nearby:
     
     1. *Starbucks Reserve*
        ⭐ 4.5 • 🟢 Open
        33 Liberty St
        📏 120m away
     ...
```

#### Error Cases

**No location stored:**
```
User: coffee shops
Bot: 📍 Please share your location first so I can search for businesses near you!
```

**No results found:**
```
User: [Shares location]
Bot: [Prompts for query]

User: dragon training academy
Bot: 😕 No dragon training academy found nearby. Try a different search term or location.
```

**Expired location (>1 hour old):**
```
User: [Waits 2 hours]
User: restaurants
Bot: 📍 Please share your location first so I can search for businesses near you!
```

## API Testing

### Health Check
```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-30T12:39:00.000Z"
}
```

### Webhook Verification
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Expected: `test123`

### Simulate WhatsApp Location Message
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "type": "location",
            "location": {
              "latitude": 40.7580,
              "longitude": -73.9855,
              "name": "Times Square"
            }
          }]
        }
      }]
    }]
  }'
```

### Simulate WhatsApp Text Message
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "type": "text",
            "text": {
              "body": "coffee shops"
            }
          }]
        }
      }]
    }]
  }'
```

## Database Testing

### Check User Sessions
```sql
SELECT * FROM user_sessions;
```

### Check Recent Searches
```sql
SELECT 
  s.id,
  s.phone_number,
  s.query,
  s.created_at,
  COUNT(b.id) as results_found
FROM searches s
LEFT JOIN businesses b ON b.search_id = s.id
GROUP BY s.id
ORDER BY s.created_at DESC
LIMIT 10;
```

### Check Popular Queries
```sql
SELECT 
  query,
  COUNT(*) as search_count,
  AVG((SELECT COUNT(*) FROM businesses WHERE search_id = searches.id)) as avg_results
FROM searches
GROUP BY query
ORDER BY search_count DESC
LIMIT 10;
```

## Load Testing

### Using Artillery

**Install:**
```bash
npm install -g artillery
```

**artillery.yml:**
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Location + Search"
    flow:
      - post:
          url: "/webhook"
          json:
            entry:
              - changes:
                  - value:
                      messages:
                        - from: "{{ $randomNumber() }}"
                          type: "location"
                          location:
                            latitude: 40.7580
                            longitude: -73.9855
                            name: "Test Location"
      - think: 3
      - post:
          url: "/webhook"
          json:
            entry:
              - changes:
                  - value:
                      messages:
                        - from: "{{ $randomNumber() }}"
                          type: "text"
                          text:
                            body: "coffee shops"
```

**Run:**
```bash
artillery run artillery.yml
```

## Integration Testing

### Test Google Places API
```javascript
import { searchNearbyPlaces } from './src/placesAPI.js';

const latitude = 40.7580;
const longitude = -73.9855;
const query = 'coffee shops';

const places = await searchNearbyPlaces(latitude, longitude, query);
console.log(`Found ${places.length} places`);
console.log(places[0]);
```

### Test WhatsApp API
```javascript
import { sendWhatsAppMessage } from './src/whatsapp.js';

await sendWhatsAppMessage('1234567890', 'Test message');
```

### Test Database Connection
```bash
npm run setup
```

Or programmatically:
```javascript
import { testConnection } from './src/database.js';

const connected = await testConnection();
console.log('Database connected:', connected);
```

## End-to-End Testing

### Using Playwright

**Install:**
```bash
npm install -D @playwright/test
```

**tests/e2e.spec.js:**
```javascript
import { test, expect } from '@playwright/test';

test('health check', async ({ request }) => {
  const response = await request.get('http://localhost:3000/health');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.status).toBe('healthy');
});

test('webhook verification', async ({ request }) => {
  const response = await request.get(
    'http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=hello'
  );
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).toBe('hello');
});
```

**Run:**
```bash
npx playwright test
```

## Monitoring & Debugging

### Enable Debug Logging
```bash
DEBUG=* npm start
```

### Watch Logs in Real-Time
```bash
# PM2
pm2 logs business-finder --lines 100

# Docker
docker logs business-finder -f --tail 100

# Heroku
heroku logs --tail
```

### Check API Quotas

**Google Places:**
```bash
# Check usage in Google Cloud Console
# https://console.cloud.google.com/apis/dashboard
```

**WhatsApp:**
```bash
# Check in Meta Business Manager
# https://business.facebook.com/settings/whatsapp-business-accounts/
```

## Performance Benchmarks

### Expected Metrics
- **Response time:** < 200ms (webhook acknowledgment)
- **Search latency:** < 2s (location to results)
- **Database queries:** < 50ms
- **API calls:** < 1s (Google Places)
- **Memory usage:** < 150MB per instance
- **CPU usage:** < 50% under normal load

### Measure Performance
```bash
# Response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
```

**curl-format.txt:**
```
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect:    %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

## CI/CD Testing

### GitHub Actions Test Workflow

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: npm run setup
        env:
          PG_CONNECTION_STRING: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run tests
        run: npm test
        env:
          PG_CONNECTION_STRING: postgresql://postgres:postgres@localhost:5432/test_db
          GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
```

## Troubleshooting Tests

### Database Connection Fails
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $PG_CONNECTION_STRING

# Test connection
psql $PG_CONNECTION_STRING -c "SELECT 1"
```

### WhatsApp API Fails
```bash
# Check token validity
curl -H "Authorization: Bearer $WHATSAPP_BUSINESS_API_TOKEN" \
  https://graph.facebook.com/v18.0/me

# Check phone number
curl -H "Authorization: Bearer $WHATSAPP_BUSINESS_API_TOKEN" \
  https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID
```

### Google Places API Fails
```bash
# Test API key
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.7580,-73.9855&radius=1000&keyword=coffee&key=$GOOGLE_PLACES_API_KEY"
```

## Test Data Cleanup

```sql
-- Clear test data
DELETE FROM businesses WHERE search_id IN (
  SELECT id FROM searches WHERE phone_number LIKE 'test%'
);

DELETE FROM searches WHERE phone_number LIKE 'test%';

DELETE FROM user_sessions WHERE phone_number LIKE 'test%';

-- Or clear all data
TRUNCATE businesses, searches, user_sessions CASCADE;
```

## Automated Testing Script

```bash
#!/bin/bash

echo "🧪 Running Business Location Finder Tests"

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 10

# Run tests
echo "🔬 Running health check..."
curl -f http://localhost:3000/health || exit 1

echo "✅ All tests passed!"

# Cleanup
docker-compose down
```

Save as `test.sh` and run:
```bash
chmod +x test.sh
./test.sh
```
