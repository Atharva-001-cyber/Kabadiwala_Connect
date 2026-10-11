import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source=await readFile('src/services/api.ts','utf8');
const start=source.indexOf('  updateObservedPrice: async');
const end=source.indexOf('\n  },',start)+5;
const method=source.slice(start,end).replace('updateObservedPrice: async','export const updateObservedPrice = async').replace(/,\s*$/,';');
const {code}=await transform('const supabase=globalThis.testDb; const invalidateCache=()=>{};\n'+method,{loader:'ts',format:'esm'});
let inserts=0, updates=0, rejectInsert=false, rejectUpdate=false;
globalThis.testDb={from(table){return {
 async insert(row){inserts++;assert.equal(row.source,'Real recycler quote');return {error:rejectInsert?{message:'Denied'}:null};},
 update(){updates++;return this;},eq(){return this;},
 then(resolve){return Promise.resolve({error:rejectUpdate?{message:'Offline'}:null}).then(resolve);}
};}};
const {updateObservedPrice}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const input={district:'Delhi NCR',materialCategory:'PCB',ratePerKg:100,source:'Real recycler quote'};
await assert.rejects(updateObservedPrice({...input,ratePerKg:NaN}),/valid observed rate/);
await assert.rejects(updateObservedPrice({...input,source:' '}),/actual source/);
assert.equal(inserts,0);
rejectInsert=true;
await assert.rejects(updateObservedPrice(input),/not confirmed saved/);
assert.equal(updates,0);
rejectInsert=false;rejectUpdate=true;
const partial=await updateObservedPrice(input);
assert.equal(partial.success,true);assert.match(partial.warning,/History saved/);
rejectUpdate=false;
const success=await updateObservedPrice(input);
assert.equal(success.success,true);assert.equal(success.warning,undefined);
const beforeInvalid=inserts;
for (const observationDate of ['2025-02-30', '2025-13-01', '', 'not-a-date', '2999-01-01']) {
 await assert.rejects(updateObservedPrice({...input,observationDate}),/valid observation date/);
}
assert.equal(inserts,beforeInvalid);
const beforeHistorical=updates;
const historical=await updateObservedPrice({...input,observationDate:'2025-02-28'});
assert.equal(historical.logEntry.date,'2025-02-28');
assert.equal(updates,beforeHistorical);
assert.match(historical.message,/benchmark unchanged/);
const today=new Date(Date.now()+330*60_000).toISOString().slice(0,10);
const current=await updateObservedPrice({...input,observationDate:today});
assert.equal(current.logEntry.date,today);
assert.equal(updates,beforeHistorical+1);
console.log('PASS: invalid/future dates blocked before writes; historical date preserved without benchmark mutation; today retains existing benchmark update.');
console.log('PASS: invalid inputs blocked, history rejection cannot report success, partial benchmark failure preserves saved-history status, valid observation confirmed. Mock database only.');
