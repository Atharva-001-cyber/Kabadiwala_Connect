import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const built = await build({stdin:{contents:`
import React from 'react'; import {createRoot} from 'react-dom/client';
import {BrowserRouter,useNavigate} from 'react-router-dom';
import {RouteScrollReset} from './src/components/common/RouteScrollReset';
function Test(){const navigate=useNavigate(); const [auth,setAuth]=React.useState({isLoading:false,isAuthenticated:false,role:'COLLECTOR',user:null}); const [tick,setTick]=React.useState(0);window.auth=auth;window.setAuth=setAuth;window.go=navigate;window.refresh=()=>setTick(x=>x+1);
return <><RouteScrollReset/><div data-page-scroll-root style={{height:200,overflow:'auto'}}><div style={{height:1000}}>Page wrapper</div></div><div id="chat" style={{height:100,overflow:'auto'}}><div style={{height:1000}}>Independent chat</div></div><div style={{height:3000}}>Header {tick}</div></>}
createRoot(document.getElementById('root')).render(<BrowserRouter><Test/></BrowserRouter>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',plugins:[{name:'isolated-auth',setup(b){b.onResolve({filter:/context\/AuthContext$/},()=>({path:'auth',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const useAuth=()=>window.auth;'}));}}]});
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/test.js'?'text/javascript':'text/html');res.end(req.url==='/test.js'?built.outputFiles[0].text:'<style>html{scroll-behavior:smooth}</style><div id="root"></div><script src="/test.js"></script>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});await page.goto(`http://127.0.0.1:${server.address().port}/login`);await page.waitForFunction(()=>!!window.go);
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
 const scroll=async()=>{await settle();await page.evaluate(()=>{window.scrollTo({top:500,behavior:'instant'});document.querySelector('[data-page-scroll-root]').scrollTop=150;document.querySelector('#chat').scrollTop=80;});};
 const check=async()=>{await settle();assert.deepEqual(await page.evaluate(()=>[window.scrollY,document.querySelector('[data-page-scroll-root]').scrollTop,document.querySelector('#chat').scrollTop]),[0,0,80]);};
 for(const role of ['COLLECTOR','RECYCLER','ADMIN']){
  await scroll();await page.evaluate(role=>{window.setAuth({isLoading:true,isAuthenticated:false,role,user:null});window.go('/'+role.toLowerCase());},role);await check();
  await scroll();await page.evaluate(role=>window.setAuth({isLoading:false,isAuthenticated:true,role,user:{id:role}}),role);await check();
 }
 await scroll();await page.evaluate(()=>window.go('/admin?view=next'));await check();
 await scroll();await page.evaluate(()=>window.go(-1));await check();
 await scroll();await page.evaluate(()=>window.go(1));await check();
 await scroll();await page.evaluate(()=>window.refresh());await settle();assert.equal(await page.evaluate(()=>window.scrollY),500);
 await page.close();
}console.log('PASS: desktop/mobile, delayed authentication for all roles, route/query/back/forward top reset, nested scroll preserved, background refresh does not reset. Isolated auth; no server writes.');}
finally{await browser.close();server.close();}
