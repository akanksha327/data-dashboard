const { GEMINI_API_KEY, GEMINI_MODEL, AI_PROVIDER } = require('../config');

function parseNumeric(value) {
  const normalized = String(value || '').replace(/[$,%\s"']/g, '');
  const parsedValue = Number(normalized);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function formatNumber(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function truncateLabel(value, maxLength = 18) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function hasUsableGeminiKey() {
  const normalizedKey = String(GEMINI_API_KEY || '').trim().toLowerCase();

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

function generateHeuristicInsights(headers, rows) {
  const numericColumns = headers.filter((header) => header.type === 'number');
  const stringColumns = headers.filter((header) => header.type === 'string');
  const insights = [
    {
      id: 'dataset-overview',
      title: `Dataset contains ${rows.length.toLocaleString()} rows`,
      description: `Detected ${headers.length} columns, including ${numericColumns.length} numeric and ${stringColumns.length} text fields.`,
      trend: 'neutral',
      metric: `${headers.length} cols`,
    },
  ];

  if (numericColumns.length === 0) {
    return insights;
  }

  const primaryColumn = numericColumns[0].name;
  const values = rows
    .map((row) => parseNumeric(row[primaryColumn]))
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) {
    return insights;
  }

  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const segmentLength = Math.max(1, Math.floor(values.length * 0.3));
  const firstAverage = values.slice(0, segmentLength).reduce((sum, value) => sum + value, 0) / segmentLength;
  const lastAverage = values.slice(-segmentLength).reduce((sum, value) => sum + value, 0) / segmentLength;
  const changePercent = firstAverage === 0 ? 0 : ((lastAverage - firstAverage) / Math.abs(firstAverage)) * 100;
  const trend = changePercent >= 0 ? 'up' : 'down';

  insights.push({
    id: 'primary-trend',
    title: `${primaryColumn} trend is ${trend === 'up' ? 'upward' : 'downward'}`,
    description: `${primaryColumn} moved from an average of ${formatNumber(Math.round(firstAverage))} in the first segment to ${formatNumber(Math.round(lastAverage))} in the last segment.`,
    trend,
    metric: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
  });

  insights.push({
    id: 'primary-range',
    title: `${primaryColumn} spans ${formatNumber(Math.round(minValue))} to ${formatNumber(Math.round(maxValue))}`,
    description: `Average ${primaryColumn} is ${formatNumber(Math.round(averageValue))}. This gives the dashboard enough signal for charts and comparison views.`,
    trend: 'neutral',
    metric: `avg ${formatNumber(Math.round(averageValue))}`,
  });

  if (numericColumns.length > 1) {
    insights.push({
      id: 'multi-metric',
      title: `Multiple metrics detected`,
      description: `Found ${numericColumns.length} numeric columns, so the frontend can render side-by-side comparisons and trend charts.`,
      trend: 'neutral',
      metric: `${numericColumns.length} metrics`,
    });
  }

  return insights;
}

async function generateAIInsights(headers, rows) {
  if (!hasUsableGeminiKey()) {
    return generateHeuristicInsights(headers, rows);
  }

  try {
    const numericColumns = headers.filter((header) => header.type === 'number');
    const stringColumns = headers.filter((header) => header.type === 'string');

    if (numericColumns.length === 0 || rows.length === 0) {
      return generateHeuristicInsights(headers, rows);
    }

    const dataPreview = rows
      .slice(0, 10)
      .map((row) => {
        const preview = {};
        headers.forEach((header) => {
          preview[header.name] = row[header.name];
        });
        return preview;
      });

    const prompt = `You are a strict AI data assistant.

OUTPUT FORMAT RULES:
- Only final result
- Max 1 sentence
- No explanation
- No reasoning
- No extra text
- No markdown

If list → return comma separated values
If number → return only number

EXAMPLES:
Top names: Aman (23), Rahul (22), Priya (21)
Average age: 22

TASK:
Analyze this dataset and provide 2-3 key insights. Be specific and actionable.

Columns: ${headers.map((h) => `${h.name} (${h.type})`).join(', ')}
Total rows: ${rows.length}
Sample data (first 10 rows):
${JSON.stringify(dataPreview, null, 2)}

Return answer:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Parse the concise response into insights format
    const lines = text.split('\n').filter(line => line.trim());
    const insights = lines.slice(0, 3).map((line, index) => ({
      id: `ai-insight-${index + 1}`,
      title: line.length > 50 ? line.substring(0, 50) + '...' : line,
      description: line,
      trend: 'neutral',
      metric: `${index + 1}`,
    }));

    return insights.length > 0 ? insights : generateHeuristicInsights(headers, rows);
  } catch (error) {
    console.warn('AI insights generation failed, using heuristics:', error.message);
    return generateHeuristicInsights(headers, rows);
  }
}

function generateInsights(headers, rows) {
  // Use heuristic insights synchronously - AI should be handled separately
  return generateHeuristicInsights(headers, rows);
}

function generateCharts(headers, rows) {
  const numericColumns = headers.filter((header) => header.type === 'number');
  const stringColumns = headers.filter((header) => header.type === 'string');
  const labelColumn = stringColumns[0]?.name || null;

  if (numericColumns.length === 0) {
    return {
      barData: [],
      lineData: [],
      pieData: [],
    };
  }

  const sampleBarRows = rows.slice(0, 12);
  const sampleLineRows = rows.slice(0, 20);
  const pieColors = ['#505081', '#6B6BA8', '#8F8FC1', '#CFCFF0', '#3F3F66', '#7A7ACF'];

  const barData = sampleBarRows.map((row, index) => {
    const entry = {
      label: labelColumn ? truncateLabel(row[labelColumn] || `#${index + 1}`, 16) : `#${index + 1}`,
    };

    numericColumns.slice(0, 2).forEach((column) => {
      entry[column.name] = parseNumeric(row[column.name]);
    });

    return entry;
  });

  const lineData = sampleLineRows.map((row, index) => {
    const entry = {
      label: labelColumn ? truncateLabel(row[labelColumn] || `#${index + 1}`, 16) : `#${index + 1}`,
    };

    numericColumns.slice(0, 3).forEach((column) => {
      entry[column.name] = parseNumeric(row[column.name]);
    });

    return entry;
  });

  const pieData = [];
  if (labelColumn) {
    const groupedValues = {};

    rows.forEach((row) => {
      const key = row[labelColumn] || 'Unknown';
      const currentValue = parseNumeric(row[numericColumns[0].name]);
      groupedValues[key] = (groupedValues[key] || 0) + currentValue;
    });

    Object.entries(groupedValues)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .forEach(([name, value], index) => {
        pieData.push({
          name: truncateLabel(name, 16),
          value: Math.round(value),
          color: pieColors[index % pieColors.length],
        });
      });
  }

  return {
    barData,
    lineData,
    pieData,
  };
}

function buildDatasetSnapshot(parsedUpload) {
  return {
    uploadedFile: parsedUpload.uploadedFile,
    headers: parsedUpload.headers,
    rows: parsedUpload.rows,
    charts: generateCharts(parsedUpload.headers, parsedUpload.rows),
    insights: generateInsights(parsedUpload.headers, parsedUpload.rows),
  };
}

module.exports = {
  buildDatasetSnapshot,
  formatNumber,
  generateAIInsights,
  generateCharts,
  generateHeuristicInsights,
  generateInsights,
  parseNumeric,
  truncateLabel,
};
