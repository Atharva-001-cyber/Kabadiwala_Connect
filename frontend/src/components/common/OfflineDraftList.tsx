import React, { useEffect, useState } from 'react';
import { offlineDb } from '../../services/db';
import { activeCollectorId } from '../../services/offlineLotQueue';
import { OfflineLotItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineDraftList: React.FC = () => {
  const { collectorProfile, role } = useAuth();
  const { language } = useLanguage();
  const [drafts, setDrafts] = useState<OfflineLotItem[]>([]);
  useEffect(() => {
    let active = true;
    const owner = role === 'COLLECTOR' ? collectorProfile?.id : undefined;
    const refresh = async () => {
      const rows = await offlineDb.offlineLots.toArray();
      if (active) setDrafts(owner && activeCollectorId() === owner ? rows.filter(r => r.collectorId === owner && r.syncStatus !== 'SYNCED') : []);
    };
    const update = () => { void refresh().catch(console.warn); };
    update();
    window.addEventListener('offline-lots-changed', update);
    const timer = setInterval(update, 15000);
    return () => { active = false; clearInterval(timer); window.removeEventListener('offline-lots-changed', update); };
  }, [collectorProfile?.id, role]);
  if (!drafts.length) return null;
  return <details className="w-full text-xs">
    <summary className="cursor-pointer underline">{language === 'hi' ? 'फोन पर सुरक्षित लॉट देखें' : language === 'mr' ? 'फोनवर सेव्ह केलेले लॉट पहा' : 'View lots saved on this device'} ({drafts.length})</summary>
    <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto">
      {drafts.map(draft => <li key={draft.clientLotId} className="flex gap-2 border border-current rounded p-2">
        {draft.imageUrl && <img src={draft.imageUrl} alt="Saved lot" className="w-12 h-12 object-cover rounded" />}
        <div className="min-w-0 break-words">
          <p>{draft.subCategory || draft.materialCategory} · {draft.approxWeight} kg</p>
          <p>{draft.clientLotId}</p>
          <p>{draft.syncStatus === 'FAILED' ? (language === 'hi' ? 'अपलोड में समस्या — ड्राफ्ट सुरक्षित है' : language === 'mr' ? 'अपलोड समस्या — मसुदा सुरक्षित' : 'Upload needs attention — draft retained') : (language === 'hi' ? 'अपलोड बाकी है' : language === 'mr' ? 'अपलोड बाकी' : 'Upload pending')}</p>
        </div>
      </li>)}
    </ul>
  </details>;
};
