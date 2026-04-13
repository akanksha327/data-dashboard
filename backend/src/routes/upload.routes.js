const express = require('express');
const multer = require('multer');
const { parseCsvUpload } = require('../services/csv.service');
const { buildDatasetSnapshot } = require('../services/analytics.service');
const { saveDataset } = require('../store/dataset-store');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Upload a CSV file using the "file" field.' });
      return;
    }

    const parsedUpload = parseCsvUpload(req.file);
    const dataset = buildDatasetSnapshot(parsedUpload);
    const savedDataset = await saveDataset(dataset);

    res.status(201).json({
      datasetId: savedDataset.id,
      uploadedFile: savedDataset.uploadedFile,
      headers: savedDataset.headers,
      charts: savedDataset.charts,
      insights: savedDataset.insights,
      message: 'File uploaded and processed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
