require('dotenv').config();

const { createApp } = require('./src/app');
const { PORT } = require('./src/config');

const app = createApp();

function isPlaceholderGeminiKey(apiKey) {
  const normalizedKey = String(apiKey || '').trim().toLowerCase();

  if (!normalizedKey) {
    return true;
  }

  return [
    'your_api_key_here',
    'your_real_api_key',
    'your_api_key',
    'replace_me',
    'changeme',
  ].includes(normalizedKey);
}

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const usingGeminiApi = !isPlaceholderGeminiKey(geminiApiKey);

if ((process.env.AI_PROVIDER || 'gemini').toLowerCase() === 'gemini' && !usingGeminiApi) {
  console.error('Gemini API key missing or placeholder. Update backend/.env with a real GEMINI_API_KEY.');
}

if (require.main === module) {
  startServer(PORT);
}

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

module.exports = { app };
