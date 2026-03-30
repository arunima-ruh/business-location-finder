#!/usr/bin/env node

/**
 * Test script for API endpoints
 * Usage: node scripts/test-api.js
 */

import { config } from 'dotenv';
import { searchNearbyPlaces } from '../src/placesAPI.js';
import { testConnection } from '../src/database.js';

config();

async function testGooglePlacesAPI() {
  console.log('\n🧪 Testing Google Places API...');
  
  try {
    const latitude = 40.7580;
    const longitude = -73.9855;
    const query = 'coffee';
    
    console.log(`Searching for "${query}" near ${latitude}, ${longitude}`);
    const places = await searchNearbyPlaces(latitude, longitude, query);
    
    console.log(`✅ Found ${places.length} places`);
    
    if (places.length > 0) {
      console.log('\nFirst result:');
      console.log(`  Name: ${places[0].name}`);
      console.log(`  Address: ${places[0].address}`);
      console.log(`  Rating: ${places[0].rating || 'N/A'}`);
      console.log(`  Distance: ${Math.round(places[0].distance)}m`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Google Places API test failed:', error.message);
    return false;
  }
}

async function testDatabase() {
  console.log('\n🧪 Testing Database Connection...');
  const connected = await testConnection();
  return connected;
}

async function runTests() {
  console.log('🚀 Starting API Tests\n');
  console.log('=' .repeat(50));
  
  const results = {
    database: await testDatabase(),
    googlePlaces: await testGooglePlacesAPI()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`  Database: ${results.database ? '✅' : '❌'}`);
  console.log(`  Google Places API: ${results.googlePlaces ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

runTests();
