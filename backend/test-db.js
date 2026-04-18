const { query } = require('./db');

query('SELECT NOW() AS now')
  .then((result) => {
    console.log('Database connection successful. Current time:', result.rows[0].now);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message || error);
    process.exit(1);
  });
