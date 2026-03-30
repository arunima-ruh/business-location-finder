import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

config();

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Database schema created');

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
