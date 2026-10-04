import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const {chromium} = await import(pathToFileURL(process.argv[2]).href);
const origin = 'http://127.0.0.1:5173';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const context = await browser.newContext();
  await context.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  const page = await context.newPage();
  await page.goto(origin+'/login');
  for (const path of process.argv.slice(3)) {
    const bytes = await readFile(path);
    const source = 'data:image/jpeg;base64,'+bytes.toString('base64');
    const result = await page.evaluate(async source => {
      const {analyzeDevice} = await import('/src/services/vision/deviceOnnx.ts');
      const {analyzeScrapVision} = await import('/src/utils/visionClassifier.ts');
      const image = new Image(); image.src = source; await image.decode();
      const start = performance.now();
      const result = await analyzeDevice(image);
      const integrated = await analyzeScrapVision(source);
      return {result, integratedCategory:integrated.category, integratedDevice:integrated.deviceSuggestion?.status, elapsedMs: Math.round(performance.now()-start)};
    }, source);
    console.log(JSON.stringify({path,...result}));
    assert.notEqual(result.result.status,'UNAVAILABLE');
    assert.equal(result.integratedCategory,null,'Whole devices must not become a sale material automatically');
    if (createHash('sha256').update(bytes).digest('hex') === 'd5bcfe4281886d20214efb331bce172ba4167233843a15b1f2b8b36151188907') {
      assert.equal(result.result.status,'UNCERTAIN','Confirmed tablet failure must not be presented as a resolved smartphone identity');
      assert.equal(result.result.clarification,'PHONE_OR_TABLET');
      console.log('PASS: known TABLET field failure remains a raw model error; presentation safely requests clarification.');
    }
  }
  const blank = await page.evaluate(async () => {
    const {analyzeDevice} = await import('/src/services/vision/deviceOnnx.ts');
    const canvas = document.createElement('canvas'); canvas.width=640;canvas.height=480;
    canvas.getContext('2d').fillRect(0,0,640,480);
    return analyzeDevice(canvas);
  });
  assert.notEqual(blank.status,'SUGGESTION');
  console.log('Blank-image safe abstention: PASS. Photos stayed local; this is not an accuracy benchmark.');
  await page.evaluate(() => {
    localStorage.setItem('user',JSON.stringify({id:'device-local-test',name:'Local test',role:'COLLECTOR',phone:'0000000000'}));
    localStorage.setItem('collectorProfile',JSON.stringify({id:'device-local-test',userId:'device-local-test',name:'Local test',district:'Lucknow'}));
  });
  await page.goto(origin+'/collector/add');
  await page.locator('input[type=file]').first().setInputFiles(process.argv.at(-1));
  const panel = page.getByTestId('device-suggestion');
  await panel.waitFor({timeout:60000});
  assert.match(await panel.innerText(),/Keyboard|कीबोर्ड/);
  console.log('PASS: actual upload/compression flow displays keyboard suggestion without saving a lot.');
  await page.goto(origin+'/collector/add');
  await page.reload();
  await page.locator('input[type=file]').first().setInputFiles(process.argv[3]);
  const clarification = page.getByTestId('phone-tablet-clarification');
  await clarification.waitFor({timeout:60000});
  assert.doesNotMatch(await page.getByTestId('device-suggestion').innerText(), /Smartphone|स्मार्टफोन|स्मार्टफोन/);
  console.log('PASS: uploaded tablet shows phone/tablet clarification, not a specific smartphone claim.');
  const fallback = await browser.newContext();
  await fallback.route('**/*', r => r.request().url().startsWith(origin) && !r.request().url().includes('device-candidate-v1.onnx') ? r.continue() : r.abort());
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto(origin+'/login');
  const unavailable = await fallbackPage.evaluate(async source => {
    const {analyzeScrapVision} = await import('/src/utils/visionClassifier.ts');
    return analyzeScrapVision(source);
  },'data:image/jpeg;base64,'+(await readFile(process.argv.at(-1))).toString('base64'));
  assert.equal(unavailable.deviceSuggestion.status,'UNAVAILABLE');
  console.log('PASS: missing device model returns gracefully; component/manual workflow survives.');
} finally {await browser.close();}
