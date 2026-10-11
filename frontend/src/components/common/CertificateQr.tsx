import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '../../context/LanguageContext';

/** Encodes a record link, not a signature or proof of government certification. */
export const CertificateQr: React.FC<{ lotId: string }> = ({ lotId }) => {
  const { language } = useLanguage();
  const [image, setImage] = useState('');
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const url = new URL(`/collector/tracking/${encodeURIComponent(lotId)}`, window.location.origin).href;
  const text = (en: string, hi: string, mr: string) => language === 'hi' ? hi : language === 'mr' ? mr : en;
  useEffect(() => {
    let active = true;
    setImage(''); setFailed(false);
    QRCode.toDataURL(url, { width: 512, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(data => { if (active) setImage(data); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [url]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [expanded]);
  const label = text('Enlarge lot tracking QR (collector access required)', 'लॉट ट्रैकिंग QR बड़ा करें (कलेक्टर एक्सेस आवश्यक)', 'लॉट ट्रॅकिंग QR मोठा करा (कलेक्टर प्रवेश आवश्यक)');
  return <>
    <button type="button" onClick={() => setExpanded(true)} title={label} aria-label={label}
      className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-300 shadow-sm shrink-0">
      {image ? <img src={image} alt={label} className="w-full h-full rounded-lg" /> :
        <span className="text-[9px] text-slate-700">{failed ? text('QR unavailable', 'QR अनुपलब्ध', 'QR अनुपलब्ध') : '…'}</span>}
    </button>
    {expanded && <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
      <div className="bg-white rounded-xl p-5 max-w-sm w-full text-slate-900 text-center" onClick={event => event.stopPropagation()}>
        {image && <img src={image} alt={label} className="w-full max-w-[320px] mx-auto" />}
        <p className="text-xs my-2">{text('Platform lot tracking link. Collector login/access required. Not government verification.', 'प्लेटफ़ॉर्म लॉट ट्रैकिंग लिंक। कलेक्टर लॉगिन/एक्सेस आवश्यक। सरकारी सत्यापन नहीं।', 'प्लॅटफॉर्म लॉट ट्रॅकिंग लिंक. कलेक्टर लॉगिन/प्रवेश आवश्यक. सरकारी पडताळणी नाही.')}</p>
        {['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) && <p className="text-xs text-amber-800 my-2">{text('Localhost link: another phone cannot open this computer using this address.', 'यह localhost लिंक दूसरे फ़ोन पर इस कंप्यूटर को नहीं खोलेगा।', 'ही localhost लिंक दुसऱ्या फोनवर हा संगणक उघडणार नाही.')}</p>}
        <a href={url} className="text-xs underline break-all">{text('Open lot tracking', 'लॉट ट्रैकिंग खोलें', 'लॉट ट्रॅकिंग उघडा')}</a>
        <button type="button" autoFocus onClick={() => setExpanded(false)} className="block mx-auto mt-3 px-4 py-2 rounded bg-emerald-700 text-white">{text('Close', 'बंद करें', 'बंद करा')}</button>
      </div>
    </div>}
  </>;
};
