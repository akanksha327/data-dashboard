# 🏗️ AI Integration Architecture

## System Overview

Your data dashboard now has a complete AI integration that understands natural language questions and provides intelligent insights about your data.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React/Next.js)              │
│                      Upload CSV & Ask Questions             │
└────────────────┬────────────────────────────────┬───────────┘
                 │                                │
            POST /upload                    POST /query
                 │                                │
┌────────────────▼────────────────────────────────▼───────────┐
│                    EXPRESS BACKEND SERVER                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │   UPLOAD ROUTE           │  │    QUERY ROUTE           │ │
│  │ ─────────────────────── │  │ ─────────────────────── │ │
│  │ 1. Receive CSV file      │  │ 1. Receive question      │ │
│  │ 2. Parse with CSV parser │  │ 2. Load dataset          │ │
│  │ 3. Detect column types   │  │ 3. Infer query plan      │ │
│  │ 4. Build snapshot        │  │ 4. Execute query         │ │
│  │ 5. Generate insights     │  │ 5. Generate response     │ │
│  │ 6. Store dataset         │  │ 6. Return results        │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│          │                              │                   │
│          ▼                              ▼                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          SERVICES LAYER                             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ ai.service.js (AI Integration Engine)        │  │   │
│  │ ├────────────────────────────────────────────────┤  │   │
│  │ │ • inferQueryPlan()                             │  │   │
│  │ │   - Sends question to Gemini API               │  │   │
│  │ │   - Gets intelligent query plan                │  │   │
│  │ │   - Falls back to heuristics if needed         │  │   │
│  │ │                                                │  │   │
│  │ │ • generateAssistantResponse()                  │  │   │
│  │ │   - Gets query results & context               │  │   │
│  │ │   - Asks Gemini for insights                   │  │   │
│  │ │   - Returns summary & recommendations          │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ analytics.service.js (Data Analysis)         │  │   │
│  │ ├────────────────────────────────────────────────┤  │   │
│  │ │ • generateAIInsights()                         │  │   │
│  │ │   - Uses AI to analyze dataset                 │  │   │
│  │ │   - Generates actionable insights              │  │   │
│  │ │                                                │  │   │
│  │ │ • generateCharts()                             │  │   │
│  │ │   - Creates bar/pie/line data                  │  │   │
│  │ │   - Formats for frontend visualization         │  │   │
│  │ │                                                │  │   │
│  │ │ • buildDatasetSnapshot()                       │  │   │
│  │ │   - Combines data + charts + insights          │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ csv.service.js (CSV Parsing)                 │  │   │
│  │ ├────────────────────────────────────────────────┤  │   │
│  │ │ • parseCsvUpload()                             │  │   │
│  │ │ • detectColumnTypes()                          │  │   │
│  │ │ • Handle various delimiters                    │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│          │                   │                               │
│          ▼                   ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          UTILITIES & STORAGE                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │ • dataProcessor.js                                   │ │
│  │   - Query execution and data transformation          │ │
│  │                                                        │ │
│  │ • dataset-store.js                                   │ │
│  │   - Save/retrieve datasets                           │ │
│  │   - File system storage                              │ │
│  │                                                        │ │
│  │ • config.js                                          │ │
│  │   - Environment variables                            │ │
│  │   - API keys & model settings                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  EXTERNAL: GEMINI API         │
         │  (Google Generative AI)       │
         │                               │
         │ • Query Planning              │
         │ • Response Generation         │
         │ • Data Insights               │
         └───────────────────────────────┘
                    │
                    ▼
         ┌───────────────────────────────┐
         │  GEMINI RETURN                │
         │                               │
         │ • Query plans (JSON)          │
         │ • Insights text               │
         │ • Recommendations             │
         └───────────────────────────────┘
```

## Data Flow Diagrams

### Upload Flow
```
CSV File
   │
   ▼
┌─────────────────┐
│ Upload Route    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse CSV       │ csv.service.js
│ - Detect        │
│   delimiter     │
│ - Parse lines   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Detect Column Types         │ csv.service.js
│ - Sample first 30 rows      │
│ - Classify as number/string │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Build Dataset Snapshot       │ analytics.service.js
│ - Format charts              │
│ - Generate insights          │
│ - Create charts (bar/pie)    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Save to Storage              │ dataset-store.js
│ - Save as JSON               │
│ - Generate UUID              │
│ - Cache in memory            │
└────────┬─────────────────────┘
         │
         ▼
   Return to Frontend
(datasetId, charts, insights)
```

### Query Flow
```
Natural Language Question
   │
   ▼
┌────────────────────┐
│ Query Route        │
│ - Receive question │
│ - Load dataset     │
└────────┬───────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Infer Query Plan                 │ ai.service.js
│ (inferQueryPlan)                 │
├──────────────────────────────────┤
│ PATH 1: AI Enabled               │
│   ├─ Send to Gemini API          │
│   └─ Get structured plan         │
│      {intent, metric, dimension} │
│                                  │
│ PATH 2: Heuristic Mode           │
│   └─ Use rule-based heuristics   │
│      (fallback if no AI)         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Execute Query Plan               │ dataProcessor.js
│ - Filter/aggregate data          │
│ - Build chart data               │
│ - Calculate metrics              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Generate Assistant Response      │ ai.service.js
│ (generateAssistantResponse)      │
├──────────────────────────────────┤
│ • Get query results context      │
│ • Send to Gemini API             │
│ • Get natural language summary   │
│   & insights                     │
└────────┬─────────────────────────┘
         │
         ▼
   Return to Frontend:
{
  id, question, timestamp,
  chartType, chartData,
  summary, keyPoints, followUps,
  usedAi, provider
}
```

## AI Integration Points

### 1. Query Planning (inferQueryPlan)
**Input**: User question + Dataset metadata
**Process**:
```
Question: "What are the top 5 products?"
         │
         ▼
   ┌─────────────────────────────────┐
   │ Sent to Gemini with prompt      │
   │ "Generate query plan as JSON"   │
   └──────────┬──────────────────────┘
              │
              ▼
   Gemini Response:
   {
     "intent": "top_n",
     "metric": "sales",
     "dimension": "product_name",
     "chartType": "bar",
     "limit": 5
   }
```

**Output**: Structured query plan for execution

### 2. Response Generation (generateAssistantResponse)
**Input**: Question + Results + Query plan
**Process**:
```
Results + Context
        │
        ▼
┌──────────────────────────────┐
│ Build prompt with results    │
│ Ask Gemini to summarize      │
└──────────┬───────────────────┘
           │
           ▼
Gemini Response:
"The top 5 products generated
 significant revenue with
 Product A leading at $150K..."
```

**Output**: Natural language insights

### 3. Data Insights (generateAIInsights)
**Input**: Dataset (headers + rows)
**Process**:
```
Dataset
  │
  ▼
┌──────────────────────────────┐
│ Analyze patterns             │
│ Send sample data + analysis  │
│ to Gemini                    │
└──────────┬───────────────────┘
           │
           ▼
Gemini Response:
[
  {
    "title": "Strong growth trend",
    "description": "Sales increased...",
    "metric": "+24.5%"
  }
]
```

**Output**: Array of insightful observations

## Fallback Mechanism

### How It Works

```
User Query
    │
    ▼
Is GEMINI_API_KEY valid?
    │
    ├─ YES ──────────────────┐
    │                        │
    │                    Try AI
    │                        │
    │                        ▼
    │                    API Success?
    │                        │
    │                    ├─ YES ──→ Use AI Results
    │                    │
    │                    └─ NO ──┐
    │                           │
    └─ NO ─────────────────────┘
                │
                ▼
        Use Heuristic Mode
        (Rule-based analysis)
                │
                ▼
        Response includes:
        { usedAi: false, provider: "heuristic" }
```

### Response Metadata

Every response includes metadata about how it was generated:

```json
{
  "usedAi": true|false,           // Was AI used?
  "provider": "gemini"|"heuristic", // Which provider?
  "plannerUsedAi": true|false,      // Was plan AI-generated?
  "plannerProvider": "gemini"|...   // Which provider for plan?
}
```

## Configuration Flow

```
.env File
   │
   ├─ PORT
   ├─ FRONTEND_ORIGIN
   ├─ AI_PROVIDER (gemini)
   ├─ GEMINI_API_KEY ◄─── Must be valid!
   └─ GEMINI_MODEL (gemini-1.5-flash)
         │
         ▼
config.js
   │
   ├─ Loads environment variables
   ├─ Exports to services
   └─ Used by:
      ├─ ai.service.js
      ├─ analytics.service.js
      └─ query routes
```

## Error Handling Strategy

```
                Error Occurs
                    │
                    ▼
            ┌─────────────────────┐
            │ Catch Error         │
            └────────┬────────────┘
                     │
                     ▼
        ┌───────────────────────────┐
        │ Log: "AI error: ..."      │
        └────────┬──────────────────┘
                 │
                 ▼
        ┌───────────────────────────┐
        │ Fall back to heuristics   │
        │ Return fallback response  │
        └────────┬──────────────────┘
                 │
                 ▼
     Set usedAi: false in response
     Mark provider: "heuristic"
```

## Performance Considerations

### Latency Profile
```
Operation                    Typical Time
─────────────────────────────────────────
CSV Parse                    < 100ms
Type Detection              < 50ms
Chart Generation            < 100ms
Heuristic Insights          < 100ms
AI Query Planning            1-2 seconds
AI Response Generation      1-2 seconds
Dataset Storage             < 50ms
─────────────────────────────────────────
Total without AI            < 500ms ✅
Total with AI               2-4 seconds ✅
```

### Optimization Opportunities
1. **Caching** - Store repeated query results
2. **Batch Processing** - Group multiple queries
3. **Async Processing** - Return quick results first
4. **Lazy Loading** - Generate insights on-demand
5. **Rate Limiting** - Control API call frequency

## Security Architecture

```
┌─────────────────────────────────────┐
│ Frontend (Browser)                  │
│ (User Uploaded CSV + Question)      │
└──────────┬──────────────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────────────┐
│ Backend (Node.js)                   │
│ - CORS validation                   │
│ - Input sanitization                │
│ - File size limits (10MB)           │
│ - Rate limiting (optional)          │
└──────────┬──────────────────────────┘
           │
           ├─→ Local: Dataset storage
           │   - File-based (./storage)
           │   - Never exposed publicly
           │
           └─→ External: Gemini API
               - HTTPS only
               - API key in .env
               - Never logged
```

## Testing Architecture

```
Manual Testing Path:
1. Upload CSV via /upload
2. Get datasetId response
3. Query via /query (use datasetId)
4. Verify response includes:
   - usedAi: true/false
   - provider: "gemini"/"heuristic"
   - Relevant chart type
   - Summary text
```

## Deployment Checklist

```
Pre-Deployment:
[ ] API key set in production .env
[ ] Dependencies installed (npm install)
[ ] Tests pass (manual or automated)
[ ] Rate limiting configured
[ ] Error monitoring enabled
[ ] Logs capture AI failures
[ ] Fallback mode tested

Deployment:
[ ] Build without dev dependencies
[ ] Set NODE_ENV=production
[ ] Configure CORS for production domain
[ ] Set up API monitoring
[ ] Test end-to-end flow

Post-Deployment:
[ ] Monitor error rates
[ ] Check API quota usage
[ ] Verify response times
[ ] Review user feedback
[ ] Adjust rate limits if needed
```

## System Resilience

```
Single Point of Failure Analysis:

1. Gemini API Down
   → System falls back to heuristics ✅

2. Network Connectivity Lost
   → Timeout triggers fallback ✅

3. Invalid API Key
   → Detected early, uses heuristics ✅

4. Dataset Storage Fails
   → Error returned to user ✅

5. CSV Parsing Error
   → Validation catches, returns 400 ✅

6. Memory Full
   → Depends on OS/server ⚠️
   → Add rate limiting to mitigate
```

## Success Metrics

Track these to ensure system health:

```
Metric                          Target
────────────────────────────────────────
AI Success Rate              > 95%
Response Time (with AI)      2-4 sec
Response Time (heuristic)    < 500ms
Uptime                       99.5%
API Key Validity             Always valid
Chart Generation Rate        100%
Error Rate                   < 1%
User Satisfaction            Measured via feedback
```

This architecture ensures your dashboard is:
✅ Intelligent (AI-powered insights)
✅ Reliable (graceful fallback)
✅ Fast (optimized processing)
✅ Secure (API key protected)
✅ Scalable (modular design)
