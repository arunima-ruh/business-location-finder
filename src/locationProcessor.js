import { searchNearbyPlaces } from './placesAPI.js';
import { saveSearch, saveBusinesses } from './database.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { storeUserLocation } from './sessionManager.js';

const MAX_RESULTS = parseInt(process.env.MAX_RESULTS || '5');

/**
 * Process a location message - store it and prompt for query
 */
export async function processLocationMessage(phoneNumber, latitude, longitude, locationName) {
  try {
    console.log(`📍 Processing location: ${latitude}, ${longitude}`);

    // Store the location for this user
    await storeUserLocation(phoneNumber, latitude, longitude, locationName);

    // Ask user what they're looking for
    await sendWhatsAppMessage(
      phoneNumber,
      `📍 Got your location: ${locationName}\n\nWhat are you looking for?\n\nExamples:\n• "restaurants"\n• "coffee shops"\n• "pharmacies"\n• "gas stations"`
    );
    
  } catch (error) {
    console.error('Error processing location:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      '❌ Sorry, there was an error processing your location. Please try again.'
    );
  }
}

/**
 * Process a search query with stored location
 */
export async function processSearchQuery(phoneNumber, latitude, longitude, query) {
  try {
    console.log(`🔍 Searching for "${query}" near ${latitude}, ${longitude}`);

    // Search using Google Places API
    const places = await searchNearbyPlaces(latitude, longitude, query);

    if (places.length === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        `😕 No ${query} found nearby. Try a different search term or location.`
      );
      return;
    }

    // Save search to database
    const searchId = await saveSearch(phoneNumber, latitude, longitude, query);
    await saveBusinesses(searchId, places);

    // Format results
    const results = places.slice(0, MAX_RESULTS).map((place, index) => {
      const rating = place.rating ? `⭐ ${place.rating}` : 'No rating';
      const distance = place.distance ? `📏 ${Math.round(place.distance)}m away` : '';
      const open = place.open_now !== undefined 
        ? (place.open_now ? '🟢 Open' : '🔴 Closed')
        : '';
      
      return `${index + 1}. *${place.name}*\n   ${rating} ${open ? '• ' + open : ''}\n   ${place.address}\n   ${distance}`;
    }).join('\n\n');

    const message = `🔍 Found ${places.length} ${query} nearby:\n\n${results}`;

    await sendWhatsAppMessage(phoneNumber, message);

    console.log(`✅ Sent ${places.length} results to ${phoneNumber}`);

  } catch (error) {
    console.error('Error processing search:', error);
    await sendWhatsAppMessage(
      phoneNumber,
      '❌ Sorry, there was an error searching for businesses. Please try again.'
    );
  }
}
