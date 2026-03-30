import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

/**
 * Save a search query to the database
 */
export async function saveSearch(phoneNumber, latitude, longitude, query) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO searches (phone_number, latitude, longitude, query, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [phoneNumber, latitude, longitude, query]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

/**
 * Save businesses found in a search
 */
export async function saveBusinesses(searchId, places) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const place of places) {
      await client.query(
        `INSERT INTO businesses (
          search_id, place_id, name, address, 
          latitude, longitude, rating, open_now, types
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (search_id, place_id) DO NOTHING`,
        [
          searchId,
          place.place_id,
          place.name,
          place.address,
          place.latitude,
          place.longitude,
          place.rating,
          place.open_now,
          JSON.stringify(place.types)
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get search history for a phone number
 */
export async function getSearchHistory(phoneNumber, limit = 10) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM searches 
       WHERE phone_number = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [phoneNumber, limit]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    client.release();
  }
}
