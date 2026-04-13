# AI Integration Setup Guide

## Overview
This guide explains how the AI integration works in your data dashboard backend and how to configure it properly.

## Components

### 1. **AI Service** (`src/services/ai.service.js`)
- **`inferQueryPlan()`** - Uses AI (or heuristics) to understand user questions and create query plans
- **`generateAssistantResponse()`** - Generates AI-powered insights and summaries

### 2. **Analytics Service** (`src/services/analytics.service.js`)
- **`generateAIInsights()`** - Uses AI to analyze dataset and create smart insights
- **`generateHeuristicInsights()`** - Falls back to rule-based insights if AI unavailable
- Enhanced chart generation and data analysis

### 3. **Config** (`src/config.js`)
- Loads environment variables for AI providers
- Supports GEMINI (Google) model
- Fallback to heuristic mode if API key is invalid

## Configuration

### Step 1: Set Environment Variables

Create or update your `.env` file in the backend directory:

```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
AI_PROVIDER=gemini
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY
GEMINI_MODEL=gemini-1.5-flash
```

### Step 2: Get Gemini API Key

If you don't have a Gemini API key:

1. Go to https://ai.google.dev
2. Click "Get API Key" 
3. Create a new project or select existing
4. Copy your API key
5. Paste it in `.env` as `GEMINI_API_KEY`

### Step 3: Install Dependencies

```bash
npm install
```

The required package `@google/generative-ai` is already in package.json.

## How It Works

### Query Flow

1. **User sends question** → POST `/query` with question and datasetId
2. **AI plans query** → `inferQueryPlan()` uses AI to understand intent
3. **Execute plan** → Query processor filters/analyzes data based on plan
4. **Generate response** → `generateAssistantResponse()` creates AI insights
5. **Return results** → Client receives data with AI-generated summary

### Fallback Mode

If GEMINI API key is:
- **Missing**: System uses heuristic mode automatically
- **Invalid**: System detects and falls back to heuristics
- **Invalid format**: System detects and uses heuristics

The response always includes:
```json
{
  "usedAi": true|false,
  "provider": "gemini" or "heuristic"
}
```

## Testing

### Test with cURL

```bash
# Upload a CSV file
curl -X POST http://localhost:5000/upload \
  -F "file=@data.csv"

# Get datasetId from response, then query with AI
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the top 5 categories by sales?",
    "datasetId": "YOUR_DATASET_ID"
  }'
```

### Expected Response

```json
{
  "id": "123456789",
  "question": "What are the top 5 categories by sales?",
  "timestamp": "10:30:45 AM",
  "chartType": "bar",
  "chartData": [...],
  "summary": "Sales are led by...",
  "keyPoints": [],
  "followUps": [],
  "usedAi": true,
  "provider": "gemini"
}
```

## Features

### AI-Powered Query Planning
- Detects intent: `top_n`, `distribution`, `trend`, `summary`
- Automatically selects appropriate metric and dimension
- Suggests chart type based on question
- Falls back to heuristics if needed

### AI-Powered Insights
- Analyzes dataset patterns
- Generates actionable insights
- Provides trend analysis
- Shows data distribution

### Smart Analytics
- Automatic data type detection
- Numeric value parsing and formatting
- Context-aware recommendations
- Heuristic analysis as fallback

## Troubleshooting

### AI not working?

1. **Check API Key**
   ```bash
   # In .env, verify GEMINI_API_KEY is set correctly
   echo $GEMINI_API_KEY
   ```

2. **Check API Key Format**
   - Should start with "AIza"
   - Should be ~40+ characters
   - No spaces or newlines

3. **Check Network**
   ```bash
   # Test Gemini API connectivity
   curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"hello"}]}]}'
   ```

4. **Check Logs**
   - Look for "AI error" messages in console
   - System will automatically fall back to heuristics

### Still not working?

- Delete `node_modules` and run `npm install`
- Restart the server
- Check your Gemini API quota at ai.google.dev
- Make sure firewall allows outbound HTTPS to Google APIs

## Performance Notes

- AI queries add ~1-2 seconds latency
- Fallback to heuristics is instant
- Caching can be added for repeated questions
- Dataset size affects AI processing time

## Security

- Never commit `.env` file with real API keys
- Use `.env.example` for template
- Rotate API keys if compromised
- Add rate limiting for production
- Validate query parameters

## Next Steps

1. ✅ Set GEMINI_API_KEY in .env
2. ✅ Run `npm install`
3. ✅ Start server: `npm run dev`
4. ✅ Upload a CSV file
5. ✅ Ask a question to test AI
6. 📊 Monitor logs for AI usage
7. 🔧 Adjust prompts if needed

## Advanced Usage

### Customize AI Prompts

Edit prompts in `src/services/ai.service.js`:
- `inferQueryPlan()` - Planning prompt
- `generateAssistantResponse()` - Response prompt

### Support Different AI Providers

The system is designed to support multiple providers. To add OpenAI:

1. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4
   ```

2. Extend `ai.service.js` with OpenAI handler

### Batch Processing

For multiple queries, implement in `src/routes/query.routes.js`:
- Request batching
- Result caching
- Queue management

## Support

For issues or questions:
1. Check this guide
2. Review error logs
3. Test with heuristic mode
4. Check AI provider status
