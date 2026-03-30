import axios from 'axios';

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Send a text message via WhatsApp Business API
 */
export async function sendWhatsAppMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Message sent to ${to}`);
    return response.data;

  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send a location message via WhatsApp Business API
 */
export async function sendWhatsAppLocation(to, latitude, longitude, name, address) {
  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'location',
      location: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        name: name,
        address: address
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Location sent to ${to}`);
    return response.data;

  } catch (error) {
    console.error('Error sending WhatsApp location:', error.response?.data || error.message);
    throw error;
  }
}
