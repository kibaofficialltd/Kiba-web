import fs from 'fs';

const SNAPSHOT = JSON.parse(
  fs.readFileSync(new URL('./_snapshot.json', import.meta.url), 'utf-8')
);

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res, data, status = 200, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.end(JSON.stringify(data));
}

function forwardCookies(upstreamRes, res) {
  const cookies = typeof upstreamRes.headers.getSetCookie === 'function'
    ? upstreamRes.headers.getSetCookie()
    : [];

  if (cookies.length > 0) {
    const cleaned = cookies.map((c) => c.replace(/;\s*Domain=[^;]+/gi, ''));
    res.setHeader('Set-Cookie', cleaned);
  }
}

export default async function handler(req, res) {
  const parsed = new URL(req.url || '/', 'http://localhost');
  const rewrittenPath = parsed.searchParams.get('path');
  let pathname = parsed.pathname;

  if (rewrittenPath) {
    pathname = `/api/${rewrittenPath.replace(/^\/+/, '')}`;
    parsed.searchParams.delete('path');
  }

  const remainingSearch = parsed.searchParams.toString();
  const search = remainingSearch ? `?${remainingSearch}` : '';
  const botApiUrl = (process.env.BOT_API_URL || '').trim().replace(/\/+$/, '');

  if (pathname === '/api/health') {
    return sendJson(res, { ok: true, botConfigured: Boolean(botApiUrl) });
  }

  // Proxy live requests to Termux WhatsApp Bot if BOT_API_URL is configured
  if (botApiUrl) {
    try {
      const target = `${botApiUrl}${pathname}${search}`;
      const headers = {
        'cookie': req.headers.cookie || '',
        'accept': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      };

      const makeFetchOpts = () => ({
        method: req.method || 'GET',
        headers,
        signal: AbortSignal.timeout(22000)
      });

      let rawBody = '';
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        rawBody = await readBody(req);
        if (rawBody) {
          headers['content-type'] = 'application/json';
        }
      }

      let upstream;
      try {
        const opts = makeFetchOpts();
        if (rawBody) opts.body = rawBody;
        upstream = await fetch(target, opts);
      } catch (firstErr) {
        await new Promise((r) => setTimeout(r, 400));
        const optsRetry = makeFetchOpts();
        if (rawBody) optsRetry.body = rawBody;
        upstream = await fetch(target, optsRetry);
      }
      const ct = upstream.headers.get('content-type') || '';

      if (ct.includes('application/json')) {
        const text = await upstream.text();
        forwardCookies(upstream, res);
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(text);
        return;
      }

      if (ct.startsWith('image/')) {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', upstream.headers.get('cache-control') || 'public, max-age=300');
        res.end(buf);
        return;
      }
    } catch (err) {
      console.warn('[Vercel Proxy] Upstream unreachable, using fallback:', err.message);
    }
  }

  // Fallback responses when BOT_API_URL is unset or tunnel is offline
  if (req.method === 'GET') {
    if (pathname === '/api/overview') {
      return sendJson(res, SNAPSHOT.overview);
    }
    if (pathname === '/api/leaderboards') {
      return sendJson(res, SNAPSHOT.leaderboards);
    }
    if (pathname === '/api/lottery') {
      return sendJson(res, SNAPSHOT.lottery);
    }
    if (pathname === '/api/commands') {
      return sendJson(res, SNAPSHOT.commands);
    }
    if (pathname === '/api/auth/me') {
      return sendJson(res, { authenticated: false, profile: null });
    }
  }

  if (pathname === '/api/auth/logout') {
    res.setHeader('Set-Cookie', 'bs_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return sendJson(res, { success: true });
  }

  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/profile') || pathname.startsWith('/api/cards') || pathname.startsWith('/api/ads') || pathname.startsWith('/api/admin')) {
    if (pathname === '/api/profile-media') {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    return sendJson(
      res,
      {
        success: false,
        error: botApiUrl
          ? 'WhatsApp bot is currently unreachable through BOT_API_URL. Please make sure the bot & tunnel are running.'
          : 'Live bot tunnel (BOT_API_URL) is not configured in Vercel Environment Variables yet.'
      },
      503
    );
  }

  return sendJson(res, { error: 'Not Found' }, 404);
}
