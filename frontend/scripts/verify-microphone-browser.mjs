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
      start() { window.micStarts++; window.mic = this; this.onstart?.(); }
      abort() { this.onend?.(); }
      stop() { this.onend?.(); }
    };
    window.SpeechRecognition = window.webkitSpeechRecognition;
    localStorage.setItem('user', JSON.stringify({ id:'mic-test', role:'COLLECTOR', name:'Mic test', phone:'0000000000' }));
    localStorage.setItem('collectorProfile', JSON.stringify({ id:'mic-test', userId:'mic-test', name:'Mic test', district:'Lucknow' }));
    sessionStorage.setItem('kabaad_assistant_is_open', 'false');
  });
  const page = await context.newPage();
  await page.goto(origin + '/collector/add');
  await page.getByRole('button', { name:'Kabaad Saathi Multilingual Voice Assistant' }).click();
  await page.getByTitle('Tap to Speak', { exact:true }).click();
  assert.equal(await page.evaluate(() => window.micStarts), 1);
  await page.getByTitle('Stop Listening', { exact:true }).waitFor();
  await page.evaluate(() => window.mic.onerror({error:'not-allowed'}));
  await page.getByTitle('Tap to Speak', { exact:true }).waitFor();
  assert.match(await page.locator('body').innerText(), /माइक्रोफ़ोन|Microphone|मायक्रोफोन/);
  // Close must cancel recognition; a late result must not submit a query.
  await page.reload();
  await page.getByRole('button', { name:'Kabaad Saathi Multilingual Voice Assistant' }).click();
  await page.getByTitle('Tap to Speak', { exact:true }).click();
  await page.getByRole('button', { name:'Close voice assistant' }).click();
  const active = await page.evaluate(async () => (await import('/src/services/speechService.ts')).speechService.getCurrentRecognition());
  assert.equal(active, null);
  console.log('PASS: isolated Chrome context, mobile viewport, mic start/stop UI, denied-permission recovery, close cleanup. Speech events simulated; no real Android/accent validation and no external requests.');
} finally { await browser.close(); }
