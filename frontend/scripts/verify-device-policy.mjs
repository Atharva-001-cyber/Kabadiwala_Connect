import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle = await build({entryPoints:['src/services/vision/devicePolicy.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {devicePolicy,needsMaterialConfirmation,deviceDisplayLabel} = await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const item = (name,score) => ({name,score,box:[0,0,1,1]});
for (const name of ['CRT','Smartphone','Tablet','HDD','BarPhone']) assert.equal(devicePolicy([item(name,.99)]).status,'UNCERTAIN');
for (const name of ['Smartphone','Tablet']) {
  assert.equal(devicePolicy([item(name,.6873)]).clarification,'PHONE_OR_TABLET');
  assert.match(deviceDisplayLabel(name,'en'),/Phone or tablet/);
}
assert.equal(devicePolicy([item('Keyboard',.85)]).status,'SUGGESTION');
assert.equal(devicePolicy([item('Smartphone',.3)]).status,'UNCERTAIN');
assert.equal(devicePolicy([item('Keyboard',.85),item('Laptop',.7)]).status,'UNCERTAIN');
assert.equal(devicePolicy([]).status,'UNCERTAIN');
assert.equal(devicePolicy([item('Keyboard',NaN)]).objects.length,0);
assert.equal(needsMaterialConfirmation(devicePolicy([item('Keyboard',.85)]),'MIXED_PLASTIC'),true);
assert.equal(needsMaterialConfirmation(devicePolicy([item('PCB',.85)]),'MOTOR'),true);
assert.equal(needsMaterialConfirmation(devicePolicy([item('Battery',.85)]),'BATTERY'),false);
assert.equal(needsMaterialConfirmation({status:'UNAVAILABLE',objects:[],requiresConfirmation:true},'CABLE'),false);
console.log('PASS: weak/ambiguous classes abstain; whole devices cannot become material valuations; missing model preserves existing flow.');
