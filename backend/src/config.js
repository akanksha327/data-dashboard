const path = require('node:path');

function normalizeEnv(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

const PORT = Number(process.env.PORT || 5000);
const FRONTEND_ORIGIN = normalizeEnv(process.env.FRONTEND_ORIGIN, 'http://localhost:3000');
const AI_PROVIDER = normalizeEnv(process.env.AI_PROVIDER, 'auto').toLowerCase();
const OPENAI_API_KEY = normalizeEnv(process.env.OPENAI_API_KEY);
const OPENAI_MODEL = normalizeEnv(process.env.OPENAI_MODEL, 'gpt-5-mini');
const GEMINI_API_KEY = normalizeEnv(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = normalizeEnv(process.env.GEMINI_MODEL, 'gemini-1.5-flash');
const DATASET_DIRECTORY = path.join(__dirname, '..', 'storage', 'datasets');

module.exports = {
  AI_PROVIDER,
  DATASET_DIRECTORY,
  FRONTEND_ORIGIN,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  PORT,
};
