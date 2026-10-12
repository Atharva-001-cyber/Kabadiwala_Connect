import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
// Never call a real SMS provider. Replace configured credential before evaluation.
const source=(await readFile('src/services/fast2sms.ts','utf8')).replace(/const\s+apiKey\s*=.*;/g, 'const apiKey = "test-only-key";');
const {code}=await transform(source,{loader:'ts',format:'esm',define:{'import.meta.env.DEV':'true'}});
const oldFetch=globalThis.fetch, oldWindow=globalThis.window;
const saved={log:console.log,warn:console.warn,error:console.error};
console.log=console.warn=console.error=()=>{};
try {
 const {sendFast2SmsOtp}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return {json:async()=>({return:true})};};
 for(const hostname of ['localhost','127.0.0.1','[::1]']) {
  globalThis.window={location:{hostname}};
  const result=await sendFast2SmsOtp('9000000000','1234');
  assert.equal(result.success,true);
  assert.ok(calls.at(-1).url.startsWith('/fast2sms-api/bulkV2'));
  assert.ok(calls.at(-1).options.signal instanceof AbortSignal);
 }
 globalThis.fetch=async()=>{throw new Error('Simulated timeout');};
 const uncertain=await sendFast2SmsOtp('9000000000','1234');
 assert.equal(uncertain.success,false);
 assert.equal(uncertain.deliveryUnknown,true);
 const before=calls.length;
 await sendFast2SmsOtp('12','1234');
 assert.equal(calls.length,before);
} finally {
 globalThis.fetch=oldFetch; globalThis.window=oldWindow;
 Object.assign(console,saved);
}
console.log('PASS: loopback proxy routing, bounded HTTP request, uncertain-delivery flag and invalid-number guard. No actual SMS/network requests.');
