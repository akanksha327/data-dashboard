const express = require('express');
const {
  buildSimpleQueryChartPayload,
  generateAssistantResponse,
  getAiStatusSnapshot,
  inferQueryPlan,
  processSimpleQuery,
} = require('../src/services/ai.service');
const { executeQueryPlan } = require('../utils/dataProcessor');
const { getDataset, getLatestDataset } = require('../src/store/dataset-store');

const router = express.Router();
let lastResult = null;

function isFollowUp(question) {
  const lowercaseQuestion = question.toLowerCase();
  return lowercaseQuestion.includes('chart') || lowercaseQuestion.includes('graph');
}

function buildFollowUpResponse(question) {
  if (!lastResult) {
    return null;
  }

  return {
    id: Date.now().toString(),
    question,
    timestamp: new Date().toLocaleTimeString(),
    chartType: lastResult.chartType || 'bar',
    chartData: Array.isArray(lastResult.chartData) ? lastResult.chartData : [],
    chartConfig: lastResult.chartConfig || {},
    summary: 'Showing chart',
    insight: 'Showing chart',
    metrics: [],
    keyPoints: [],
    followUps: [],
    provider: 'direct',
    usedAi: false,
    plannerProvider: 'direct',
    plannerUsedAi: false,
    aiStatus: getAiStatusSnapshot({ provider: 'direct', usedAi: false }),
  };
}

router.post('/', async (req, res, next) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    const datasetId = typeof req.body?.datasetId === 'string' ? req.body.datasetId.trim() : '';

    if (!question) {
      res.status(400).json({ error: 'question is required.' });
      return;
    }

    const dataset = datasetId ? await getDataset(datasetId) : await getLatestDataset();

    if (!dataset) {
      res.status(404).json({
        error:
          'Dataset not found. Upload a CSV first, then retry the question with datasetId or use the latest uploaded dataset.',
      });
      return;
    }

    if (isFollowUp(question) && lastResult) {
      const followUpResponse = buildFollowUpResponse(question);

      if (followUpResponse) {
        lastResult = {
          ...lastResult,
          chartType: followUpResponse.chartType,
          chartData: followUpResponse.chartData,
          chartConfig: followUpResponse.chartConfig,
        };
        res.json(followUpResponse);
        return;
      }
    }

    // Check if this is a simple query that should return direct answers
    const isSimpleQuery = /\b(top|lowest|highest|average|total|count)\b/i.test(question.toLowerCase());

    if (isSimpleQuery) {
      // Process as simple query - direct answer only
      const simpleResult = processSimpleQuery(question, dataset);
      const chartPayload = buildSimpleQueryChartPayload(question, dataset);
      const response = {
        id: Date.now().toString(),
        question,
        timestamp: new Date().toLocaleTimeString(),
        chartType: null,
        chartData: [],
        chartConfig: {},
        summary: simpleResult,
        insight: simpleResult,
        metrics: [],
        keyPoints: [],
        followUps: [],
        provider: 'direct',
        usedAi: false,
        plannerProvider: 'direct',
        plannerUsedAi: false,
        aiStatus: getAiStatusSnapshot({ provider: 'direct', usedAi: false }),
      };

      lastResult = chartPayload
        ? {
            ...response,
            chartType: chartPayload.chartType,
            chartData: chartPayload.chartData,
            chartConfig: chartPayload.chartConfig,
          }
        : response;

      res.json(response);
      return;
    }

    // Complex queries with charts
    const planningResponse = await inferQueryPlan({ question, dataset });
    const { plan } = planningResponse;
    const result = executeQueryPlan({ dataset, question, plan });
    const assistantResponse = await generateAssistantResponse({
      question,
      dataset,
      plan,
      result,
    });

    const response = {
      ...result,
      summary: assistantResponse.summary,
      insight: assistantResponse.summary,
      keyPoints: assistantResponse.keyPoints,
      followUps: assistantResponse.followUps,
      provider: assistantResponse.provider,
      usedAi: assistantResponse.usedAi,
      plannerProvider: planningResponse.provider,
      plannerUsedAi: planningResponse.usedAi,
      aiStatus: assistantResponse.aiStatus || getAiStatusSnapshot({
        provider: assistantResponse.provider,
        usedAi: assistantResponse.usedAi,
      }),
    };

    lastResult = response;
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
