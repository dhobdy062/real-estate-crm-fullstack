const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'real_estate_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

console.log('Testing database connection...');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || 5432}`);
console.log(`Database: ${process.env.DB_NAME || 'real_estate_crm'}`);
console.log(`User: ${process.env.DB_USER || 'postgres'}`);

client.connect()
  .then(() => {
    console.log('✅ Database connection successful!');
    return client.query('SELECT version();');
  })
  .then(result => {
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    return client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\';');
  })
  .then(result => {
    console.log('📋 Number of tables in database:', result.rows[0].count);
    client.end();
  })
  .catch(err => {
    console.log('❌ Database connection failed:', err.message);
    console.log('💡 This means PostgreSQL is not running or not accessible.');
    process.exit(1);
  });