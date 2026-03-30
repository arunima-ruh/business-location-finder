import { processLocationMessage, processSearchQuery } from './locationProcessor.js';
import { getUserLocation } from './sessionManager.js';

/**
 * Verify webhook for WhatsApp Business API
 */
export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
}

/**
 * Handle incoming WhatsApp messages
 */
export async function handleWebhook(req, res) {
  // Respond quickly to WhatsApp
  res.sendStatus(200);

  try {
    const body = req.body;

    // Check if this is a message event
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return;
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from;

    // Check if message contains location
    if (message.type === 'location') {
      const latitude = message.location.latitude;
      const longitude = message.location.longitude;
      const locationName = message.location.name || 'Shared Location';

      console.log(`📍 Received location from ${from}: ${latitude}, ${longitude}`);

      // Process in background
      processLocationMessage(from, latitude, longitude, locationName).catch(err => {
        console.error('Error processing location:', err);
      });
    }
    // Check if message is text (search query)
    else if (message.type === 'text') {
      const text = message.text.body.trim();
      console.log(`💬 Received text from ${from}: ${text}`);
      
      // Ignore empty messages
      if (!text) return;

      // Try to get user's stored location
      const location = await getUserLocation(from);

      if (location) {
        // User has a recent location, treat this as a search query
        console.log(`🔍 Searching for "${text}" using stored location`);
        processSearchQuery(
          from, 
          location.latitude, 
          location.longitude, 
          text
        ).catch(err => {
          console.error('Error processing search query:', err);
        });
      } else {
        // No recent location
        const { sendWhatsAppMessage } = await import('./whatsapp.js');
        await sendWhatsAppMessage(
          from,
          '📍 Please share your location first so I can search for businesses near you!'
        );
      }
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
  }
}
