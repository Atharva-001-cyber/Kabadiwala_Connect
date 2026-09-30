import assert from 'node:assert/strict';
import {build} from 'esbuild';
globalThis.navigator = {onLine:false};
async function load(entry) {
  const result = await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'no-cloud',setup(b){
    b.onResolve({filter:/visionClassifier$/},()=>({path:'key',namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const getGeminiApiKey = () => "";'}));
  }}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const {readAllPages}=await load('src/services/readAllPages.ts');
const records=Array.from({length:1203},(_,id)=>({id}));
let reads=0;
const full=await readAllPages(async(from,to)=>{reads++;return {data:records.slice(from,to+1),error:null};});
assert.equal(full.length,1203);assert.equal(reads,5);
await assert.rejects(readAllPages(async()=>({data:null,error:{message:'Unavailable'}})),/Unavailable/);
await assert.rejects(readAllPages(async()=>({data:null,error:null})),/no dataset/);
const {auditDataset,safeCsvCell,redactDatasetRow}=await load('src/utils/datasetQuality.ts');
const report=auditDataset([{id:'a',weight:-1,timestamp:'bad'},{id:'a'},{amount:'abc'}],'lots');
assert.equal(report.duplicateIds,1);assert.equal(report.missingIds,1);assert.equal(report.invalidNumbers,2);assert.equal(report.invalidDates,1);assert.equal(report.missingSource,3);
assert.equal(safeCsvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
assert.equal(redactDatasetRow({phone:'private',handover_otp:'1234',id:'a'}).phone,'[REDACTED]');
assert.equal(redactDatasetRow({nested:{secret:'private'}}).nested.secret,'[REDACTED]');
const {VoiceCopilotEngine}=await load('src/services/voiceCopilotEngine.ts');
const ctx={role:'COLLECTOR',language:'en',userName:'Test',district:'Lucknow',fetchedAt:Date.now(),rates:{pcb:100,battery:80,cable:200,display:40,motor:120,appliance:50}};
const payment=await VoiceCopilotEngine.processUserQuery('send payment',ctx);
assert.match(payment.text,/simulations/);assert.equal(payment.action.route,'/collector/ledger');assert.equal(payment.soundboxPayout,undefined);
const lot=await VoiceCopilotEngine.processUserQuery('create lot',ctx);assert.match(lot.text,/not saved/);
const camera=await VoiceCopilotEngine.processUserQuery('camera not working',ctx);assert.equal(camera.action,undefined);
const quote=await VoiceCopilotEngine.processUserQuery('nearby recycler quote',ctx);assert.equal(quote.recyclerQuotes,undefined);
const rate=await VoiceCopilotEngine.processUserQuery('2.5 kg cable price',ctx);assert.match(rate.text,/500/);assert.match(rate.text,/estimate/);
const missing=await VoiceCopilotEngine.processUserQuery('2 kg cable rate',{...ctx,rates:{...ctx.rates,cable:NaN}});assert.doesNotMatch(missing.text,/₹/);
for (const language of ['hi','mr']) {
 const reply=await VoiceCopilotEngine.processUserQuery(language==='hi'?'मेरा भुगतान बताओ':'पेमेंट दाखवा',{...ctx,language});
 assert.ok(reply.spokenText.length>10);assert.equal(reply.soundboxPayout,undefined);
}
const audio=await VoiceCopilotEngine.processUserAudioQuery('','audio/webm',ctx);assert.equal(audio.source,'LOCAL_EDGE_BRAIN');
console.log('PASS: pagination >1000 rows, explicit fetch failures, dataset validation/redaction/CSV safety, multilingual copilot guidance, honest estimates, missing-data handling, and offline audio fallback. No network calls.');
