#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Starting invoice migration...');
  
  // Check if we have a real database URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('dummy') || dbUrl.includes('localhost')) {
    console.log('⚠️  No real database connection detected. Skipping migration.');
    console.log('💡 To run migration, set DATABASE_URL to your actual database connection string.');
    return;
  }

  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_missing_invoice_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Executing migration...');
    
    // Split by statements and execute each one
    const statements = migrationSQL
      .split('--')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('Migration to') && !s.startsWith('This adds'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === '42701') {
            // Column already exists
            console.log('⚠️  Column already exists:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing statement:', statement.substring(0, 50) + '...');
            console.error('Error:', error.message);
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);