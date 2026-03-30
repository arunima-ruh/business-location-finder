import express from 'express';
import { config } from 'dotenv';
import { handleWebhook, verifyWebhook } from './webhook.js';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// WhatsApp webhook verification (GET)
app.get('/webhook', verifyWebhook);

// WhatsApp webhook handler (POST)
app.post('/webhook', handleWebhook);

app.listen(PORT, () => {
  console.log(`🚀 Business Location Finder listening on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
});
