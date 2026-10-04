import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const context=await browser.newContext();
  const origin='http://127.0.0.1:5173';let sent=0;
  await context.route('**/*',async route=>{
    const url=route.request().url();
    if(!url.startsWith(origin+'/'))return route.abort();
    if(url.endsWith('/local-vision/status'))return route.fulfill({json:{available:true,requiresAccessCode:true}});
    if(url.endsWith('/local-vision/analyze')){
      sent++;assert.equal(route.request().postDataJSON().consent,true);
      assert.equal(route.request().headers().authorization,'Bearer test-only-access-code');
      return route.fulfill({json:{advice:{status:'uncertain',object:'Test-only advice',explanation:'Mocked network response, not a model prediction.',material:null,requiresConfirmation:true}}});
    }
    return route.continue();
  });
  const page=await context.newPage();await page.goto(origin+'/login');
  await page.evaluate(()=>{
    localStorage.setItem('user',JSON.stringify({id:'vision-isolated-test',name:'Test',role:'COLLECTOR',phone:'0000000000'}));
    localStorage.setItem('collectorProfile',JSON.stringify({id:'vision-isolated-test',userId:'vision-isolated-test',name:'Test',district:'Lucknow'}));
  });
  await page.goto(origin+'/collector/add');
  await page.locator('input[type=file]').first().setInputFiles(process.argv[3]);
  const panel=page.getByTestId('cloud-vision-advice');await panel.waitFor({timeout:60000});
  assert.equal(sent,0);assert.ok(await panel.locator('button').isDisabled());
  await panel.locator('input[type=checkbox]').check();assert.equal(sent,0);
  assert.ok(await panel.locator('button').isDisabled());
  await panel.locator('input[type=password]').fill('test-only-access-code');
  await panel.locator('button').click();await panel.getByText('Test-only advice',{exact:true}).waitFor();
  assert.equal(sent,1);
  console.log('PASS: isolated upload works, no automatic cloud send, consent AND access code AND button required, authorization sent, advice renders. No cloud/database requests allowed.');
} finally {await browser.close();}
