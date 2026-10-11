import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const {chromium} = await import(pathToFileURL(process.argv[2]).href);
const bundle = await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {LanguageProvider} from './src/context/LanguageContext'; import {CertificateQr} from './src/components/common/CertificateQr'; const root=createRoot(document.getElementById('root')); window.renderLot=id=>root.render(<LanguageProvider><CertificateQr lotId={id}/></LanguageProvider>); localStorage.setItem('sih_kabadi_lang','en'); window.renderLot('EW-test-A');`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife'});
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/test.js'?'application/javascript':'text/html');res.end(req.url==='/test.js'?bundle.outputFiles[0].text:'<div id="root"></div><script src="/test.js"></script>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();
 await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 await page.goto(origin);
 await page.locator('img').waitFor();
 const first=await page.locator('img').getAttribute('src');
 assert.ok(first.startsWith('data:image/png;base64,'));
 await page.getByRole('button').click();
 await page.getByRole('dialog').waitFor();
 assert.equal(await page.getByRole('link').getAttribute('href'),origin+'/collector/tracking/EW-test-A');
 await page.getByText('Localhost link:',{exact:false}).waitFor();
 await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog').count(),0);
 await page.evaluate(()=>window.renderLot('EW-test-B'));
 await page.waitForFunction(previous=>document.querySelector('img')?.src!==previous && !!document.querySelector('img'),first);
 await page.getByRole('button').click();
 assert.equal(await page.getByRole('link').getAttribute('href'),origin+'/collector/tracking/EW-test-B');
 const decoded=await page.evaluate(async()=>{
   if (!('BarcodeDetector' in window)) return 'UNAVAILABLE';
   const detector=new BarcodeDetector({formats:['qr_code']});
   const result=await detector.detect(document.querySelector('[role=dialog] img'));
   return result[0]?.rawValue || 'NOT_DECODED';
 });
 if(decoded!=='UNAVAILABLE') assert.equal(decoded,origin+'/collector/tracking/EW-test-B');
 console.log('PASS: local QR render, different lot produces different image, correct tracking URL, enlarged view, Escape close, localhost warning; external requests blocked. Native decoder: '+decoded);
} finally {await browser.close();server.close();}
