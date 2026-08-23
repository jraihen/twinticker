import { assets, comparison, formatPercent, formatPrice, ranges } from './core.js';

const saved = JSON.parse(localStorage.getItem('twinticker-pair') || '{}');
const state = {
  assetA: assets.find((asset) => asset.symbol === saved.a) || assets[0],
  assetB: assets.find((asset) => asset.symbol === saved.b) || assets[1],
  range: saved.range || '1M',
  picker: null
};

const $ = (selector) => document.querySelector(selector);

function persist() {
  localStorage.setItem('twinticker-pair', JSON.stringify({ a: state.assetA.symbol, b: state.assetB.symbol, range: state.range }));
}

function linePath(values, bounds) {
  return values.map((value, index) => {
    const x = bounds.left + (index / (values.length - 1)) * bounds.width;
    const y = bounds.top + ((bounds.max - value) / (bounds.max - bounds.min)) * bounds.height;
    return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function chart(data) {
  const all = [...data.seriesA, ...data.seriesB];
  const min = Math.floor(Math.min(...all) - 2);
  const max = Math.ceil(Math.max(...all) + 2);
  const bounds = { left: 12, top: 18, width: 676, height: 218, min, max };
  const grid = [0, 0.5, 1].map((point) => {
    const value = min + (max - min) * point;
    const y = bounds.top + bounds.height - point * bounds.height;
    return `<g><line x1="12" x2="688" y1="${y}" y2="${y}"/><text x="700" y="${y + 4}">${value.toFixed(0)}</text></g>`;
  }).join('');
  const ticks = state.range === '1D' ? ['개장', '11:00', '13:00', '현재'] : state.range === '1Y' ? ['작년 8월', '11월', '2월', '5월', '현재'] : ['시작', '25%', '50%', '75%', '현재'];
  return `<svg viewBox="0 0 748 280" role="img" aria-label="${state.assetA.symbol}와 ${state.assetB.symbol}의 정규화 수익률 차트" preserveAspectRatio="none">
    <g class="chart-grid">${grid}</g>
    <path class="line line-a" d="${linePath(data.seriesA, bounds)}" />
    <path class="line line-b" d="${linePath(data.seriesB, bounds)}" />
    <g class="chart-axis">${ticks.map((tick, index) => `<text x="${12 + index * (676 / (ticks.length - 1))}" y="267" text-anchor="${index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'middle'}">${tick}</text>`).join('')}</g>
  </svg>`;
}

function assetCard(asset, key) {
  return `<button class="asset-card ${key}" data-pick="${key}" aria-label="${key === 'a' ? '첫 번째' : '두 번째'} 자산 변경">
    <span class="asset-mark ${asset.tone}">${asset.symbol.slice(0, 1)}</span>
    <span class="asset-copy"><strong>${asset.symbol}</strong><small>${asset.name}</small></span>
    <span class="asset-price"><strong>${formatPrice(asset.price)}</strong><small class="${asset.change >= 0 ? 'up' : 'down'}">${formatPercent(asset.change)}</small></span>
    <span class="chevron">⌄</span>
  </button>`;
}

function metric(label, aValue, bValue, type = 'percent') {
  const display = (value) => type === 'percent' ? formatPercent(value) : `${value.toFixed(1)}%`;
  return `<article class="metric"><p>${label}</p><div><span class="metric-a">${display(aValue)}</span><span>${display(bValue)}</span></div><small><i class="dot a-dot"></i>${state.assetA.symbol}<i class="dot b-dot"></i>${state.assetB.symbol}</small></article>`;
}

function render() {
  const data = comparison(state.assetA, state.assetB, state.range);
  $('#asset-pair').innerHTML = assetCard(state.assetA, 'a') + '<span class="versus">vs</span>' + assetCard(state.assetB, 'b');
  $('#range-tabs').innerHTML = Object.entries(ranges).map(([key, item]) => `<button class="range ${state.range === key ? 'selected' : ''}" data-range="${key}">${item.label}</button>`).join('');
  $('#chart').innerHTML = chart(data);
  $('#chart-summary').innerHTML = `<span><i class="dot a-dot"></i>${state.assetA.symbol} <b class="${data.returnA >= 0 ? 'up' : 'down'}">${formatPercent(data.returnA)}</b></span><span><i class="dot b-dot"></i>${state.assetB.symbol} <b class="${data.returnB >= 0 ? 'up' : 'down'}">${formatPercent(data.returnB)}</b></span>`;
  const leader = data.spread >= 0 ? state.assetA : state.assetB;
  $('#insight').innerHTML = `<span class="insight-icon">↗</span><div><strong>${leader.symbol}가 ${Math.abs(data.spread).toFixed(2)}%p 앞서고 있어요</strong><p>${ranges[state.range].label} 기준 정규화 수익률을 비교한 결과입니다.</p></div>`;
  $('#metrics').innerHTML = metric('기간 수익률', data.returnA, data.returnB) + metric('연환산 변동성', data.volatilityA, data.volatilityB, 'number') + metric('기간 최고점', data.highA - 100, data.highB - 100) + `<article class="metric spread"><p>성과 격차</p><strong class="${data.spread >= 0 ? 'up' : 'down'}">${formatPercent(data.spread)}p</strong><small>${leader.symbol} 기준 우위</small></article>`;
  persist();
}

function openPicker(target) {
  state.picker = target;
  $('#picker-title').textContent = target === 'a' ? '비교할 첫 번째 자산' : '비교할 두 번째 자산';
  $('#asset-options').innerHTML = assets.map((asset) => `<button data-symbol="${asset.symbol}" class="option ${asset.symbol === state[`asset${target.toUpperCase()}`].symbol ? 'active' : ''}"><span class="asset-mark ${asset.tone}">${asset.symbol[0]}</span><span><strong>${asset.symbol}</strong><small>${asset.name} · ${asset.market}</small></span><b>${formatPrice(asset.price)}</b></button>`).join('');
  $('#picker').showModal();
}

document.addEventListener('click', (event) => {
  const picker = event.target.closest('[data-pick]');
  const range = event.target.closest('[data-range]');
  const option = event.target.closest('[data-symbol]');
  if (picker) openPicker(picker.dataset.pick);
  if (range) { state.range = range.dataset.range; render(); }
  if (option) {
    const asset = assets.find((item) => item.symbol === option.dataset.symbol);
    if (asset && asset.symbol !== state[`asset${state.picker.toUpperCase()}`].symbol) {
      state[`asset${state.picker.toUpperCase()}`] = asset;
      if (state.assetA.symbol === state.assetB.symbol) state.assetB = assets.find((item) => item.symbol !== state.assetA.symbol);
      render();
    }
    $('#picker').close();
  }
});

$('#picker-close').addEventListener('click', () => $('#picker').close());
render();
