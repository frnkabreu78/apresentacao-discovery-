import crypto from 'crypto';

const CORRECT_PASSWORD = process.env.AUTH_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!CORRECT_PASSWORD || !JWT_SECRET) {
  throw new Error('❌ ENV: AUTH_PASSWORD e JWT_SECRET são obrigatórios');
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 8 * 3600; // 8 horas de expiração

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iss: 'pres-auth', iat: now, exp: exp };

  const headerEncoded = base64url(JSON.stringify(header));
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signature = base64url(
    crypto.createHmac('sha256', JWT_SECRET).update(`${headerEncoded}.${payloadEncoded}`).digest()
  );

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export default (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

      if (isValid) {
        res.status(200).json({
          ok: true,
          token: generateJWT(),
        });
      } else {
        res.status(401).json({
          ok: false,
          error: 'Senha incorreta',
        });
      }
    } catch (err) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  });
};
