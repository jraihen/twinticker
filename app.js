import { assets, comparison, formatPercent, formatPrice, ranges } from './core.js';

const saved = JSON.parse(localStorage.getItem('twinticker-pair') || '{}');
const state = {
  assetA: assets.find((asset) => asset.symbol === saved.a) || assets[0],
  assetB: assets.find((asset) => asset.symbol === saved.b) || assets[1],
  range: saved.range || '1M',
  picker: null,
  data: null,
  loading: false,
  error: null,
  request: null
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
  const labels = state.range === '1D'
    ? [data.timestamps[0].slice(11, 16), data.timestamps.at(-1).slice(11, 16)]
    : [data.timestamps[0], data.timestamps[Math.floor(data.timestamps.length / 2)], data.timestamps.at(-1)].map((time) => time.slice(5, 10).replace('-', '/'));
  return `<svg viewBox="0 0 748 280" role="img" aria-label="${state.assetA.symbol}와 ${state.assetB.symbol}의 정규화 수익률 차트" preserveAspectRatio="none">
    <g class="chart-grid">${grid}</g>
    <path class="line line-a" d="${linePath(data.seriesA, bounds)}" />
    <path class="line line-b" d="${linePath(data.seriesB, bounds)}" />
    <g class="chart-axis">${labels.map((label, index) => `<text x="${12 + index * (676 / (labels.length - 1))}" y="267" text-anchor="${index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}">${label}</text>`).join('')}</g>
  </svg>`;
}

function sourceAsset(asset) {
  return state.data?.assets.find((item) => item.symbol === asset.symbol);
}

function assetCard(asset, key) {
  const quote = sourceAsset(asset);
  return `<button class="asset-card ${key}" data-pick="${key}" aria-label="${key === 'a' ? '첫 번째' : '두 번째'} 자산 변경">
    <span class="asset-mark ${asset.tone}">${asset.symbol.slice(0, 1)}</span>
    <span class="asset-copy"><strong>${asset.symbol}</strong><small>${asset.name}</small></span>
    <span class="asset-price"><strong>${formatPrice(quote?.price, quote?.currency || asset.currency)}</strong><small class="${quote?.change >= 0 ? 'up' : 'down'}">${Number.isFinite(quote?.change) ? formatPercent(quote.change) : '—'}</small></span>
    <span class="chevron">⌄</span>
  </button>`;
}

function metric(label, aValue, bValue, type = 'percent', currency = 'USD') {
  const display = (value) => type === 'price' ? formatPrice(value, currency) : type === 'percent' ? formatPercent(value) : `${value.toFixed(1)}%`;
  return `<article class="metric"><p>${label}</p><div><span class="metric-a">${display(aValue)}</span><span>${display(bValue)}</span></div><small><i class="dot a-dot"></i>${state.assetA.symbol}<i class="dot b-dot"></i>${state.assetB.symbol}</small></article>`;
}

function setDataNote() {
  if (state.loading) $('#data-note').textContent = '토스증권 시세를 불러오는 중…';
  else if (state.error) $('#data-note').textContent = state.error;
  else if (state.data) $('#data-note').textContent = `마지막 업데이트 ${new Date(state.data.fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
}

function render() {
  $('#asset-pair').innerHTML = assetCard(state.assetA, 'a') + '<span class="versus">vs</span>' + assetCard(state.assetB, 'b');
  $('#range-tabs').innerHTML = Object.entries(ranges).map(([key, item]) => `<button class="range ${state.range === key ? 'selected' : ''}" data-range="${key}" ${state.loading ? 'disabled' : ''}>${item.label}</button>`).join('');
  setDataNote();
  if (!state.data) {
    $('#chart').innerHTML = `<p class="chart-empty">${state.loading ? '실제 시세를 불러오는 중입니다…' : state.error || '표시할 시세가 없습니다.'}</p>`;
    $('#chart-summary').innerHTML = '';
    $('#insight').innerHTML = '';
    $('#metrics').innerHTML = '';
    return;
  }
  const quoteA = sourceAsset(state.assetA);
  const quoteB = sourceAsset(state.assetB);
  let data;
  try {
    data = comparison(quoteA.points, quoteB.points);
  } catch (error) {
    state.error = error.message;
    state.data = null;
    render();
    return;
  }
  $('#chart').innerHTML = chart(data);
  $('#chart-summary').innerHTML = `<span><i class="dot a-dot"></i>${state.assetA.symbol} <b class="${data.returnA >= 0 ? 'up' : 'down'}">${formatPercent(data.returnA)}</b></span><span><i class="dot b-dot"></i>${state.assetB.symbol} <b class="${data.returnB >= 0 ? 'up' : 'down'}">${formatPercent(data.returnB)}</b></span>`;
  const leader = data.spread >= 0 ? state.assetA : state.assetB;
  $('#insight').innerHTML = `<span class="insight-icon">↗</span><div><strong>${leader.symbol}가 ${Math.abs(data.spread).toFixed(2)}%p 앞서고 있어요</strong><p>${ranges[state.range].label} 기준 실제 토스증권 시세를 정규화한 결과입니다.</p></div>`;
  $('#metrics').innerHTML = metric('기간 수익률', data.returnA, data.returnB) + metric('연환산 변동성', data.volatilityA, data.volatilityB, 'number') + metric('기간 최고점', data.highA, data.highB, 'price', quoteA.currency) + `<article class="metric spread"><p>성과 격차</p><strong class="${data.spread >= 0 ? 'up' : 'down'}">${formatPercent(data.spread)}p</strong><small>${leader.symbol} 기준 우위</small></article>`;
  persist();
}

async function loadMarketData() {
  state.request?.abort();
  state.request = new AbortController();
  state.loading = true;
  state.error = null;
  state.data = null;
  render();
  try {
    const query = new URLSearchParams({ symbols: `${state.assetA.symbol},${state.assetB.symbol}`, range: state.range });
    const response = await fetch(`/api/market-data?${query}`, { signal: state.request.signal });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || '시세를 불러오지 못했습니다.');
    state.data = payload;
  } catch (error) {
    if (error.name !== 'AbortError') state.error = error.message || '시세를 불러오지 못했습니다.';
  } finally {
    if (!state.request.signal.aborted) {
      state.loading = false;
      $('#market-status').innerHTML = state.data ? '<i></i>미국 시장 <b>토스증권 데이터</b><small>· 실시간 시세</small>' : '<i class="status-error"></i>시세 연결 <b>오류</b>';
      render();
    }
  }
}

function openPicker(target) {
  state.picker = target;
  $('#picker-title').textContent = target === 'a' ? '비교할 첫 번째 자산' : '비교할 두 번째 자산';
  $('#asset-options').innerHTML = assets.map((asset) => `<button data-symbol="${asset.symbol}" class="option ${asset.symbol === state[`asset${target.toUpperCase()}`].symbol ? 'active' : ''}"><span class="asset-mark ${asset.tone}">${asset.symbol[0]}</span><span><strong>${asset.symbol}</strong><small>${asset.name} · ${asset.market}</small></span></button>`).join('');
  $('#picker').showModal();
}

document.addEventListener('click', (event) => {
  const picker = event.target.closest('[data-pick]');
  const range = event.target.closest('[data-range]');
  const option = event.target.closest('[data-symbol]');
  if (picker) openPicker(picker.dataset.pick);
  if (range) { state.range = range.dataset.range; loadMarketData(); }
  if (option) {
    const asset = assets.find((item) => item.symbol === option.dataset.symbol);
    if (asset && asset.symbol !== state[`asset${state.picker.toUpperCase()}`].symbol) {
      state[`asset${state.picker.toUpperCase()}`] = asset;
      if (state.assetA.symbol === state.assetB.symbol) state.assetB = assets.find((item) => item.symbol !== state.assetA.symbol);
      loadMarketData();
    }
    $('#picker').close();
  }
});

$('#picker-close').addEventListener('click', () => $('#picker').close());

const settingsApi = window.twintickerSettings;

async function openSettings() {
  if (!settingsApi) {
    $('#settings-status').textContent = '이 설정은 TwinTicker 데스크톱 앱에서만 사용할 수 있습니다.';
    $('#settings-form').querySelectorAll('input, button').forEach((element) => { element.disabled = true; });
    $('#settings').showModal();
    return;
  }
  try {
    const status = await settingsApi.status();
    $('#settings-status').textContent = status.configured ? '토스증권 API 키가 Windows 보안 저장소에 등록되어 있습니다. 새 값을 저장하면 교체됩니다.' : '토스증권 WTS에서 발급한 Client ID와 Client Secret을 입력하세요.';
    $('#settings-form').querySelectorAll('input, button').forEach((element) => { element.disabled = false; });
    $('#client-id').value = '';
    $('#client-secret').value = '';
  } catch (error) {
    $('#settings-status').textContent = error.message || '보안 저장소 상태를 확인하지 못했습니다.';
  }
  $('#settings').showModal();
}

$('#settings-open').addEventListener('click', openSettings);
$('#settings-close').addEventListener('click', () => $('#settings').close());
$('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!settingsApi) return;
  const submit = event.submitter;
  submit.disabled = true;
  try {
    await settingsApi.save($('#client-id').value, $('#client-secret').value);
    $('#client-secret').value = '';
    $('#settings').close();
    loadMarketData();
  } catch (error) {
    $('#settings-status').textContent = error.message || 'API 키를 저장하지 못했습니다.';
  } finally {
    submit.disabled = false;
  }
});
$('#settings-clear').addEventListener('click', async () => {
  if (!settingsApi || !confirm('Windows 보안 저장소에서 토스증권 API 키를 삭제할까요?')) return;
  try {
    await settingsApi.clear();
    $('#client-id').value = '';
    $('#client-secret').value = '';
    $('#settings-status').textContent = '저장된 API 키를 삭제했습니다.';
  } catch (error) {
    $('#settings-status').textContent = error.message || 'API 키를 삭제하지 못했습니다.';
  }
});
loadMarketData();
