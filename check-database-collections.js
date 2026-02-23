/**
 * Check what collections exist in the database
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ossEnvPath = resolve(__dirname, '../OSS-Doorway/.env');
dotenv.config({ path: ossEnvPath });

const DB_URI = process.env.URI;
const DB_NAME = process.env.DB_NAME;

console.log(`🔌 Connecting to database...`);
console.log(`   URI: ${DB_URI?.substring(0, 40)}...`);
console.log(`   Database: ${DB_NAME}\n`);

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  
  console.log(`📚 Collections in ${DB_NAME}:`);
  const collections = await db.listCollections().toArray();
  
  if (collections.length === 0) {
    console.log(`   ⚠️  No collections found`);
  } else {
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name} (${count} documents)`);
      
      // If it's user_data or userData, show first few keys
      if (collection.name === 'user_data' || collection.name === 'userData') {
        const samples = await db.collection(collection.name).find({}).limit(5).toArray();
        console.log(`     Sample keys:`);
        samples.forEach(doc => {
          console.log(`       - ${doc._id} (customGroupId: ${doc.user_data?.customGroupId || 'N/A'})`);
        });
      }
    }
  }
  
  await client.close();
  console.log(`\n✅ Done`);
}

main().catch(console.error);
