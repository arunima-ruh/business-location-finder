import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

/**
 * Store user's location temporarily
 */
export async function storeUserLocation(phoneNumber, latitude, longitude, locationName) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_sessions (phone_number, latitude, longitude, location_name, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (phone_number) 
       DO UPDATE SET 
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         location_name = EXCLUDED.location_name,
         updated_at = NOW()`,
      [phoneNumber, latitude, longitude, locationName]
    );
  } finally {
    client.release();
  }
}

/**
 * Get user's last known location
 */
export async function getUserLocation(phoneNumber) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT latitude, longitude, location_name, updated_at 
       FROM user_sessions 
       WHERE phone_number = $1`,
      [phoneNumber]
    );
    
    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];
    
    // Check if location is still fresh (less than 1 hour old)
    const age = Date.now() - new Date(session.updated_at).getTime();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    if (age > maxAge) {
      return null; // Location too old
    }

    return {
      latitude: parseFloat(session.latitude),
      longitude: parseFloat(session.longitude),
      locationName: session.location_name
    };
  } finally {
    client.release();
  }
}

/**
 * Clear user's location session
 */
export async function clearUserLocation(phoneNumber) {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM user_sessions WHERE phone_number = $1',
      [phoneNumber]
    );
  } finally {
    client.release();
  }
}
