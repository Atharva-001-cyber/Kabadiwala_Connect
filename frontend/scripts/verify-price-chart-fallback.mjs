import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile('src/pages/collector/PriceBoardPage.tsx', 'utf8');
const start = source.indexOf('  const benchmarkBars =');
const end = source.indexOf('  const fetchHistory', start);
assert.ok(start >= 0 && end > start);
const evaluate = new Function('pricesDistrict', 'selectedDistrict', 'prices', 'historyLoading', 'historyError', 'historyData',
  source.slice(start, end) + '\nreturn { benchmarkBars, showBenchmarkChart, benchmarkMaximum };');
const prices = [{ materialCategory: 'PCB', prevailingBuyPrice: 100 }, { materialCategory: 'CABLE', prevailingBuyPrice: 50 }, { prevailingBuyPrice: NaN }];
for (const city of ['Nagpur', 'Delhi NCR', 'Bengaluru']) {
  const result = evaluate(city, city, prices, false, false, { hasSufficientData: false });
  assert.equal(result.showBenchmarkChart, true);
  assert.equal(result.benchmarkBars.length, 2);
  assert.equal(result.benchmarkMaximum, 100);
}
for (const city of ['Lucknow', 'Pune']) {
  assert.equal(evaluate(city, city, prices, false, false, { hasSufficientData: true }).showBenchmarkChart, false);
}
assert.equal(evaluate('Pune', 'Nagpur', prices, false, false, { hasSufficientData: false }).showBenchmarkChart, false);
assert.equal(evaluate('Pune', 'Pune', prices, true, false, null).showBenchmarkChart, false);
assert.equal(evaluate('Pune', 'Pune', prices, false, true, null).showBenchmarkChart, false);
assert.equal(evaluate('Pune', 'Pune', [], false, false, { hasSufficientData: false }).showBenchmarkChart, false);
console.log('PASS: three missing-history cities show benchmarks; existing history preserved; loading/error/empty/wrong-city data cannot produce fallback chart. No database writes.');
