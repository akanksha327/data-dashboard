const { GEMINI_API_KEY, GEMINI_MODEL, AI_PROVIDER } = require('../config');

const GEMINI_COOLDOWN_MS = 500;
const GEMINI_RETRY_DELAY_MS = 2000;
const GEMINI_RETRIES = 3;
const GEMINI_MAX_INLINE_RETRY_DELAY_MS = 3000;
const DEFAULT_GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash-lite'];

let lastPrompt = '';
let lastResponse = '';
let activeGeminiModel = normalizeText(GEMINI_MODEL) || 'gemini-1.5-flash';
let lastGeminiIssue = '';

const modelCooldowns = new Map();

// -------- HELPER FUNCTIONS --------
function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

function parseRetryDelayMs(rawErrorText) {
  const normalizedErrorText = normalizeText(rawErrorText);

  if (!normalizedErrorText) {
    return GEMINI_RETRY_DELAY_MS;
  }

  try {
    const parsed = JSON.parse(normalizedErrorText);
    const retryDelayValue = parsed?.error?.details?.find(
      (detail) => detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    )?.retryDelay;

    if (typeof retryDelayValue === 'string') {
      const secondsMatch = retryDelayValue.match(/(\d+(?:\.\d+)?)s/i);
      if (secondsMatch) {
        return Math.max(Math.ceil(Number(secondsMatch[1]) * 1000), GEMINI_RETRY_DELAY_MS);
      }
    }
  } catch (_error) {
    // Fall through to the regex-based parser below when the API returns plain text.
  }

  const retryInMatch = normalizedErrorText.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (retryInMatch) {
    return Math.max(Math.ceil(Number(retryInMatch[1]) * 1000), GEMINI_RETRY_DELAY_MS);
  }

  return GEMINI_RETRY_DELAY_MS;
}

function getConfiguredGeminiModel() {
  return normalizeText(GEMINI_MODEL) || 'gemini-1.5-flash';
}

function getGeminiCandidateModels() {
  return [
    activeGeminiModel,
    getConfiguredGeminiModel(),
    ...DEFAULT_GEMINI_FALLBACK_MODELS,
  ].filter((model, index, list) => model && list.indexOf(model) === index);
}

function getModelCooldownUntil(model) {
  return modelCooldowns.get(model) || 0;
}

function isModelCoolingDown(model) {
  return Date.now() < getModelCooldownUntil(model);
}

function findColumnFromQuestion(question, headers, expectedType) {
  const lowercaseQuestion = question.toLowerCase();
  const matchingHeaders = headers.filter((header) => {
    const typeMatches = !expectedType || header.type === expectedType;
    return typeMatches && lowercaseQuestion.includes(header.name.toLowerCase());
  });
  return matchingHeaders[0]?.name || null;
}

function getRequestedLimit(question) {
  const match = question.match(/\b(?:top|best|highest|lowest)\s+(\d{1,2})\b/i);
  if (!match) {
    return 5;
  }
  const parsedValue = Number(match[1]);
  if (!Number.isInteger(parsedValue)) {
    return 5;
  }
  return Math.min(Math.max(parsedValue, 3), 10);
}

function isDirectAnswer(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return false;
  }

  return ![
    'Invalid column',
    'No data available',
    'No identifier column found',
    'Error processing query',
  ].includes(normalizedValue);
}

function getSimpleQueryDimensionColumn(headers) {
  return (
    headers.find(
      (header) =>
        header.type === 'string' &&
        (header.name.toLowerCase().includes('name') ||
          header.name.toLowerCase().includes('title') ||
          header.name.toLowerCase() === 'id')
    )?.name || headers.find((header) => header.type === 'string')?.name || null
  );
}

function normalizeNarrativeText(value) {
  const normalizedValue = normalizeText(value).replace(/\s+/g, ' ');

  if (!normalizedValue) {
    return '';
  }

  const firstSentence = normalizedValue.split(/(?<=[.!?])\s+/)[0] || normalizedValue;
  return firstSentence.length <= 140
    ? firstSentence
    : `${firstSentence.slice(0, 137).trimEnd()}...`;
}

function buildRateLimitError(rawError, retryDelayMs, model) {
  const error = new Error('RATE_LIMIT');
  error.retryDelayMs = retryDelayMs;
  error.rawError = rawError;
  error.model = model;
  return error;
}

async function callGeminiWithModel(model, prompt, retries = GEMINI_RETRIES) {
  const normalizedPrompt = normalizeText(prompt);

  if (!normalizedPrompt) {
    return '';
  }

  if (normalizedPrompt === lastPrompt && lastResponse) {
    return lastResponse;
  }

  if (isModelCoolingDown(model)) {
    const cooldownError = new Error('RATE_LIMIT_COOLDOWN');
    cooldownError.model = model;
    cooldownError.retryDelayMs = getModelCooldownUntil(model) - Date.now();
    throw cooldownError;
  }

  try {
    await wait(GEMINI_COOLDOWN_MS);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (response.status === 429) {
      const rawError = await response.text();
      const retryDelayMs = parseRetryDelayMs(rawError);
      modelCooldowns.set(model, Date.now() + retryDelayMs);
      throw buildRateLimitError(rawError, retryDelayMs, model);
    }

    if (!response.ok) {
      const err = await response.text();
      const requestError = new Error(err || `API failed with ${response.status}`);
      requestError.model = model;
      throw requestError;
    }

    const data = await response.json();
    const text = extractGeminiText(data);

    if (text) {
      lastPrompt = normalizedPrompt;
      lastResponse = text;
    }

    activeGeminiModel = model;
    lastGeminiIssue = model === getConfiguredGeminiModel()
      ? ''
      : `${getConfiguredGeminiModel()} is quota-limited, using ${model} instead.`;

    return text;
  } catch (error) {
    if (
      retries > 0 &&
      error.message === 'RATE_LIMIT' &&
      (error.retryDelayMs || GEMINI_RETRY_DELAY_MS) <= GEMINI_MAX_INLINE_RETRY_DELAY_MS
    ) {
      console.warn(`Rate limited on ${model}. Retrying...`);
      await wait(error.retryDelayMs || GEMINI_RETRY_DELAY_MS);
      return callGeminiWithModel(model, prompt, retries - 1);
    }

    throw error;
  }
}

async function callGemini(prompt) {
  const normalizedPrompt = normalizeText(prompt);

  if (!normalizedPrompt) {
    return '';
  }

  if (normalizedPrompt === lastPrompt && lastResponse) {
    return lastResponse;
  }

  const candidateModels = getGeminiCandidateModels();
  let lastError = null;

  for (const model of candidateModels) {
    try {
      return await callGeminiWithModel(model, prompt);
    } catch (error) {
      lastError = error;

      if (error.message === 'RATE_LIMIT' || error.message === 'RATE_LIMIT_COOLDOWN') {
        if (!lastGeminiIssue) {
          lastGeminiIssue = `${model} is temporarily quota-limited.`;
        }
        continue;
      }

      break;
    }
  }

  throw lastError || new Error('Gemini request failed');
}

function parseQueryIntent(question, headers) {
  const lowercaseQuestion = question.toLowerCase();

  const nMatch = question.match(/\b(?:top|lowest|highest|best|bottom)\s+(\d{1,2})\b/i);
  const n = nMatch ? parseInt(nMatch[1], 10) : 1;

  const searchQuestion = lowercaseQuestion
    .replace(/\b(?:top|lowest|highest|best|bottom|by|and|or|the|a|an|names?|values?|data|results?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let targetColumn = null;

  for (const header of headers) {
    if (searchQuestion.includes(header.name.toLowerCase())) {
      targetColumn = header.name;
      break;
    }
  }

  if (!targetColumn) {
    if (lowercaseQuestion.includes('age')) {
      targetColumn = headers.find((header) => header.name.toLowerCase().includes('age'))?.name;
    } else if (lowercaseQuestion.includes('salary') || lowercaseQuestion.includes('pay')) {
      targetColumn = headers.find((header) => header.name.toLowerCase().includes('salary'))?.name;
    } else if (lowercaseQuestion.includes('sales') || lowercaseQuestion.includes('revenue')) {
      targetColumn = headers.find((header) => header.name.toLowerCase().includes('sales'))?.name;
    } else if (lowercaseQuestion.includes('score') || lowercaseQuestion.includes('grade')) {
      targetColumn = headers.find((header) => header.name.toLowerCase().includes('score'))?.name;
    }
  }

  const isDescending = /\b(top|highest|best)\b/i.test(lowercaseQuestion);
  const isAscending = /\b(lowest|bottom)\b/i.test(lowercaseQuestion);

  let queryType = 'ranking';
  if (lowercaseQuestion.includes('average') || lowercaseQuestion.includes('avg')) {
    queryType = 'average';
  } else if (lowercaseQuestion.includes('total') || lowercaseQuestion.includes('sum')) {
    queryType = 'total';
  } else if (lowercaseQuestion.includes('count')) {
    queryType = 'count';
  }

  return {
    queryType,
    targetColumn,
    n,
    sortDirection: isDescending ? 'desc' : isAscending ? 'asc' : 'desc',
    isValid: targetColumn !== null,
  };
}

// -------- SIMPLE QUERY PROCESSOR --------
function processSimpleQuery(question, dataset) {
  const intent = parseQueryIntent(question, dataset.headers);

  if (!intent.isValid) {
    return 'Invalid column';
  }

  if (!dataset.rows || dataset.rows.length === 0) {
    return 'No data available';
  }

  const { queryType, targetColumn, n, sortDirection } = intent;

  const dimensionColumn = getSimpleQueryDimensionColumn(dataset.headers);

  if (!dimensionColumn) {
    return 'No identifier column found';
  }

  try {
    switch (queryType) {
      case 'average': {
        const values = dataset.rows
          .map((row) => parseFloat(row[targetColumn]) || 0)
          .filter((value) => value > 0);
        const average =
          values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        return `Average ${targetColumn}: ${Math.round(average)}`;
      }
      case 'total': {
        const total = dataset.rows.reduce(
          (sum, row) => sum + (parseFloat(row[targetColumn]) || 0),
          0
        );
        return `Total ${targetColumn}: ${Math.round(total)}`;
      }
      case 'count':
        return `Rows: ${dataset.rows.length}`;
      case 'ranking':
      default: {
        const sortedData = [...dataset.rows]
          .map((row) => ({
            name: row[dimensionColumn] || 'Unknown',
            value: parseFloat(row[targetColumn]) || 0,
          }))
          .filter((item) => item.value > 0)
          .sort((left, right) =>
            sortDirection === 'desc' ? right.value - left.value : left.value - right.value
          );

        const resultCount =
          dataset.rows.length < n ? sortedData.length : Math.min(n, sortedData.length);
        const results = sortedData.slice(0, resultCount);

        return results.map((item) => `${item.name} (${Math.round(item.value)})`).join(', ');
      }
    }
  } catch (error) {
    console.warn('Query processing error:', error);
    return 'Error processing query';
  }
}

function buildSimpleQueryChartPayload(question, dataset) {
  const intent = parseQueryIntent(question, dataset.headers);

  if (!intent.isValid || intent.queryType !== 'ranking' || !dataset.rows?.length) {
    return null;
  }

  const dimensionColumn = getSimpleQueryDimensionColumn(dataset.headers);

  if (!dimensionColumn) {
    return null;
  }

  const chartData = [...dataset.rows]
    .map((row) => ({
      label: row[dimensionColumn] || 'Unknown',
      value: parseFloat(row[intent.targetColumn]) || 0,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) =>
      intent.sortDirection === 'desc' ? right.value - left.value : left.value - right.value
    )
    .slice(0, dataset.rows.length < intent.n ? dataset.rows.length : intent.n)
    .map((item) => ({
      label: item.label,
      value: Math.round(item.value),
    }));

  if (!chartData.length) {
    return null;
  }

  return {
    chartType: 'bar',
    chartData,
    chartConfig: {
      value: {
        label: intent.targetColumn,
        color: '#505081',
      },
    },
  };
}

function buildHeuristicPlan({ question, dataset }) {
  const numericColumns = dataset.headers.filter((header) => header.type === 'number');
  const stringColumns = dataset.headers.filter((header) => header.type === 'string');
  const metric =
    findColumnFromQuestion(question, dataset.headers, 'number') || numericColumns[0]?.name || null;
  const dimension =
    findColumnFromQuestion(question, dataset.headers, 'string') || stringColumns[0]?.name || null;
  const lowercaseQuestion = question.toLowerCase();

  if (/(top|best|highest|rank|leader)/i.test(lowercaseQuestion)) {
    return {
      intent: 'top_n',
      metric,
      dimension,
      limit: getRequestedLimit(question),
      chartType: 'bar',
      title: question,
      reason: 'Detected a ranking request from the question.',
    };
  }

  if (/(share|breakdown|distribution|split|mix)/i.test(lowercaseQuestion)) {
    return {
      intent: 'distribution',
      metric,
      dimension,
      limit: 5,
      chartType: 'pie',
      title: question,
      reason: 'Detected a distribution request from the question.',
    };
  }

  if (/(trend|growth|over time|change|month|daily|weekly|year)/i.test(lowercaseQuestion)) {
    return {
      intent: 'trend',
      metric,
      dimension,
      limit: 12,
      chartType: 'line',
      title: question,
      reason: 'Detected a trend request from the question.',
    };
  }

  return {
    intent: 'summary',
    metric,
    dimension,
    limit: 0,
    chartType: null,
    title: question,
    reason: 'Using a safe summary fallback for an ambiguous question.',
  };
}

function hasUsableGeminiKey() {
  const normalizedKey = normalizeText(GEMINI_API_KEY).toLowerCase();
  if (!normalizedKey) {
    return false;
  }
  return ![
    'your_api_key_here',
    'your_real_api_key',
    'your_api_key',
    'replace_me',
    'changeme',
  ].includes(normalizedKey);
}

function getAiStatusSnapshot({ provider = 'heuristic', usedAi = false } = {}) {
  const aiEnabled = AI_PROVIDER === 'gemini' && hasUsableGeminiKey();
  const configuredModel = getConfiguredGeminiModel();
  const activeModel = activeGeminiModel || configuredModel || null;
  const usingFallbackModel = Boolean(activeModel && configuredModel && activeModel !== configuredModel);

  if (!aiEnabled) {
    return {
      enabled: false,
      available: false,
      provider: 'heuristic',
      configuredModel,
      activeModel: null,
      usingFallbackModel: false,
      status: 'disabled',
      message: 'Gemini is not configured yet. The backend will keep using deterministic analytics.',
    };
  }

  if (usedAi) {
    return {
      enabled: true,
      available: true,
      provider: 'gemini',
      configuredModel,
      activeModel,
      usingFallbackModel,
      status: usingFallbackModel ? 'fallback-model' : 'live',
      message: usingFallbackModel
        ? `Live Gemini replies are running through ${activeModel} because ${configuredModel} is quota-limited.`
        : `Live Gemini replies are running through ${activeModel}.`,
    };
  }

  if (provider === 'direct') {
    return {
      enabled: true,
      available: true,
      provider: 'direct',
      configuredModel,
      activeModel,
      usingFallbackModel,
      status: usingFallbackModel ? 'ready-fallback' : 'ready',
      message: usingFallbackModel
        ? `Gemini is available through ${activeModel}. This answer came from direct analytics, so no AI call was needed.`
        : `Gemini is configured and ready. This answer came from direct analytics, so no AI call was needed.`,
    };
  }

  const cooldownedModels = getGeminiCandidateModels().filter(isModelCoolingDown);
  const allKnownModelsCoolingDown =
    cooldownedModels.length > 0 && cooldownedModels.length === getGeminiCandidateModels().length;

  if (allKnownModelsCoolingDown) {
    return {
      enabled: true,
      available: false,
      provider: 'heuristic',
      configuredModel,
      activeModel,
      usingFallbackModel,
      status: 'rate-limited',
      message:
        lastGeminiIssue ||
        `Configured Gemini models are temporarily quota-limited. The backend is using deterministic analytics for now.`,
    };
  }

  return {
    enabled: true,
    available: true,
    provider,
    configuredModel,
    activeModel,
    usingFallbackModel,
    status: usingFallbackModel ? 'ready-fallback' : 'ready',
    message: usingFallbackModel
      ? `Gemini is available through ${activeModel}. The backend can fall back to that model when ${configuredModel} is quota-limited.`
      : `Gemini is configured and ready.`,
  };
}

function buildNarrativeFallback({ question, dataset, deterministicSummary }) {
  const simpleResult = processSimpleQuery(question, dataset);

  if (isDirectAnswer(simpleResult)) {
    return {
      narrative: simpleResult,
      provider: 'direct',
      usedAi: false,
    };
  }

  return {
    narrative: normalizeText(deterministicSummary) || 'Unable to process query',
    provider: 'heuristic',
    usedAi: false,
  };
}

// -------- QUERY PLAN INFERENCE --------
async function inferQueryPlan({ question, dataset }) {
  const heuristicPlan = buildHeuristicPlan({ question, dataset });
  return { plan: heuristicPlan, provider: 'heuristic', usedAi: false };
}

async function generateNarrative({ question, dataset, deterministicSummary }) {
  const fallback = buildNarrativeFallback({ question, dataset, deterministicSummary });
  const aiEnabled = AI_PROVIDER === 'gemini' && hasUsableGeminiKey();

  if (!aiEnabled || fallback.provider === 'direct') {
    return {
      ...fallback,
      aiStatus: getAiStatusSnapshot({
        provider: fallback.provider,
        usedAi: fallback.usedAi,
      }),
    };
  }

  const prompt = `You are a strict AI data assistant.

OUTPUT FORMAT RULES:
- Return one short final answer line
- Max 1 sentence
- No explanation
- No reasoning
- No extra text
- No markdown

If the answer is a list, return comma-separated values.
If the answer is a number, return only the number.

TASK:
Question: "${question}"
Columns: ${dataset.headers.map((header) => `${header.name} (${header.type})`).join(', ')}
Deterministic summary: ${deterministicSummary || 'no data'}

Return answer:`;

  try {
    const text = await callGemini(prompt);
    const normalizedText = normalizeNarrativeText(text);

    return {
      narrative: normalizedText || fallback.narrative,
      provider: normalizedText ? 'gemini' : 'heuristic',
      usedAi: Boolean(normalizedText),
      aiStatus: getAiStatusSnapshot({
        provider: normalizedText ? 'gemini' : 'heuristic',
        usedAi: Boolean(normalizedText),
      }),
    };
  } catch (error) {
    const isRateLimit = error.message === 'RATE_LIMIT' || error.message === 'RATE_LIMIT_COOLDOWN';
    const fallbackReason = isRateLimit ? 'Gemini quota exceeded, using heuristic fallback.' : error.message;
    console.warn('AI fallback:', fallbackReason);

    return {
      narrative: normalizeText(deterministicSummary) || fallback.narrative,
      provider: 'heuristic',
      usedAi: false,
      aiStatus: getAiStatusSnapshot({
        provider: 'heuristic',
        usedAi: false,
      }),
    };
  }
}

// -------- ASSISTANT RESPONSE --------
async function generateAssistantResponse({ question, dataset, plan, result }) {
  void plan;

  const narrative = await generateNarrative({
    question,
    dataset,
    deterministicSummary: result?.summary,
  });

  return {
    summary: narrative.narrative,
    keyPoints: [],
    followUps: [],
    provider: narrative.provider,
    usedAi: narrative.usedAi,
    aiStatus: narrative.aiStatus,
  };
}

// -------- EXPORTS --------
module.exports = {
  buildSimpleQueryChartPayload,
  callGemini,
  generateAssistantResponse,
  generateNarrative,
  getAiStatusSnapshot,
  inferQueryPlan,
  processSimpleQuery,
};
