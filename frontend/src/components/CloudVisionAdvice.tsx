import React, {useEffect, useRef, useState} from 'react';

export default function CloudVisionAdvice({image,language}:{image:string;language:'en'|'hi'|'mr'}) {
  const [available,setAvailable]=useState(false);
  const [consent,setConsent]=useState(false);
  const [requiresCode,setRequiresCode]=useState(false);
  const [accessCode,setAccessCode]=useState('');
  const endpoint=(action:string)=>(import.meta as any).env.DEV?`/local-vision/${action}`:`/api/vision?action=${action}`;
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [advice,setAdvice]=useState<{object:string;explanation:string;status:string}|null>(null);
  const request=useRef<AbortController|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(endpoint('status'),{signal:controller.signal}).then(r=>r.ok?r.json():null).then(r=>{if(!controller.signal.aborted){setAvailable(r?.available===true);setRequiresCode(r?.requiresAccessCode===true);}}).catch(()=>{});
    return ()=>{controller.abort();request.current?.abort();};
  },[]);
  const t=(en:string,hi:string,mr:string)=>({en,hi,mr}[language]);
  if (!available) return null;
  const analyze=async()=>{
    if(!consent || busy || (requiresCode&&!accessCode.trim())) return;
    const controller=new AbortController();request.current=controller;
    const timer=setTimeout(()=>controller.abort(),30000);
    setBusy(true);setMessage('');setAdvice(null);
    try {
      const response=await fetch(endpoint('analyze'),{method:'POST',headers:{'Content-Type':'application/json',...(requiresCode?{Authorization:`Bearer ${accessCode.trim()}`}:{})},signal:controller.signal,body:JSON.stringify({image,language,consent:true})});
      const result=await response.json();
      if(!response.ok) {
        const reason=result.code==='VISION_AUTH_REQUIRED'?t('Incorrect vision access code. Manual selection still works.','AI access code सही नहीं है। मैनुअल चयन उपलब्ध है।','AI access code चुकीचा आहे. मॅन्युअल निवड उपलब्ध आहे.'):
          result.code==='PROVIDER_BUSY'?t('Google AI is temporarily busy. Try later or select the category manually.','Google AI अभी व्यस्त है। बाद में कोशिश करें या श्रेणी स्वयं चुनें।','Google AI सध्या व्यस्त आहे. नंतर प्रयत्न करा किंवा स्वतः श्रेणी निवडा.'):
          result.code==='MODEL_UNAVAILABLE'?t('Configured model unavailable; update local model setting.','चुना गया मॉडल उपलब्ध नहीं है; स्थानीय मॉडल सेटिंग बदलें।','निवडलेले मॉडेल उपलब्ध नाही; स्थानिक मॉडेल सेटिंग बदला.'):
          result.code==='QUOTA_LIMIT'?t('Google quota/rate limit reached. Try later; do not enable billing automatically.','Google की उपयोग सीमा पूरी हुई। बाद में प्रयास करें; भुगतान अपने आप चालू न करें।','Google वापर मर्यादा संपली. नंतर प्रयत्न करा; बिलिंग आपोआप सुरू करू नका.'):
          result.code==='ACCESS_DENIED'?t('Google API access denied. Check the server-side key permissions.','Google API की अनुमति नहीं मिली। सर्वर की key permissions जाँचें।','Google API परवानगी नाही. सर्व्हर key permissions तपासा.'):
          result.code==='INCOMPLETE_RESPONSE'?t('AI returned an incomplete answer. Retry or choose manually.','AI का जवाब अधूरा है। फिर प्रयास करें या स्वयं श्रेणी चुनें।','AI चे उत्तर अपूर्ण आहे. पुन्हा प्रयत्न करा किंवा स्वतः निवडा.'):null;
        if(reason){setMessage(reason);return;}
        throw new Error('Unavailable');
      }
      if(!result.advice || typeof result.advice.object!=='string' || typeof result.advice.explanation!=='string') throw new Error('Unavailable');
      setAdvice(result.advice);
    } catch {if(request.current===controller)setMessage(t('Online help unavailable. Local result and manual selection are unchanged.','ऑनलाइन मदद उपलब्ध नहीं है। स्थानीय परिणाम और मैनुअल चयन सुरक्षित हैं।','ऑनलाइन मदत उपलब्ध नाही. स्थानिक निकाल आणि मॅन्युअल निवड बदललेली नाही.'));}
    finally {clearTimeout(timer);setBusy(false);}
  };
  return <section className="rounded-2xl border border-teal-200 bg-white p-4 space-y-3" data-testid="cloud-vision-advice">
    <h3 className="font-semibold">{t('Optional online second opinion','वैकल्पिक ऑनलाइन AI राय','पर्यायी ऑनलाइन AI सल्ला')}</h3>
    {requiresCode&&<label className="block text-sm">{t('Prototype vision access code (not your Google API key)','प्रोटोटाइप AI access code (Google API key नहीं)','प्रोटोटाइप AI access code (Google API key नाही)')}<input type="password" autoComplete="off" value={accessCode} onChange={e=>setAccessCode(e.target.value)} className="block border rounded p-2 w-full" /></label>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>{t('I agree to send this photo to Google Gemini. Avoid personal details; provider data terms apply.','मैं यह फोटो Google Gemini को भेजने की सहमति देता हूँ। निजी जानकारी न भेजें; प्रदाता की डेटा शर्तें लागू हैं।','हा फोटो Google Gemini कडे पाठवण्यास संमती आहे. वैयक्तिक माहिती टाळा; प्रदात्याच्या डेटा अटी लागू आहेत.')}</label>
    <button type="button" disabled={!consent||busy||(requiresCode&&!accessCode.trim())} onClick={analyze} className="rounded-lg bg-teal-700 text-white px-4 py-2 disabled:opacity-50">{busy?t('Checking…','जाँच जारी…','तपासत आहे…'):t('Get second opinion','दूसरी राय लें','दुसरा सल्ला घ्या')}</button>
    <div aria-live="polite">{message}{advice&&<><p className="font-semibold">{advice.object}</p><p>{advice.explanation}</p><p className="text-sm">{t('AI second opinion, not verified identity. Confirm the material below; nothing has been selected or saved automatically.','यह AI राय है, सत्यापित पहचान नहीं। नीचे सामग्री की पुष्टि करें; कोई चयन या सेव अपने आप नहीं हुआ है।','हा AI सल्ला आहे, पडताळलेली ओळख नाही. खाली साहित्य निश्चित करा; आपोआप निवड किंवा सेव्ह झालेले नाही.')}</p></>}</div>
  </section>;
}
