import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const DB_FILE = path.join('/tmp', 'comments.json');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('❌ ENV: JWT_SECRET é obrigatório');
}

let commentsDb = {};

function loadComments() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      commentsDb = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading comments:', err);
    commentsDb = {};
  }
}

function saveComments() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(commentsDb, null, 2));
  } catch (err) {
    console.error('Error saving comments:', err);
  }
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString('utf-8');
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar assinatura
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signatureB64 !== expectedSignature) return null;

    // Decodificar payload e checar expiração
    const payload = JSON.parse(base64urlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

loadComments();

export default (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Validar token JWT
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const payload = verifyJWT(token);

  if (!payload) {
    res.status(401).json({ error: 'Não autorizado - token inválido ou expirado' });
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const commentId = url.searchParams.get('id') || req.query?.id;
  const slideId = String(url.searchParams.get('slide') || req.query?.slide || '0');

  // GET /api/comments?slide=X
  if (req.method === 'GET') {
    const comments = commentsDb[slideId] || [];
    res.status(200).json(comments);
    return;
  }

  // POST /api/comments
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const author = (data.author || 'Anônimo').trim();
        const text = (data.text || '').trim();
        const slide = String(data.slide || '0');

        if (!text) {
          res.status(400).json({ error: 'Texto vazio' });
          return;
        }

        const comment = {
          id: uuidv4(),
          author: author || 'Anônimo',
          text,
          timestamp: new Date().toISOString(),
        };

        if (!commentsDb[slide]) {
          commentsDb[slide] = [];
        }

        commentsDb[slide].push(comment);
        saveComments();

        res.status(200).json({
          ok: true,
          comment,
        });
      } catch (err) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }

  // DELETE /api/comments/{id}
  if (req.method === 'DELETE') {
    for (const slideComments of Object.values(commentsDb)) {
      const idx = slideComments.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        slideComments.splice(idx, 1);
        saveComments();
        res.status(200).json({ ok: true });
        return;
      }
    }
    res.status(404).json({ error: 'Comentário não encontrado' });
    return;
  }

  // PUT /api/comments/{id}
  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const newText = (data.text || '').trim();

        if (!newText) {
          res.status(400).json({ error: 'Texto vazio' });
          return;
        }

        for (const slideComments of Object.values(commentsDb)) {
          const comment = slideComments.find(c => c.id === commentId);
          if (comment) {
            comment.text = newText;
            saveComments();
            res.status(200).json({ ok: true, comment });
            return;
          }
        }

        res.status(404).json({ error: 'Comentário não encontrado' });
      } catch (err) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
