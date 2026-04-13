const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload.routes');
const queryRoutes = require('./routes/query.routes');
const { FRONTEND_ORIGIN } = require('./config');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.json({
      message: 'Data Dashboard backend is running',
      service: 'data-dashboard-backend',
      frontendOrigin: FRONTEND_ORIGIN,
      routes: ['/health', '/upload', '/query'],
    });
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'data-dashboard-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/upload', uploadRoutes);
  app.use('/query', queryRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
      error: err.message || 'Unexpected server error',
    });
  });

  return app;
}

module.exports = { createApp };
