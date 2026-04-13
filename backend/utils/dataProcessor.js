const COLOR_PALETTE = ['#505081', '#6B6BA8', '#8F8FC1', '#CFCFF0', '#3F3F66', '#7A7ACF'];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseNumeric(value) {
  const normalized = String(value ?? '').replace(/[$,%\s"']/g, '');
  const parsedValue = Number(normalized);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatNumber(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return Number(value).toLocaleString();
}

function truncateLabel(value, maxLength = 20) {
  const label = String(value ?? '');
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength)}...`;
}

function findColumn(headers, columnName, expectedType) {
  const normalizedColumnName = normalizeText(columnName).toLowerCase();
  if (!normalizedColumnName) {
    return null;
  }

  return (
    headers.find((header) => {
      const sameType = !expectedType || header.type === expectedType;
      return sameType && header.name.toLowerCase() === normalizedColumnName;
    })?.name || null
  );
}

function clampLimit(limit, defaultValue = 5) {
  if (!Number.isInteger(limit)) {
    return defaultValue;
  }

  return Math.min(Math.max(limit, 3), 12);
}

function buildBaseResponse(question) {
  return {
    id: Date.now().toString(),
    question,
    timestamp: new Date().toLocaleTimeString(),
  };
}

function buildNoNumericResponse(question) {
  return {
    ...buildBaseResponse(question),
    chartType: null,
    summary:
      'The uploaded dataset does not contain numeric columns yet, so the backend cannot calculate chart values for this question.',
    metrics: [],
  };
}

function resolvePlan({ dataset, question, plan }) {
  const numericColumns = dataset.headers.filter((header) => header.type === 'number');
  const stringColumns = dataset.headers.filter((header) => header.type === 'string');
  const lowercaseQuestion = question.toLowerCase();
  const defaultMetric = numericColumns[0]?.name || null;
  const defaultDimension = stringColumns[0]?.name || null;
  const metricFromQuestion =
    numericColumns.find((column) => lowercaseQuestion.includes(column.name.toLowerCase()))?.name || null;
  const dimensionFromQuestion =
    stringColumns.find((column) => lowercaseQuestion.includes(column.name.toLowerCase()))?.name || null;
  const intent = ['top_n', 'distribution', 'trend', 'summary'].includes(plan?.intent)
    ? plan.intent
    : 'summary';

  return {
    intent,
    metric:
      findColumn(dataset.headers, plan?.metric, 'number') ||
      metricFromQuestion ||
      defaultMetric,
    dimension:
      findColumn(dataset.headers, plan?.dimension) ||
      dimensionFromQuestion ||
      defaultDimension,
    limit: clampLimit(plan?.limit, intent === 'trend' ? 12 : 5),
    chartType:
      intent === 'top_n'
        ? 'bar'
        : intent === 'distribution'
          ? 'pie'
          : intent === 'trend'
            ? 'line'
            : null,
    title: normalizeText(plan?.title) || question,
    reason: normalizeText(plan?.reason),
  };
}

function aggregateByDimension(rows, dimension, metric) {
  const groupedValues = new Map();

  rows.forEach((row) => {
    const key = normalizeText(row[dimension]) || 'Unknown';
    const nextValue = (groupedValues.get(key) || 0) + parseNumeric(row[metric]);
    groupedValues.set(key, nextValue);
  });

  return [...groupedValues.entries()].sort((left, right) => right[1] - left[1]);
}

function buildTopNResult({ dataset, question, plan }) {
  if (!plan.metric || !plan.dimension) {
    return buildSummaryResult({ dataset, question, plan });
  }

  const chartData = aggregateByDimension(dataset.rows, plan.dimension, plan.metric)
    .slice(0, plan.limit)
    .map(([label, value]) => ({
      label: truncateLabel(label),
      value: Math.round(value),
    }));

  const leader = chartData[0];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return {
    ...buildBaseResponse(question),
    chartType: 'bar',
    chartData,
    chartConfig: {
      value: { label: plan.metric, color: COLOR_PALETTE[0] },
    },
    summary: `${leader?.label || 'The leading category'} has the highest ${plan.metric} with ${formatNumber(leader?.value || 0)} across the top ${chartData.length} ${plan.dimension.toLowerCase()} values.`,
    metrics: [
      { label: 'Metric', value: plan.metric, trend: 'neutral' },
      { label: 'Leader', value: leader?.label || '-', trend: 'up' },
      { label: 'Visible Total', value: formatNumber(total), trend: 'neutral' },
    ],
  };
}

function buildDistributionResult({ dataset, question, plan }) {
  if (!plan.metric || !plan.dimension) {
    return buildSummaryResult({ dataset, question, plan });
  }

  const segments = aggregateByDimension(dataset.rows, plan.dimension, plan.metric)
    .slice(0, plan.limit)
    .map(([label, value], index) => ({
      label: truncateLabel(label),
      value: Math.round(value),
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const leader = segments[0];
  const share = total > 0 ? (((leader?.value || 0) / total) * 100).toFixed(1) : '0.0';

  return {
    ...buildBaseResponse(question),
    chartType: 'pie',
    chartData: segments,
    chartConfig: Object.fromEntries(
      segments.map((segment) => [segment.label, { label: segment.label, color: segment.color }])
    ),
    summary: `${leader?.label || 'The leading segment'} accounts for ${share}% of the visible ${plan.metric} distribution.`,
    metrics: [
      { label: 'Metric', value: plan.metric, trend: 'neutral' },
      { label: 'Segments', value: String(segments.length), trend: 'neutral' },
      { label: 'Largest Share', value: leader?.label || '-', trend: 'up' },
    ],
  };
}

function buildTrendResult({ dataset, question, plan }) {
  if (!plan.metric) {
    return buildNoNumericResponse(question);
  }

  let chartData;

  if (plan.dimension) {
    chartData = aggregateByDimension(dataset.rows, plan.dimension, plan.metric)
      .slice(0, plan.limit)
      .reverse()
      .map(([label, value]) => ({
        label: truncateLabel(label),
        value: Math.round(value),
      }));
  } else {
    chartData = dataset.rows.slice(0, plan.limit).map((row, index) => ({
      label: `#${index + 1}`,
      value: Math.round(parseNumeric(row[plan.metric])),
    }));
  }

  const values = chartData.map((item) => item.value);
  const firstValue = values[0] || 0;
  const lastValue = values[values.length - 1] || 0;
  const changePercent =
    firstValue === 0 ? 0 : ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

  return {
    ...buildBaseResponse(question),
    chartType: 'line',
    chartData,
    chartConfig: {
      value: { label: plan.metric, color: COLOR_PALETTE[0] },
    },
    summary: `${plan.metric} moved from ${formatNumber(firstValue)} to ${formatNumber(lastValue)}, a ${changePercent >= 0 ? 'positive' : 'negative'} ${changePercent.toFixed(1)}% change across the visible points.`,
    metrics: [
      {
        label: 'Change',
        value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
        trend: changePercent >= 0 ? 'up' : 'down',
      },
      { label: 'Metric', value: plan.metric, trend: 'neutral' },
      { label: 'Points', value: String(chartData.length), trend: 'neutral' },
    ],
  };
}

function buildSummaryResult({ dataset, question, plan }) {
  if (!plan.metric) {
    return buildNoNumericResponse(question);
  }

  const values = dataset.rows.map((row) => parseNumeric(row[plan.metric]));
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length === 0 ? 0 : total / values.length;
  const maximum = values.length === 0 ? 0 : Math.max(...values);

  return {
    ...buildBaseResponse(question),
    chartType: null,
    summary: `${plan.metric} totals ${formatNumber(Math.round(total))}, averages ${formatNumber(Math.round(average))}, and peaks at ${formatNumber(Math.round(maximum))} in the current dataset.`,
    metrics: [
      { label: 'Metric', value: plan.metric, trend: 'neutral' },
      { label: 'Total', value: formatNumber(Math.round(total)), trend: 'neutral' },
      { label: 'Average', value: formatNumber(Math.round(average)), trend: 'neutral' },
    ],
  };
}

function executeQueryPlan({ dataset, question, plan }) {
  const numericColumns = dataset.headers.filter((header) => header.type === 'number');

  if (numericColumns.length === 0) {
    return buildNoNumericResponse(question);
  }

  const resolvedPlan = resolvePlan({ dataset, question, plan });

  switch (resolvedPlan.intent) {
    case 'top_n':
      return buildTopNResult({ dataset, question, plan: resolvedPlan });
    case 'distribution':
      return buildDistributionResult({ dataset, question, plan: resolvedPlan });
    case 'trend':
      return buildTrendResult({ dataset, question, plan: resolvedPlan });
    default:
      return buildSummaryResult({ dataset, question, plan: resolvedPlan });
  }
}

module.exports = {
  executeQueryPlan,
  formatNumber,
  parseNumeric,
  truncateLabel,
};
