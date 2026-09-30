import {pathToFileURL} from 'node:url';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,parse} from 'node:path';
const {chromium} = await import(pathToFileURL(process.argv[2]).href);
const origin = process.env.VISION_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('console', message => { if(message.type()==='error') console.log('BROWSER:',message.text().slice(0,900)); });
  await page.goto(origin+'/login');
  if(process.argv[3] === '--production') {
    await page.evaluate(() => {
      localStorage.setItem('user',JSON.stringify({id:'vision-test',name:'Vision test',role:'COLLECTOR',phone:'0000000000'}));
      localStorage.setItem('collectorProfile',JSON.stringify({id:'vision-test-collector',userId:'vision-test',name:'Vision test',district:'Lucknow'}));
    });
    await page.goto(origin+'/collector/add');
    await page.locator('input[type=file]').first().setInputFiles(resolve('../dataset_ewaste_v1/test/images/battery_cables_test_001_6ac66a69.jpg'));
    await page.waitForFunction(() => /87%|0\.87/.test(document.body.innerText),null,{timeout:60000});
    console.log('PASS: built app photo-upload UI runs real ONNX inference and displays the battery test-image score.');
    await browser.close();
    process.exit(0);
  }
  const input = process.argv[3] && process.argv[3] !== '--dataset' ? 'data:image/jpeg;base64,'+(await readFile(process.argv[3])).toString('base64') : null;
  const result = await page.evaluate(async input => {
    const engine = await import('/src/services/vision/ewasteOnnx.ts');
    try {
      const session = await engine.getYoloSession();
      let source = document.createElement('canvas'); source.width=640; source.height=480;
      source.getContext('2d').fillRect(0,0,640,480);
      if (input) { const image = new Image(); image.src=input; await image.decode(); source=image; }
      const result = await engine.runEwasteYoloInference(source);
      return {inputs:session.inputMetadata,outputs:session.outputMetadata,result};
    } catch(error) { return {error:String(error),stack:error.stack}; }
  }, input);
  console.log(JSON.stringify(result,null,2));
  if(result.error || result.result.status==='ERROR') process.exitCode=1;
  if(process.argv[3] === '--dataset' && !result.error) {
    const root=resolve('../dataset_ewaste_v1/test');
    const images=await readdir(root+'/images');
    const perClass=Array(8).fill(0), samples=[];
    for(const label of (await readdir(root+'/labels')).filter(x=>x.endsWith('.txt')).sort()) {
      const classes=[...new Set((await readFile(root+'/labels/'+label,'utf8')).trim().split('\n').filter(Boolean).map(x=>Number(x.split(/\s/)[0])))];
      if(classes.length!==1 || perClass[classes[0]]>=3) continue;
      const filename=images.find(x=>parse(x).name===parse(label).name);
      if(!filename)continue;
      perClass[classes[0]]++;
      const src='data:image/jpeg;base64,'+(await readFile(root+'/images/'+filename)).toString('base64');
      const prediction=await page.evaluate(async src=>{
        const {analyzeScrapVision}=await import('/src/utils/visionClassifier.ts');
        const r=await analyzeScrapVision(src);
        return {status:r.status,category:r.category,confidence:r.confidence,timeMs:r.inferenceTimeMs};
      },src);
      samples.push({filename,expectedClass:classes[0],...prediction});
      if(prediction.status==='ERROR')process.exitCode=1;
    }
    console.log('REAL_PHOTO_SMOKE_TEST',JSON.stringify({note:'First three single-class test-split images per available class. Small smoke test, not an independent accuracy benchmark or mAP evaluation.',perClass,samples},null,2));
  }
} finally {await browser.close();}
