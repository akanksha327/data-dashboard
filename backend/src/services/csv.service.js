function parseCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (inQuotes) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === delimiter) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function normalizeText(text) {
  return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getDelimiter(headerLine) {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

function detectColumnTypes(headers, rows) {
  return headers.map((header) => {
    const sampleRows = rows.slice(0, 30);
    const numericMatches = sampleRows.filter((row) => {
      const value = (row[header] || '').replace(/[$,%\s"']/g, '');
      return value !== '' && !Number.isNaN(Number(value));
    }).length;

    return {
      name: header,
      type: sampleRows.length > 0 && numericMatches / sampleRows.length > 0.5 ? 'number' : 'string',
      sample: sampleRows[0]?.[header] || '',
    };
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseCsvUpload(file) {
  const text = normalizeText(file.buffer.toString('utf8'));
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    const error = new Error('The uploaded file needs a header row and at least one data row.');
    error.statusCode = 400;
    throw error;
  }

  const delimiter = getDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header, index) => {
    const trimmedHeader = header.trim();
    return trimmedHeader || `Column ${index + 1}`;
  });

  const rows = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = parseCsvLine(lines[rowIndex], delimiter);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] !== undefined ? values[headerIndex] : '';
    });

    const hasData = Object.values(row).some((value) => value.trim() !== '');
    if (hasData) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    const error = new Error('No data rows were found in the uploaded file.');
    error.statusCode = 400;
    throw error;
  }

  return {
    headers: detectColumnTypes(headers, rows),
    rows,
    uploadedFile: {
      name: file.originalname,
      size: formatFileSize(file.size),
      rows: rows.length,
      columns: headers.length,
      uploadedAt: new Date().toLocaleTimeString(),
    },
  };
}

module.exports = {
  parseCsvUpload,
};
