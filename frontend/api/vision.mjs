import {localVisionPlugin} from '../server/localVision.mjs';
// Limiter is per instance, not a distributed quota control. Disabled by default.
export function createVisionHandler(env=process.env,providerFetch=fetch){
  let handler;
  localVisionPlugin({
    LOCAL_VISION_ENABLED:env.VISION_ENABLED,
    LOCAL_VISION_API_KEY:env.VISION_API_KEY,
    LOCAL_VISION_MODEL:env.VISION_MODEL,
    VISION_ALLOWED_ORIGIN:env.VISION_ALLOWED_ORIGIN,
    VISION_ACCESS_TOKEN:env.VISION_ACCESS_TOKEN,
  },providerFetch,{production:true}).configureServer({middlewares:{use:(_,callback)=>{handler=callback;}}});
  return async (req,res)=>{
    const action=new URL(req.url,'https://placeholder.invalid').searchParams.get('action');
    if(!['status','analyze'].includes(action)){
      res.statusCode=404;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Not found'}));return;
    }
    req.url=`/${action}`;
    return handler(req,res);
  };
}
export default createVisionHandler();
