const MarketSnapshot = require('../models/MarketSnapshot');

// Live market indicators via Yahoo Finance's public chart endpoint (keyless).
// Each entry maps a Yahoo symbol to how we label and format it.
const SYMBOLS = [
  { label: 'Nifty 50', symbol: '^NSEI', fmt: (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
  { label: 'Sensex', symbol: '^BSESN', fmt: (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
  { label: 'USD / INR', symbol: 'INR=X', fmt: (n) => n.toFixed(2) },
  { label: 'Gold ($/oz)', symbol: 'GC=F', fmt: (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
  { label: 'Crude ($/bbl)', symbol: 'CL=F', fmt: (n) => '$' + n.toFixed(2) },
];

const pctChange = (price, prev) => {
  if (!prev) return '';
  const p = ((price - prev) / prev) * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
};

async function fetchOne({ label, symbol, fmt }) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DATAD/1.0)' } });
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error(`No price for ${symbol}`);
  return { label, value: fmt(meta.regularMarketPrice), change: pctChange(meta.regularMarketPrice, meta.chartPreviousClose) };
}

// Pull all indicators and replace the stored snapshot. Partial success is fine —
// whatever we get is written; a total failure leaves the previous snapshot intact.
async function refreshMarket() {
  const results = await Promise.allSettled(SYMBOLS.map(fetchOne));
  const indicators = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) failed.forEach((f) => console.error('Market fetch failed:', f.reason?.message));
  if (indicators.length) {
    await MarketSnapshot.deleteMany({});
    await MarketSnapshot.create({ indicators });
  }
  console.log(`Market refresh: ${indicators.length}/${SYMBOLS.length} indicators live`);
  return { live: indicators.length };
}

function startMarketRefresh(intervalMinutes = 15) {
  refreshMarket().catch((err) => console.error('Initial market refresh failed:', err.message));
  setInterval(() => {
    refreshMarket().catch((err) => console.error('Scheduled market refresh failed:', err.message));
  }, intervalMinutes * 60 * 1000);
}

module.exports = { refreshMarket, startMarketRefresh };
