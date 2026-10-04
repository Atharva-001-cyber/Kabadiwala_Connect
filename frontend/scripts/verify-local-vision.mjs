import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {localVisionPlugin,validateAdvice} from '../server/localVision.mjs';
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const env={LOCAL_VISION_ENABLED:'true',LOCAL_VISION_API_KEY:'test-key-not-real',LOCAL_VISION_MODEL:'test-model'};
const sample={status:'identified',object:'Cable',kind:'component',material:'CABLE',explanation:'Visible insulated wire; conductor unknown.'};
assert.equal(validateAdvice({...sample,kind:'whole_device'}).material,null);
assert.equal(validateAdvice({...sample,status:'uncertain'}).material,null);
assert.throws(()=>validateAdvice({...sample,material:'GOLD'}));
async function withEndpoint(settings,provider,run){
  let handler;
  localVisionPlugin(settings,provider).configureServer({middlewares:{use:(_,callback)=>handler=callback}});
  const server=createServer((req,res)=>handler(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const post=(body,headers={})=>fetch(origin+'/analyze',{method:'POST',headers:{origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  try {await run(post,origin);} finally {await new Promise(resolve=>server.close(resolve));}
}
const forbidden=async()=>{throw new Error('Provider should not be called');};
await withEndpoint({},forbidden,async(post,origin)=>{
  assert.deepEqual(await (await fetch(origin+'/status')).json(),{available:false});
  assert.equal((await post({image,consent:true,language:'en'})).status,503);
});
await withEndpoint(env,forbidden,async post=>{
  for(const body of [{image,language:'en'}, {image:'https://example.com/photo.jpg',consent:true,language:'en'},'{bad', {image:'data:image/png;base64,AAAA',consent:true,language:'en'}]) assert.equal((await post(body)).status,400);
  assert.equal((await post({image,consent:true,language:'en'},{origin:'https://evil.example'})).status,403);
  assert.equal((await post('x'.repeat(600001))).status,413);
});
let calls=0;
await withEndpoint(env,async(url,options)=>{
  calls++;assert.match(url,/^https:\/\/generativelanguage.googleapis.com\//);
  assert.equal(options.headers['x-goog-api-key'],env.LOCAL_VISION_API_KEY);
  const sent=JSON.parse(options.body);assert.equal(sent.contents[0].parts[1].inline_data.mime_type,'image/png');
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sample)}]}}]}));
},async post=>{
  const response=await post({image,consent:true,language:'hi'});assert.equal(response.status,200);
  const body=await response.text();assert.ok(!body.includes(env.LOCAL_VISION_API_KEY));assert.equal(JSON.parse(body).advice.material,'CABLE');
  assert.equal((await post({image,consent:true,language:'hi'})).status,429);
});
assert.equal(calls,1);
let busyCalls=0;
await withEndpoint(env,async()=>{busyCalls++;return new Response('busy',{status:503});},async post=>{
  const response=await post({image,consent:true,language:'en'});
  assert.equal((await response.json()).code,'PROVIDER_BUSY');
});
assert.equal(busyCalls,2,'503 retries must be bounded to one retry');
for(const provider of [async()=>new Response('bad',{status:429}),async()=>{throw new Error('timeout');},async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'not JSON'}]}}]}))]) {
  await withEndpoint(env,provider,async post=>assert.equal((await post({image,consent:true,language:'en'})).status,502));
}
console.log('PASS: consent, origin, disabled config, payload limits, schema, safe mapping, rate limit and provider-failure handling. Mock transport only; no cloud photos or paid calls.');
