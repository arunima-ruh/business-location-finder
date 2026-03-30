#!/usr/bin/env node

/**
 * Simulate WhatsApp webhook messages for testing
 * Usage: 
 *   node scripts/simulate-webhook.js location
 *   node scripts/simulate-webhook.js text "coffee shops"
 */

import axios from 'axios';

const BASE_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';
const PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '1234567890';

async function sendLocation(lat = 40.7580, lon = -73.9855, name = 'Times Square') {
  console.log(`📍 Sending location: ${name} (${lat}, ${lon})`);
  
  const payload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: PHONE_NUMBER,
            type: 'location',
            location: {
              latitude: lat,
              longitude: lon,
              name: name
            }
          }]
        }
      }]
    }]
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/webhook`, payload);
    console.log(`✅ Response: ${response.status}`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

async function sendText(text) {
  console.log(`💬 Sending text: "${text}"`);
  
  const payload = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: PHONE_NUMBER,
            type: 'text',
            text: {
              body: text
            }
          }]
        }
      }]
    }]
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/webhook`, payload);
    console.log(`✅ Response: ${response.status}`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

async function runScenario() {
  console.log('🎬 Running test scenario...\n');
  
  // Step 1: Send location
  await sendLocation();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Send search query
  await sendText('coffee shops');
  
  console.log('\n✅ Scenario complete!');
}

// Parse command line arguments
const [,, command, ...args] = process.argv;

if (!command) {
  console.log('Usage:');
  console.log('  node scripts/simulate-webhook.js location [lat] [lon] [name]');
  console.log('  node scripts/simulate-webhook.js text <message>');
  console.log('  node scripts/simulate-webhook.js scenario');
  process.exit(1);
}

switch (command) {
  case 'location':
    sendLocation(
      parseFloat(args[0]) || 40.7580,
      parseFloat(args[1]) || -73.9855,
      args[2] || 'Times Square'
    );
    break;
  
  case 'text':
    if (!args[0]) {
      console.error('❌ Please provide a text message');
      process.exit(1);
    }
    sendText(args.join(' '));
    break;
  
  case 'scenario':
    runScenario();
    break;
  
  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}
