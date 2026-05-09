const fs = require('fs');
const path = require('path');

const CORRECT_PASSWORD = process.env.AUTH_PASSWORD || 'lending2026';

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const password = (data.password || '').trim();
      const isValid = password === CORRECT_PASSWORD.trim();

      res.status(200).json({
        ok: isValid,
        token: isValid ? 'vercel-token' : null,
      });
    } catch (err) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  });
};
