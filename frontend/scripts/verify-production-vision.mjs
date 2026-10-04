import assert from 'node:assert/strict';
import {createVisionHandler} from '../api/vision.mjs';
const env={VISION_ENABLED:'true',VISION_API_KEY:'mock-provider-key',VISION_MODEL:'test-model',VISION_ACCESS_TOKEN:'a'.repeat(48),VISION_ALLOWED_ORIGIN:'https://preview.example'};
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
let calls=0;
const provider=async()=>{calls++;return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({status:'identified',object:'Keyboard',kind:'whole_device',material:'PLASTIC_BODY',explanation:'Whole device, not detached casing.'})}]}}]}));};
async function call(handler,{action='analyze',method='POST',origin=env.VISION_ALLOWED_ORIGIN,token=env.VISION_ACCESS_TOKEN,body={image,consent:true,language:'en'}}={}){
  const req={url:`/api/vision?action=${action}`,method,headers:{origin,'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body,socket:{remoteAddress:'203.0.113.2'}};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=JSON.parse(v);}};
  await handler(req,res);return res;
}
const handler=createVisionHandler(env,provider);
assert.equal((await call(handler,{action:'status',method:'GET'})).body.available,true);
assert.equal((await call(createVisionHandler({},provider),{action:'status',method:'GET'})).body.available,false);
assert.equal((await call(createVisionHandler({...env,VISION_ACCESS_TOKEN:'short'},provider),{action:'status',method:'GET'})).body.available,false);
assert.equal((await call(handler,{token:''})).statusCode,401);
assert.equal((await call(handler,{token:'wrong'})).statusCode,401);
assert.equal((await call(handler,{origin:'https://attacker.example'})).statusCode,403);
assert.equal((await call(handler,{body:{image,consent:false,language:'en'}})).statusCode,400);
assert.equal((await call(handler,{action:'unknown'})).statusCode,404);
assert.equal((await call(handler,{body:'x'.repeat(600001)})).statusCode,413);
assert.equal(calls,0);
const response=await call(handler);
assert.equal(response.statusCode,200);assert.equal(response.body.advice.material,null);
assert.equal(response.headers['Cache-Control'],'no-store');
assert.ok(!JSON.stringify(response.body).includes(env.VISION_API_KEY));
assert.equal((await call(handler)).statusCode,429);assert.equal(calls,1);
console.log('PASS: production adapter disabled by default; access code, origin, consent, payload limits, safe mapping, secret redaction and per-instance cooldown. Mock provider only.');
