const http = require('node:http');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { getAsset, isSea } = require('node:sea');

const TOSS_API = 'https://openapi.tossinvest.com';
const RANGE_CONFIG = {
  '1D': { points: 390, interval: '1m' },
  '1W': { points: 6, interval: '1d' },
  '1M': { points: 22, interval: '1d' },
  '1Y': { points: 252, interval: '1d' }
};
const files = {
  '/': { asset: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { asset: 'index.html', type: 'text/html; charset=utf-8' },
  '/styles.css': { asset: 'styles.css', type: 'text/css; charset=utf-8' },
  '/app.js': { asset: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/core.js': { asset: 'core.js', type: 'text/javascript; charset=utf-8' }
};
const cache = new Map();
let token = null;

function assetContent(asset) {
  return isSea() ? Buffer.from(getAsset(asset)) : readFileSync(join(__dirname, asset));
}

function resetToken() {
  token = null;
  cache.clear();
}

function cached(key, ttl, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.createdAt < ttl) return hit.value;
  const value = loader();
  cache.set(key, { createdAt: Date.now(), value });
  return value;
}

async function accessToken(getCredentials) {
  if (token && token.expiresAt > Date.now()) return token.value;
  const credentials = await getCredentials();
  if (!credentials?.clientId || !credentials?.clientSecret) {
    const error = new Error('설정에서 토스증권 API 키를 저장한 뒤 시세를 불러올 수 있습니다.');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`${TOSS_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: credentials.clientId, client_secret: credentials.clientSecret }),
    signal: AbortSignal.timeout(10000)
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || '토스증권 액세스 토큰을 발급하지 못했습니다.');
  token = { value: payload.access_token, expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 300) - 30) * 1000 };
  return token.value;
}

async function toss(path, query, getCredentials) {
  const url = new URL(`${TOSS_API}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${await accessToken(getCredentials)}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `토스증권이 ${response.status} 응답을 반환했습니다.`);
  return payload.result;
}

async function candles(symbol, range, getCredentials) {
  const config = RANGE_CONFIG[range];
  return cached(`candles:${symbol}:${range}`, 30 * 1000, async () => {
    const byTimestamp = new Map();
    let before;
    while (byTimestamp.size < config.points) {
      const page = await toss('/api/v1/candles', { symbol, interval: config.interval, count: 200, adjusted: 'true', before }, getCredentials);
      for (const candle of page.candles || []) {
        const close = Number(candle.closePrice);
        if (Number.isFinite(close)) byTimestamp.set(candle.timestamp, { timestamp: candle.timestamp, close });
      }
      if (!page.nextBefore) break;
      before = page.nextBefore;
    }
    return [...byTimestamp.values()].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-config.points);
  });
}

async function marketData(url, response, getCredentials) {
  const symbols = (url.searchParams.get('symbols') || '').split(',');
  const range = url.searchParams.get('range');
  if (symbols.length !== 2 || new Set(symbols).size !== 2 || symbols.some((symbol) => !/^[A-Za-z0-9.-]{1,20}$/.test(symbol)) || !RANGE_CONFIG[range]) {
    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({ error: '잘못된 시세 요청입니다.' }));
    return;
  }
  try {
    const [prices, histories] = await Promise.all([
      cached(`prices:${symbols.join(',')}`, 3 * 1000, () => toss('/api/v1/prices', { symbols: symbols.join(',') }, getCredentials)),
      Promise.all(symbols.map((symbol) => candles(symbol, range, getCredentials)))
    ]);
    const bySymbol = new Map(prices.map((price) => [price.symbol, price]));
    const assets = symbols.map((symbol, index) => {
      const price = bySymbol.get(symbol);
      const points = histories[index];
      if (!price || points.length < 2) throw new Error(`${symbol}의 비교 시세가 부족합니다.`);
      const lastPrice = Number(price.lastPrice);
      return { symbol, price: lastPrice, currency: price.currency, asOf: price.timestamp, change: ((lastPrice / points[0].close) - 1) * 100, points };
    });
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ source: 'Toss Securities Open API', fetchedAt: new Date().toISOString(), range, assets }));
  } catch (error) {
    console.error('Market-data request failed:', error.message);
    response.writeHead(error.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({ error: error.message || '토스증권 시세를 불러오지 못했습니다.' }));
  }
}

function createMarketServer(getCredentials) {
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/api/market-data') return marketData(url, response, getCredentials);
    const file = files[url.pathname];
    if (!file) return response.writeHead(404).end('Not found');
    response.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'no-store' });
    response.end(assetContent(file.asset));
  });
}

module.exports = { createMarketServer, resetToken };
