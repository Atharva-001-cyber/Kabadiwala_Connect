import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'playwright');
const bundle = await build({
  stdin: { contents: `import {api} from './src/services/api'; import {offlineDb} from './src/services/db'; import * as queue from './src/services/offlineLotQueue'; window.testOffline = {api, offlineDb, ...queue};`, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'iife', platform: 'browser',
  plugins: [{ name: 'no-live-database', setup(b) {
    b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: 'stub', namespace: 'test' }));
    b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const supabase = {from: (...args) => window.fakeFrom(...args)};' }));
  } }]
});
const server = createServer(async (req, res) => {
  if (req.url === '/test') { res.setHeader('Content-Type','text/html'); res.end('<script src="/test.js"></script>'); return; }
  if (req.url === '/test.js') { res.setHeader('Content-Type','application/javascript'); res.end(bundle.outputFiles[0].text); return; }
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const root = resolve('dist');
    const file = resolve(root, '.' + (extname(pathname) ? pathname : '/index.html'));
    if (!file.startsWith(root + '\\') && !file.startsWith(root + '/')) throw Error('Invalid path');
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'})[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(origin + '/test');
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({role:'COLLECTOR'}));
    localStorage.setItem('collectorProfile', JSON.stringify({id:'test_col_a',name:'Offline test'}));
  });
  await context.setOffline(true);
  const saved = await page.evaluate(async () => {
    window.inputLot = { clientLotId:'EW-offline-test', materialCategory:'CABLE', approxWeight:10, condition:'INTACT', sourceType:'HOUSEHOLD', imageUrl:'data:image/png;base64,test-photo', latitude:12.3, longitude:45.6 };
    const result = await testOffline.api.createLot(window.inputLot);
    return { persisted:result.persisted, draft:await testOffline.offlineDb.offlineLots.get(window.inputLot.clientLotId) };
  });
  assert.equal(saved.persisted, false);
  assert.equal(saved.draft.syncStatus, 'PENDING');
  assert.equal(saved.draft.collectorId, 'test_col_a');
  assert.equal(saved.draft.payload.latitude, 12.3);
  assert.equal(saved.draft.imageUrl, 'data:image/png;base64,test-photo');
  await context.setOffline(false);
  await page.reload();
  assert.equal(await page.evaluate(() => testOffline.offlineDb.offlineLots.count()), 1);
  const results = await page.evaluate(async () => {
    const db = testOffline.offlineDb;
    const draft = await db.offlineLots.get('EW-offline-test');
    let uploadCalls = 0;
    const success = async p => { uploadCalls++; return {success:true,lot:{id:p.clientLotId}}; };
    localStorage.setItem('collectorProfile', JSON.stringify({id:'test_col_b'}));
    await testOffline.uploadLotDraft(draft, success);
    const wrongOwnerCalls = uploadCalls;
    localStorage.setItem('collectorProfile', JSON.stringify({id:'test_col_a'}));
    await testOffline.uploadLotDraft(draft, async () => { throw new TypeError('Failed to fetch'); });
    const networkStatus = (await db.offlineLots.get(draft.clientLotId)).syncStatus;
    await testOffline.uploadLotDraft(draft, async () => { throw {code:'42501',message:'Permission denied'}; });
    const deniedStatus = (await db.offlineLots.get(draft.clientLotId)).syncStatus;
    await Promise.all([testOffline.uploadLotDraft(draft,success),testOffline.uploadLotDraft(draft,success)]);
    const finalStatus = (await db.offlineLots.get(draft.clientLotId)).syncStatus;
    let quotaRejected = false;
    const originalAdd = db.offlineLots.add.bind(db.offlineLots);
    db.offlineLots.add = async () => { throw new DOMException('Full','QuotaExceededError'); };
    try { await testOffline.saveLotDraft({...draft.payload,clientLotId:'full-storage'}); } catch { quotaRejected = true; }
    db.offlineLots.add = originalAdd;
    return {wrongOwnerCalls,networkStatus,deniedStatus,uploadCalls,finalStatus,quotaRejected};
  });
  assert.deepEqual(results,{wrongOwnerCalls:0,networkStatus:'PENDING',deniedStatus:'FAILED',uploadCalls:1,finalStatus:'SYNCED',quotaRejected:true});
  const retry = await page.evaluate(async () => {
    const tables = {lots:new Map(),traceability_logs:new Map()};
    let inserts = 0, loseResponse = true;
    window.fakeFrom = table => {
      let operation='select', row, id;
      const q = {
        select(){return q;}, eq(k,v){id=v;return q;}, abortSignal(){return q;}, maybeSingle(){return q;}, single(){return q;},
        insert(value){operation='insert';row=value;return q;}, upsert(value){operation='upsert';row=value;return q;},
        then(resolve){
          if(operation==='select') return Promise.resolve({data:tables[table].get(id)||null,error:null}).then(resolve);
          if(operation==='insert') {
            inserts++; tables[table].set(row.id,row);
            if(loseResponse){loseResponse=false;return Promise.resolve({data:null,error:{message:'Failed to fetch'}}).then(resolve);}
          } else if (!tables[table].has(row.id)) tables[table].set(row.id,row);
          return Promise.resolve({data:row,error:null}).then(resolve);
        }
      }; return q;
    };
    const input={clientLotId:'EW-response-lost',materialCategory:'CABLE',approxWeight:5,condition:'INTACT',sourceType:'HOUSEHOLD'};
    const first = await testOffline.api.createLot(input);
    const draft = await testOffline.offlineDb.offlineLots.get(input.clientLotId);
    const second = await testOffline.api.syncOfflineBatch([draft]);
    const third = await testOffline.api.syncOfflineBatch([draft]);
    return {first:first.persisted,second:second.syncedCount,third:third.syncedCount,inserts,lots:tables.lots.size,traces:tables.traceability_logs.size,status:(await testOffline.offlineDb.offlineLots.get(input.clientLotId)).syncStatus};
  });
  assert.deepEqual(retry,{first:false,second:1,third:1,inserts:1,lots:1,traces:1,status:'SYNCED'});
  await context.close();
  const shell = await browser.newContext();
  await shell.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const shellPage = await shell.newPage();
  await shellPage.goto(origin + '/login');
  await shellPage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await shellPage.waitForFunction(() => !!navigator.serviceWorker.controller);
  await shell.setOffline(true);
  await shellPage.reload();
  await shellPage.waitForFunction(() => document.getElementById('root')?.childElementCount > 0);
  assert.ok((await shellPage.locator('body').innerText()).length > 50);
  await shellPage.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({id:'offline-user',role:'COLLECTOR',name:'Offline test',phone:'0000000000'}));
    localStorage.setItem('sih_kabadi_token','offline-test-session');
    localStorage.setItem('collectorProfile', JSON.stringify({id:'offline-collector',userId:'offline-user',name:'Offline test',district:'Lucknow',state:'Uttar Pradesh'}));
  });
  await shellPage.goto(origin + '/collector/add');
  await shellPage.waitForSelector('input[type=file]', {state:'attached'});
  assert.equal(new URL(shellPage.url()).pathname, '/collector/add');
  console.log('PASS: real-browser IndexedDB save/reload, photo/metadata preservation, account isolation, network retry, rejection retention, concurrent sync, storage-full rejection, lost-response idempotence, single trace, and offline app-shell reload. All remote requests blocked; no live database writes.');
  await shell.close();
} finally { await browser.close(); server.close(); }
