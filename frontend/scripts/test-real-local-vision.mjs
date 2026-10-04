// Explicit opt-in: sends listed photos to Google via local-only consent middleware.
import {loadEnv} from 'vite';
import {localVisionPlugin} from '../server/localVision.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
if(process.argv[2]!=='--send-to-google' || process.argv.length<4)throw new Error('Explicit --send-to-google and image paths required');
let handler;
localVisionPlugin(loadEnv('development',process.cwd(),'LOCAL_VISION_')).configureServer({middlewares:{use:(_,h)=>handler=h}});
const server=createServer((req,res)=>handler(req,res));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
try {
  for(const [index,path] of process.argv.slice(3).entries()){
    if(index)await new Promise(resolve=>setTimeout(resolve,10500));
    const bytes=await readFile(path);
    if(bytes.length>400000){console.log(JSON.stringify({path,status:'SKIPPED_SIZE_LIMIT'}));continue;}
    const mime=path.toLowerCase().endsWith('.png')?'image/png':'image/jpeg';
    const start=Date.now();
    const response=await fetch(origin+'/analyze',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},signal:AbortSignal.timeout(35000),body:JSON.stringify({image:`data:${mime};base64,${bytes.toString('base64')}`,language:'en',consent:true})});
    console.log(JSON.stringify({path,http:response.status,elapsedMs:Date.now()-start,result:await response.json()}));
  }
}finally{server.closeAllConnections();server.close();}
