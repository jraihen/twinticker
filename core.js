export const assets = [
  { symbol: 'SPY', name: 'S&P 500 ETF', market: 'NYSE Arca', currency: 'USD', tone: 'blue' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', market: 'NASDAQ', currency: 'USD', tone: 'violet' },
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', currency: 'USD', tone: 'orange' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'NASDAQ', currency: 'USD', tone: 'green' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'NASDAQ', currency: 'USD', tone: 'sky' },
  { symbol: 'IWM', name: 'Russell 2000 ETF', market: 'NYSE Arca', currency: 'USD', tone: 'pink' }
];

export const ranges = {
  '1D': { label: '1일', points: 390, interval: '1m' },
  '1W': { label: '1주', points: 6, interval: '1d' },
  '1M': { label: '1개월', points: 22, interval: '1d' },
  '1Y': { label: '1년', points: 252, interval: '1d' }
};

function normalize(points) {
  const start = points[0].close;
  return points.map((point) => Number(((point.close / start) * 100).toFixed(2)));
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

export function alignSeries(pointsA, pointsB) {
  const byTimestampB = new Map(pointsB.map((point) => [point.timestamp, point]));
  const alignedA = [];
  const alignedB = [];
  for (const pointA of pointsA) {
    const pointB = byTimestampB.get(pointA.timestamp);
    if (pointB) {
      alignedA.push(pointA);
      alignedB.push(pointB);
    }
  }
  return { pointsA: alignedA, pointsB: alignedB };
}

export function comparison(pointsA, pointsB) {
  const aligned = alignSeries(pointsA, pointsB);
  if (aligned.pointsA.length < 2) throw new Error('비교할 수 있는 공통 시세 데이터가 부족합니다.');
  const closesA = aligned.pointsA.map((point) => point.close);
  const closesB = aligned.pointsB.map((point) => point.close);
  const returnA = percentChange(closesA);
  const returnB = percentChange(closesB);
  return {
    timestamps: aligned.pointsA.map((point) => point.timestamp),
    seriesA: normalize(aligned.pointsA),
    seriesB: normalize(aligned.pointsB),
    returnA,
    returnB,
    spread: returnA - returnB,
    volatilityA: volatility(closesA),
    volatilityB: volatility(closesB),
    highA: Math.max(...closesA),
    highB: Math.max(...closesB)
  };
}

export function formatPercent(value, digits = 2) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%`;
}

export function formatPrice(value, currency = 'USD') {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}
