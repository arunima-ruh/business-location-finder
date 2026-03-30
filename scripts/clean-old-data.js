#!/usr/bin/env node

/**
 * Clean up old search data and expired sessions
 * Usage: node scripts/clean-old-data.js [--days=30] [--dry-run]
 */

import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

async function cleanOldData(daysToKeep = 30, dryRun = false) {
  const client = await pool.connect();
  
  try {
    console.log(`🧹 Cleaning data older than ${daysToKeep} days...`);
    if (dryRun) {
      console.log('🔍 DRY RUN - No data will be deleted\n');
    }
    
    // Clean old searches and their businesses
    const searchQuery = `
      SELECT COUNT(*) as count
      FROM searches
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;
    
    const searchResult = await client.query(searchQuery);
    const searchCount = searchResult.rows[0].count;
    
    console.log(`Found ${searchCount} old searches`);
    
    if (searchCount > 0 && !dryRun) {
      await client.query(`
        DELETE FROM searches
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      `);
      console.log(`✅ Deleted ${searchCount} old searches (and their businesses via CASCADE)`);
    }
    
    // Clean expired sessions (>1 hour old)
    const sessionQuery = `
      SELECT COUNT(*) as count
      FROM user_sessions
      WHERE updated_at < NOW() - INTERVAL '1 hour'
    `;
    
    const sessionResult = await client.query(sessionQuery);
    const sessionCount = sessionResult.rows[0].count;
    
    console.log(`Found ${sessionCount} expired sessions`);
    
    if (sessionCount > 0 && !dryRun) {
      await client.query(`
        DELETE FROM user_sessions
        WHERE updated_at < NOW() - INTERVAL '1 hour'
      `);
      console.log(`✅ Deleted ${sessionCount} expired sessions`);
    }
    
    // Show statistics
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM searches) as total_searches,
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM user_sessions) as active_sessions
    `);
    
    console.log('\n📊 Current Statistics:');
    console.log(`  Total searches: ${stats.rows[0].total_searches}`);
    console.log(`  Total businesses: ${stats.rows[0].total_businesses}`);
    console.log(`  Active sessions: ${stats.rows[0].active_sessions}`);
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let daysToKeep = 30;
let dryRun = false;

args.forEach(arg => {
  if (arg.startsWith('--days=')) {
    daysToKeep = parseInt(arg.split('=')[1]);
  } else if (arg === '--dry-run') {
    dryRun = true;
  }
});

cleanOldData(daysToKeep, dryRun)
  .then(() => {
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Cleanup failed:', err);
    process.exit(1);
  });
