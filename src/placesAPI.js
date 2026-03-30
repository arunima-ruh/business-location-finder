import axios from 'axios';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SEARCH_RADIUS = parseInt(process.env.SEARCH_RADIUS || '1000');

/**
 * Search for nearby places using Google Places API
 */
export async function searchNearbyPlaces(latitude, longitude, query) {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    
    const params = {
      location: `${latitude},${longitude}`,
      radius: SEARCH_RADIUS,
      keyword: query,
      key: GOOGLE_PLACES_API_KEY
    };

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const places = response.data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating,
      open_now: place.opening_hours?.open_now,
      types: place.types,
      distance: calculateDistance(
        latitude,
        longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      )
    }));

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);

    return places;

  } catch (error) {
    console.error('Error searching places:', error.message);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
