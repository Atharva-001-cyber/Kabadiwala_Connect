import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const origin = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  await context.addInitScript(() => {
    window.micStarts = 0;
    window.webkitSpeechRecognition = class {
      start() { window.micStarts++; window.mic = this; if (!window.delayMicStart) this.onstart?.(); }
      abort() { this.onend?.(); }
      stop() { this.onend?.(); }
    };
    window.SpeechRecognition = window.webkitSpeechRecognition;
    localStorage.setItem('user', JSON.stringify({ id:'mic-test', role:'COLLECTOR', name:'Mic test', phone:'0000000000' }));
    localStorage.setItem('collectorProfile', JSON.stringify({ id:'mic-test', userId:'mic-test', name:'Mic test', district:'Lucknow' }));
    sessionStorage.setItem('kabaad_assistant_is_open', 'false');
    sessionStorage.setItem('kabaad_assistant_chat_history', JSON.stringify(Array.from({length:25}, (_,i)=>({id:'scroll-test-'+i,sender:'assistant',text:'Saved chat message '+i+' with enough text to fill the conversation.',timestamp:'12:00',source:'LOCAL_EDGE_BRAIN'}))));
  });
  const page = await context.newPage();
  await page.goto(origin + '/collector/add');
  await page.getByRole('button', { name:'Kabaad Saathi Multilingual Voice Assistant' }).click();
  await page.evaluate(() => { window.delayMicStart = true; });
  await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).click();
  assert.equal(await page.evaluate(() => window.micStarts), 1);
  assert.equal(await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).isDisabled(), true);
  await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).dispatchEvent('click');
  assert.equal(await page.evaluate(() => window.micStarts), 1, 'rapid taps cannot start another pending mic');
  await page.evaluate(() => { window.delayMicStart = false; window.mic.onstart(); });
  await page.getByTitle(/^(Stop Listening|सुनना बंद करें|ऐकणे थांबवा)$/).waitFor();
  await page.evaluate(() => window.mic.onerror({error:'network'}));
  const alternative = page.getByRole('button', {name:/Record using alternative|वैकल्पिक आवाज़|पर्यायी आवाज/});
  await alternative.waitFor();
  assert.equal(await alternative.isDisabled(), true, 'No audio upload without consent');
  await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).click();
  assert.equal(await page.evaluate(() => window.micStarts), 2, 'Network error must not silently switch the normal mic to cloud recording');
  await page.evaluate(() => window.mic.onerror({error:'not-allowed'}));
  await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).waitFor();
  assert.match(await page.locator('body').innerText(), /माइक्रोफ़ोन|Microphone|मायक्रोफोन/);
  // Close must cancel recognition; a late result must not submit a query.
  await page.reload();
  await page.getByRole('button', { name:'Kabaad Saathi Multilingual Voice Assistant' }).click();
  await page.evaluate(() => { window.delayMicStart = true; });
  await page.getByTitle(/^(Tap to Speak|बोलने के लिए दबाएँ|बोलण्यासाठी दाबा)$/).click();
  await page.getByPlaceholder(/Speak or type|बोलें या टाइप|बोला किंवा टाइप/).fill('typed fallback still available');
  await page.getByRole('button', { name:'Close voice assistant' }).click();
  await page.evaluate(() => { window.mic.onstart?.(); window.mic.onresult?.({results:[[ {transcript:'stale result'} ]]}); });
  const active = await page.evaluate(async () => (await import('/src/services/speechService.ts')).speechService.getCurrentRecognition());
  assert.equal(active, null);
  await page.evaluate(() => window.scrollTo({top:200,behavior:'instant'}));
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name:'Kabaad Saathi Multilingual Voice Assistant' }).click();
  await page.waitForFunction(() => { const e=document.querySelector('[data-testid="copilot-messages"]'); return e && e.scrollHeight-e.scrollTop-e.clientHeight < 3; });
  assert.equal(await page.evaluate(() => window.scrollY), before, 'Opening chat must not scroll the underlying page');
  await page.getByTestId('copilot-messages').evaluate(e => {e.scrollTop=0;});
  await page.getByRole('button', {name:'Close voice assistant'}).click();
  await page.getByRole('button', {name:'Kabaad Saathi Multilingual Voice Assistant'}).click();
  await page.waitForFunction(() => { const e=document.querySelector('[data-testid="copilot-messages"]'); return e && e.scrollHeight-e.scrollTop-e.clientHeight < 3; });
  console.log('PASS: isolated Chrome context, mobile viewport, mic start/stop UI, denied-permission recovery, close cleanup. Speech events simulated; no real Android/accent validation and no external requests.');
} finally { await browser.close(); }
