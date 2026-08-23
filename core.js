export const assets = [
  { symbol: 'SPY', name: 'S&P 500 ETF', market: 'NYSE Arca', currency: 'USD', price: 563.18, change: 0.84, tone: 'blue' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', market: 'NASDAQ', currency: 'USD', price: 482.31, change: 1.21, tone: 'violet' },
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', currency: 'USD', price: 228.87, change: -0.36, tone: 'orange' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ', currency: 'USD', price: 118.42, change: 2.17, tone: 'green' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'NASDAQ', currency: 'USD', price: 416.79, change: 0.62, tone: 'sky' },
  { symbol: 'IWM', name: 'Russell 2000 ETF', market: 'NYSE Arca', currency: 'USD', price: 203.44, change: -0.74, tone: 'pink' }
];

export const ranges = {
  '1D': { label: '1일', points: 25, noise: 0.7, drift: 0.12 },
  '1W': { label: '1주', points: 35, noise: 1.2, drift: 0.22 },
  '1M': { label: '1개월', points: 42, noise: 1.9, drift: 0.32 },
  '1Y': { label: '1년', points: 52, noise: 3.6, drift: 0.5 }
};

function hash(value) {
  return [...value].reduce((result, char) => ((result * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
}

function random(seed) {
  const next = Math.sin(seed) * 10000;
  return next - Math.floor(next);
}

export function makeSeries(symbol, range) {
  const config = ranges[range];
  const seed = hash(`${symbol}-${range}`);
  const bias = (hash(symbol) % 9 - 4) * 0.09;
  let value = 100;
  return Array.from({ length: config.points }, (_, index) => {
    const wiggle = (random(seed + index * 1.7) - 0.48) * config.noise;
    const wave = Math.sin(index * 0.53 + (seed % 10)) * config.noise * 0.35;
    value = Math.max(82, value + config.drift + bias + wiggle + wave);
    return Number(value.toFixed(2));
  });
}

export function percentChange(series) {
  if (!series?.length || series[0] === 0) return 0;
  return ((series.at(-1) - series[0]) / series[0]) * 100;
}

export function volatility(series) {
  if (!series || series.length < 2) return 0;
  const returns = series.slice(1).map((value, index) => (value - series[index]) / series[index]);
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + ((value - average) ** 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function comparison(assetA, assetB, range) {
  const seriesA = makeSeries(assetA.symbol, range);
  const seriesB = makeSeries(assetB.symbol, range);
  const returnA = percentChange(seriesA);
  const returnB = percentChange(seriesB);
  return {
    seriesA,
    seriesB,
    returnA,
    returnB,
    spread: returnA - returnB,
    volatilityA: volatility(seriesA),
    volatilityB: volatility(seriesB),
    highA: Math.max(...seriesA),
    highB: Math.max(...seriesB)
  };
}

export function formatPercent(value, digits = 2) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%`;
}

export function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
