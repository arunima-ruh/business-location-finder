# Deployment Guide

## Quick Start (Docker)

```bash
# Build image
docker build -t business-location-finder .

# Run with environment variables
docker run -d \
  --name business-finder \
  -p 3000:3000 \
  -e PG_CONNECTION_STRING="postgresql://..." \
  -e GOOGLE_PLACES_API_KEY="..." \
  -e WHATSAPP_BUSINESS_API_TOKEN="..." \
  -e WHATSAPP_PHONE_NUMBER_ID="..." \
  -e WHATSAPP_BUSINESS_ACCOUNT_ID="..." \
  business-location-finder
```

## Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## Cloud Deployment Options

### 1. Heroku

```bash
# Create app
heroku create business-finder

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set GOOGLE_PLACES_API_KEY=your_key
heroku config:set WHATSAPP_BUSINESS_API_TOKEN=your_token
# ... set other env vars

# Deploy
git push heroku main

# Run database setup
heroku run npm run setup
```

### 2. AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js business-finder

# Create environment with PostgreSQL RDS
eb create production --database

# Set environment variables via AWS Console or CLI
eb setenv GOOGLE_PLACES_API_KEY=your_key

# Deploy
eb deploy
```

### 3. Google Cloud Run

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/business-finder

# Deploy
gcloud run deploy business-finder \
  --image gcr.io/PROJECT_ID/business-finder \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_PLACES_API_KEY=your_key,..."
```

### 4. DigitalOcean App Platform

1. Connect GitHub repository
2. Select Node.js environment
3. Add PostgreSQL database
4. Set environment variables in dashboard
5. Deploy

## Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/index.js --name business-finder

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'business-finder',
    script: './src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## Monitoring

### Health Checks

```bash
# Simple health check
curl http://localhost:3000/health

# With uptime monitoring (UptimeRobot, Pingdom, etc.)
# Monitor: https://your-domain.com/health
# Expected response: 200 OK
```

### Logging

```bash
# PM2 logs
pm2 logs business-finder

# Docker logs
docker logs business-finder -f

# Heroku logs
heroku logs --tail
```

### Performance Monitoring

Consider integrating:
- **Sentry** for error tracking
- **New Relic** for APM
- **DataDog** for infrastructure monitoring

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump $PG_CONNECTION_STRING > backup.sql

# Automated daily backup (cron)
0 2 * * * pg_dump $PG_CONNECTION_STRING | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Restore
psql $PG_CONNECTION_STRING < backup.sql
```

### Backup Retention
- Daily: Keep 7 days
- Weekly: Keep 4 weeks
- Monthly: Keep 12 months

## Scaling Considerations

### Horizontal Scaling
- Load balancer (nginx, AWS ALB, Cloudflare)
- Multiple application instances
- Shared session storage (Redis)

### Database Scaling
- Connection pooling (already implemented)
- Read replicas for analytics
- Partitioning searches table by date

### Caching
- Redis for user sessions
- Cache API responses (5-minute TTL)
- CDN for static assets

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys restricted by domain/IP
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Webhook signature verification
- [ ] CORS properly configured
- [ ] Security headers (helmet.js)
- [ ] Regular dependency updates

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to production
        run: |
          # Your deployment commands here
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

## Troubleshooting Deployment

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database connection timeout
- Check firewall rules
- Verify database is accessible from deployment environment
- Check connection string format

### WhatsApp webhook not working
- Ensure public HTTPS URL
- Verify webhook token matches
- Check Meta Business Manager webhook subscriptions

## Cost Optimization

### Google Places API
- Monitor daily quota usage
- Implement caching for repeated searches
- Use Nearby Search (cheaper than Text Search)

### Database
- Regular cleanup of old searches
- Implement data retention policy
- Use connection pooling

### Infrastructure
- Right-size instance types
- Use spot instances for non-critical workloads
- Enable auto-scaling with min/max limits

## Support & Maintenance

- Monitor error rates daily
- Review logs weekly
- Update dependencies monthly
- Rotate keys quarterly
- Full security audit annually
