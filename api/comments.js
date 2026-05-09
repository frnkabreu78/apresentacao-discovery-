const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join('/tmp', 'comments.json');

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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
}

loadComments();

module.exports = (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
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
