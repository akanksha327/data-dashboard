const {
  formatNumber,
  parseNumeric,
  truncateLabel,
} = require('./analytics.service');
const { generateNarrative } = require('./ai.service');

function createAggregate(rows, numericColumn, groupColumn, limit = 8) {
  const grouped = {};

  rows.forEach((row) => {
    const key = (row[groupColumn] || 'Unknown').trim() || 'Unknown';
    grouped[key] = (grouped[key] || 0) + parseNumeric(row[numericColumn]);
  });

  return Object.entries(grouped)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, value]) => ({
      label: truncateLabel(label, 20),
      value: Math.round(value),
    }));
}

function buildDeterministicQueryResult(question, dataset) {
  const lowercaseQuestion = question.toLowerCase();
  const numericColumns = dataset.headers.filter((header) => header.type === 'number');
  const stringColumns = dataset.headers.filter((header) => header.type === 'string');
  const labelColumn = stringColumns[0]?.name;
  const primaryMetric = numericColumns[0]?.name;

  if (!primaryMetric) {
    return {
      id: Date.now().toString(),
      question,
      chartType: null,
      summary: `The dataset does not contain numeric columns yet, so the backend cannot build charts or metrics for "${question}".`,
      timestamp: new Date().toLocaleTimeString(),
      metrics: [],
    };
  }

  if (
    labelColumn &&
    (lowercaseQuestion.includes('top') ||
      lowercaseQuestion.includes('best') ||
      lowercaseQuestion.includes('highest') ||
      lowercaseQuestion.includes('rank'))
  ) {
    const chartData = createAggregate(dataset.rows, primaryMetric, labelColumn);
    const leader = chartData[0];
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return {
      id: Date.now().toString(),
      question,
      chartType: 'bar',
      chartData,
      chartConfig: {
        value: { label: primaryMetric, color: '#6D28D9' },
      },
      summary: `${leader?.label || 'The first category'} leads ${primaryMetric} with ${formatNumber(leader?.value || 0)} out of ${formatNumber(total)} across the top categories.`,
      metrics: [
        { label: 'Leader', value: leader?.label || '-', trend: 'up' },
        { label: 'Total', value: formatNumber(total), trend: 'neutral' },
        { label: 'Groups', value: String(chartData.length), trend: 'neutral' },
      ],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if (
    lowercaseQuestion.includes('trend') ||
    lowercaseQuestion.includes('growth') ||
    lowercaseQuestion.includes('over time') ||
    lowercaseQuestion.includes('change')
  ) {
    const values = dataset.rows.map((row) => parseNumeric(row[primaryMetric]));
    const sampleData = dataset.rows.slice(0, 20).map((row, index) => ({
      label: labelColumn ? truncateLabel(row[labelColumn] || `#${index + 1}`, 16) : `#${index + 1}`,
      value: parseNumeric(row[primaryMetric]),
    }));
    const third = Math.max(1, Math.floor(values.length / 3));
    const firstAverage = values.slice(0, third).reduce((sum, value) => sum + value, 0) / third;
    const lastAverage = values.slice(-third).reduce((sum, value) => sum + value, 0) / third;
    const changePercent = firstAverage === 0 ? 0 : ((lastAverage - firstAverage) / Math.abs(firstAverage)) * 100;

    return {
      id: Date.now().toString(),
      question,
      chartType: 'line',
      chartData: sampleData,
      chartConfig: {
        value: { label: primaryMetric, color: '#6D28D9' },
      },
      summary: `${primaryMetric} moved from an average of ${formatNumber(Math.round(firstAverage))} to ${formatNumber(Math.round(lastAverage))}, a ${changePercent >= 0 ? 'positive' : 'negative'} ${changePercent.toFixed(1)}% swing.`,
      metrics: [
        { label: 'Change', value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`, trend: changePercent >= 0 ? 'up' : 'down' },
        { label: 'Rows', value: String(dataset.uploadedFile.rows), trend: 'neutral' },
        { label: 'Metric', value: primaryMetric, trend: 'neutral' },
      ],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  if (labelColumn && (lowercaseQuestion.includes('distribution') || lowercaseQuestion.includes('share') || lowercaseQuestion.includes('breakdown'))) {
    const segments = createAggregate(dataset.rows, primaryMetric, labelColumn, 6).map((entry, index) => ({
      ...entry,
      color: ['#505081', '#6B6BA8', '#8F8FC1', '#CFCFF0', '#3F3F66', '#7A7ACF'][index % 6],
    }));
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    return {
      id: Date.now().toString(),
      question,
      chartType: 'pie',
      chartData: segments,
      chartConfig: Object.fromEntries(
        segments.map((segment) => [segment.label, { label: segment.label, color: segment.color }])
      ),
      summary: `${segments[0]?.label || 'The leading segment'} represents the biggest share of ${primaryMetric}, accounting for ${total > 0 ? ((segments[0]?.value || 0) / total * 100).toFixed(1) : '0.0'}% of the visible total.`,
      metrics: [
        { label: 'Segments', value: String(segments.length), trend: 'neutral' },
        { label: 'Total', value: formatNumber(total), trend: 'neutral' },
        { label: 'Largest', value: segments[0]?.label || '-', trend: 'up' },
      ],
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const values = dataset.rows.map((row) => parseNumeric(row[primaryMetric]));
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = values.length === 0 ? 0 : total / values.length;
  const maximum = values.length === 0 ? 0 : Math.max(...values);

  return {
    id: Date.now().toString(),
    question,
    chartType: null,
    summary: `${primaryMetric} averages ${formatNumber(Math.round(average))} across ${dataset.uploadedFile.rows} rows, with a maximum of ${formatNumber(maximum)} and a total of ${formatNumber(total)}.`,
    metrics: [
      { label: 'Average', value: formatNumber(Math.round(average)), trend: 'neutral' },
      { label: 'Maximum', value: formatNumber(maximum), trend: 'up' },
      { label: 'Total', value: formatNumber(total), trend: 'neutral' },
    ],
    timestamp: new Date().toLocaleTimeString(),
  };
}

async function runDatasetQuery({ dataset, question }) {
  const deterministicResult = buildDeterministicQueryResult(question, dataset);
  const narrative = await generateNarrative({
    question,
    dataset,
    deterministicSummary: deterministicResult.summary,
  });

  return {
    ...deterministicResult,
    summary: narrative.narrative,
    provider: narrative.provider,
    usedAi: narrative.usedAi,
    aiStatus: narrative.aiStatus,
  };
}

module.exports = {
  runDatasetQuery,
};
