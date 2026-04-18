const express = require('express');
const { query } = require('../../db');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/ping', asyncHandler(async (_req, res) => {
  const result = await query('SELECT NOW() AS now');
  res.json({ now: result.rows[0]?.now });
}));

module.exports = router;
