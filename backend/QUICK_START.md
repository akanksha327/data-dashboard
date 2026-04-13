# 🚀 AI Integration - Quick Start Guide

## Prerequisites
✅ All files have been fixed and updated
✅ Environment configured with Gemini API key
✅ Node dependencies installed

## 5-Minute Setup

### 1. Verify API Key
```bash
cd "d:\Projects\Labmentix\ai dashboard\data dashboard\backend"
cat .env | grep GEMINI_API_KEY
```

**Expected output:**
```
GEMINI_API_KEY=AIzaSy...
```

**If missing or wrong:**
- Go to https://ai.google.dev
- Click "Get API Key"
- Copy the key
- Update `.env` file with your actual key

### 2. Start the Server
```bash
npm run dev
```

**Expected output:**
```
Data Dashboard backend is running on port 5000
Press Ctrl+C to stop
```

### 3. Test Upload (PowerShell/Terminal)
```powershell
curl -X POST http://localhost:5000/upload `
  -F "file=@C:\path\to\test.csv" `
  -H "Accept: application/json"
```

**Or use Postman:**
- Method: POST
- URL: `http://localhost:5000/upload`
- Body: form-data → Key: "file" → Value: (select CSV)

**Expected response:**
```json
{
  "datasetId": "uuid-here",
  "uploadedFile": { "name": "test.csv", "size": "..." },
  "headers": [ { "name": "...", "type": "number" } ],
  "charts": { "barData": [...] },
  "insights": [ { "title": "...", "description": "..." } ]
}
```

### 4. Test AI Query
```powershell
curl -X POST http://localhost:5000/query `
  -H "Content-Type: application/json" `
  -d @"
{
  "question": "What is the top category by sales?",
  "datasetId": "YOUR_DATASET_ID"
}
"@
```

**Expected response:**
```json
{
  "id": "1234567890",
  "question": "What is the top category by sales?",
  "chartType": "bar",
  "chartData": [...],
  "summary": "The AI-generated summary will appear here",
  "usedAi": true,
  "provider": "gemini"
}
```

## ✨ What Changed

| File | Change | Status |
|------|--------|--------|
| `src/services/ai.service.js` | Complete rewrite with full AI integration | ✅ |
| `src/services/analytics.service.js` | Added AI insights generation | ✅ |
| `routes/query.js` | Fixed import path | ✅ |
| New: `AI_INTEGRATION_SETUP.md` | Comprehensive setup guide | ✅ |
| New: `CHANGES_SUMMARY.md` | Detailed change log | ✅ |

## 🧪 Quick Test Scenarios

### Scenario 1: AI Planning
```json
{
  "question": "Show me the top 5 products",
  "datasetId": "YOUR_DATASET_ID"
}
```
**Expected**: AI detects intent as `top_n`, suggests bar chart

### Scenario 2: Distribution Analysis
```json
{
  "question": "What's the breakdown by category?",
  "datasetId": "YOUR_DATASET_ID"
}
```
**Expected**: AI suggests pie chart, `distribution` intent

### Scenario 3: Trend Analysis
```json
{
  "question": "Show sales growth over time",
  "datasetId": "YOUR_DATASET_ID"
}
```
**Expected**: AI suggests line chart, `trend` intent

## 📊 How to Know AI is Working

✅ Check for these indicators:

1. **Response includes AI metadata:**
   ```json
   {
     "usedAi": true,
     "provider": "gemini"
   }
   ```

2. **Summary is detailed and contextual** (not just numbers)

3. **Chart type matches question** (pie for distribution, line for trends, bar for top-N)

4. **No "AI error" messages** in server logs

## 🐛 If AI Not Working

### Check 1: API Key Valid?
```bash
# Should not be empty or placeholder
echo $env:GEMINI_API_KEY
```

### Check 2: Server Logs
```
Look for: "AI error:" messages
Look for: "Gemini failed" messages
```

### Check 3: Fallback Working?
If `usedAi: false` appears, system fell back to heuristics:
- This is normal if API key is missing
- Heuristics still provide good results
- Just slower/less intelligent

### Check 4: Network Connectivity
```powershell
# Test Google API access
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{"contents":[{"parts":[{"text":"hello"}]}]}'
```

## 🎯 Common Commands

### Start development server
```bash
npm run dev
```

### Upload CSV and get ID
```powershell
$response = curl -X POST http://localhost:5000/upload `
  -F "file=@data.csv" | ConvertFrom-Json
$response.datasetId
```

### Query with AI
```powershell
curl -X POST http://localhost:5000/query `
  -H "Content-Type: application/json" `
  -d "{
    \"question\": \"What are the top 10 items?\",
    \"datasetId\": \"YOUR_ID\"
  }"
```

### Check system health
```powershell
curl http://localhost:5000/health
```

## 📝 Environment Variables

Your `.env` file should have:
```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE...
GEMINI_MODEL=gemini-1.5-flash
```

## 🔍 Understanding the Flow

```
1. User uploads CSV → Backend parses it
                    ↓
2. User asks question → Sent to /query endpoint
                    ↓
3. AI plans query → inferQueryPlan() with Gemini API
                    ↓
4. Query executed → Data filtered & analyzed
                    ↓
5. AI generates response → generateAssistantResponse() with Gemini API
                    ↓
6. Results returned → Complete with AI insights & metadata
```

## ✅ Success Checklist

- [ ] `.env` has valid `GEMINI_API_KEY`
- [ ] Server starts with `npm run dev`
- [ ] Can upload CSV file
- [ ] `datasetId` returned from upload
- [ ] Can send query to `/query` endpoint
- [ ] Response includes `"usedAi": true`
- [ ] Response includes AI-generated summary
- [ ] Chart type matches question intent

## 🎓 Next Steps

1. Test with different CSV files
2. Try various question types
3. Monitor performance metrics
4. Customize prompts in `ai.service.js` if needed
5. Add rate limiting for production
6. Implement caching for repeated queries

## 📞 Need Help?

1. Read `AI_INTEGRATION_SETUP.md` for detailed config
2. Check `CHANGES_SUMMARY.md` to see all changes
3. Review server logs for errors
4. Test heuristic mode (disable AI) to isolate issues
5. Verify Gemini API quota at https://ai.google.dev

## 🎉 You're All Set!

Your AI integration is now:
- ✅ Fully configured
- ✅ Properly imported
- ✅ Ready to test
- ✅ With automatic fallback support

**Now go upload a CSV and ask some questions! 🚀**
