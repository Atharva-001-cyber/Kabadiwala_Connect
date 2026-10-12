import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const source = await readFile('src/services/api.ts', 'utf8');
const paging = await readFile('src/services/readAllPages.ts', 'utf8');
const start = source.indexOf('  getAdminKPIs: async');
const end = source.indexOf('\n  getAdminMapData:', start);
const method = source.slice(start, end).trim().replace('getAdminKPIs: async', 'export const getAdminKPIs = async').replace(/,$/, ';');
let rejectTable = '';
const tables = {
  lots: Array.from({length:1203}, () => ({material_category:'PCB',approx_weight:2,status:'PROCESSING'})),
  payments: Array.from({length:1203}, () => ({amount:10})),
  collectors: [{}], recyclers:[{authorization_status:'AUTHORIZED',total_processed_kg:0}], anomalies:[{status:'OPEN'}]
};
globalThis.dashboardDb = {from(table) {
  let from=0, to=999, head=false;
  return {select(_columns, options){head=!!options?.head;return this;},order(){return this;},abortSignal(){return this;},range(a,b){from=a;to=b;return this;},
    then(resolve){return Promise.resolve({data:head?null:tables[table].slice(from,to+1),count:tables[table].length,error:table===rejectTable?{message:'Read denied'}:null}).then(resolve);}
  };
}};
const { code } = await transform(`${paging}\nconst supabase=globalThis.dashboardDb;const withSwrCache=(_key,fetcher)=>fetcher();\n${method}`,{loader:'ts',format:'esm'});
const { getAdminKPIs } = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const result=await getAdminKPIs();
assert.equal(result.kpis.totalLotsRegistered,1203);
assert.equal(result.kpis.totalFinancialTurnover,12030);
assert.equal(result.materialBreakdown.PCB,2406);
rejectTable='payments';
await assert.rejects(getAdminKPIs(),/Read denied/);
rejectTable='collectors';
await assert.rejects(getAdminKPIs(),/Read denied/);
console.log('PASS: admin totals cover >1000 rows; failed reads reject rather than publish partial totals. Mock data only.');
