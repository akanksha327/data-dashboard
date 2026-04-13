const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DATASET_DIRECTORY } = require('../config');

const datasetCache = new Map();

async function ensureDatasetDirectory() {
  await fs.mkdir(DATASET_DIRECTORY, { recursive: true });
}

function getDatasetPath(datasetId) {
  return path.join(DATASET_DIRECTORY, `${datasetId}.json`);
}

async function saveDataset(dataset) {
  await ensureDatasetDirectory();

  const id = randomUUID();
  const record = {
    ...dataset,
    id,
  };

  // Clear cache to ensure fresh data is always used
  datasetCache.clear();

  datasetCache.set(id, record);
  await fs.writeFile(getDatasetPath(id), JSON.stringify(record, null, 2), 'utf8');

  return record;
}

async function getDataset(datasetId) {
  if (datasetCache.has(datasetId)) {
    return datasetCache.get(datasetId);
  }

  try {
    const raw = await fs.readFile(getDatasetPath(datasetId), 'utf8');
    const dataset = JSON.parse(raw);
    datasetCache.set(datasetId, dataset);
    return dataset;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function getLatestDataset() {
  await ensureDatasetDirectory();

  const entries = await fs.readdir(DATASET_DIRECTORY, { withFileTypes: true });
  const datasetFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== '.gitkeep'
  );

  if (datasetFiles.length === 0) {
    return null;
  }

  const filesWithStats = await Promise.all(
    datasetFiles.map(async (entry) => {
      const fullPath = path.join(DATASET_DIRECTORY, entry.name);
      const stats = await fs.stat(fullPath);
      return {
        datasetId: path.basename(entry.name, '.json'),
        modifiedAt: stats.mtimeMs,
      };
    })
  );

  filesWithStats.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return getDataset(filesWithStats[0].datasetId);
}

module.exports = {
  getDataset,
  getLatestDataset,
  saveDataset,
};
