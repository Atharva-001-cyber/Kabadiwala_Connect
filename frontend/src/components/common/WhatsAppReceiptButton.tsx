import React from 'react';
import { MessageSquare, Share2, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export const generateWhatsAppReceiptText = ({
  lot,
  handover,
  collectorTotalWeight = 180,
  language = 'hi'
}: {
  lot?: any;
  handover?: any;
  collectorTotalWeight?: number;
  language?: string;
}) => {
  const lotId = lot?.id || handover?.lotId || 'LOT-2026-99';
  const category = lot?.materialCategory || 'PCB / E-Waste';
  const weight = handover?.actualWeight || lot?.approxWeight || 10;
  const amount = handover?.finalPaymentAmount || 1250;
  const payMethod = handover?.paymentMethod || 'CASH';
  const collector = lot?.collectorName || 'Ramesh Kumar (CPCB Verified)';
  const recycler = lot?.selectedRecyclerName || 'EcoRecycle India Pvt Ltd';

  // Badge determination
  let badgeIcon = '🥉';
  let badgeName = 'Green Warrior (हरित योद्धा)';
  if (collectorTotalWeight >= 1000) {
    badgeIcon = '🥇';
    badgeName = 'CPCB Champion Collector (1,000 kg Gold)';
  } else if (collectorTotalWeight >= 500) {
    badgeIcon = '🥈';
    badgeName = 'Urban Mining Master (500 kg Silver)';
  }

  // Environmental Savings calculation
  const co2Saved = (weight * 1.44).toFixed(1);
  const leadSaved = (weight * 0.04).toFixed(2);

  if (language === 'hi') {
    return `♻️ *कबाड़ीवाला कनेक्ट - आधिकारिक डिजिटल ई-कचरा रसीद* ♻️
----------------------------------------
🧾 *रसीद / आईडी*: ${lotId}
📅 *तारीख*: ${new Date().toLocaleDateString('en-IN')}

👤 *कलेक्टर (पर्यावरण योद्धा)*: ${collector}
🏢 *रीसाइक्लर फैक्ट्री*: ${recycler}
📦 *सामग्री श्रेणी*: ${category}
⚖️ *सत्यापित कांटा वजन*: *${weight} kg* (Digital Scale OCR Verified)
💰 *कुल भुगतान चुकता*: *₹${Number(amount).toLocaleString('en-IN')}* (${payMethod})
----------------------------------------
🌿 *पर्यावरण एवं हरित प्रभाव (Green Impact)*:
- ${co2Saved} kg CO₂ उत्सर्जन की रोकथाम
- ${leadSaved} kg विषैले सीसे का भूजल में रिसाव रोका
${badgeIcon} *कलेक्टर बैज दर्जा*: ${badgeName}
----------------------------------------
📜 *CPCB ई-कचरा (प्रबंधन) नियम 2022 नियम 19 डिजिटल घोषणा पत्र*
असमंजस रहित पारदर्शी व्यापार | भारत सरकार मान्यता प्राप्त पोर्टल`;
  } else if (language === 'mr') {
    return `♻️ *कबाडीवाला कनेक्ट - अधिकृत डिजिटल ई-कचरा पावती* ♻️
----------------------------------------
🧾 *पावती क्रमांक*: ${lotId}
📅 *दिनांक*: ${new Date().toLocaleDateString('en-IN')}

👤 *कलेक्टर*: ${collector}
🏢 *रीसायकलर कारखाना*: ${recycler}
📦 *साहित्य प्रकार*: ${category}
⚖️ *तपासलेले वजन*: *${weight} kg* (OCR Scale Verified)
💰 *एकूण पेमेंट पूर्ण*: *₹${Number(amount).toLocaleString('en-IN')}* (${payMethod})
----------------------------------------
🌿 *पर्यावरण प्रभाव*:
- ${co2Saved} kg CO₂ उत्सर्जन वाचवले
- ${leadSaved} kg विषारी लेड थांबवले
${badgeIcon} *कलेक्टर बॅज*: ${badgeName}
----------------------------------------
📜 *CPCB नियम १९ अंतर्गत डिजिटल पावती*`;
  }

  return `♻️ *KABADIWALA CONNECT - OFFICIAL E-WASTE DIGITAL RECEIPT* ♻️
----------------------------------------
🧾 *Receipt ID*: ${lotId}
📅 *Date*: ${new Date().toLocaleDateString('en-IN')}

👤 *Collector*: ${collector}
🏢 *Recycler Facility*: ${recycler}
📦 *Material Category*: ${category}
⚖️ *Verified Weight*: *${weight} kg* (Digital Scale OCR Audited)
💰 *Total Payment Settled*: *₹${Number(amount).toLocaleString('en-IN')}* (${payMethod})
----------------------------------------
🌿 *Environmental Impact*:
- ${co2Saved} kg CO₂ Emissions Prevented
- ${leadSaved} kg Toxic Heavy Metals Diverted
${badgeIcon} *Collector Badge Level*: ${badgeName}
----------------------------------------
📜 *CPCB Rule 19 Digital Compliance Manifest*
Kabadiwala Connect - Digitizing India's Informal Recycling Ecosystem`;
};

interface WhatsAppReceiptButtonProps {
  lot?: any;
  handover?: any;
  collectorTotalWeight?: number;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  className?: string;
  label?: string;
}

export const WhatsAppReceiptButton: React.FC<WhatsAppReceiptButtonProps> = ({
  lot,
  handover,
  collectorTotalWeight = 180,
  variant = 'primary',
  className = '',
  label
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppReceiptText({
      lot,
      handover,
      collectorTotalWeight,
      language
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    showToast(
      language === 'hi' 
        ? '📲 व्हाट्सएप पर रसीद भेजी जा रही है!' 
        : language === 'mr'
        ? '📲 व्हॉट्सअॅपवर पावती पाठवली जात आहे!'
        : '📲 Opening WhatsApp with transaction receipt slip...', 
      'success'
    );
  };

  const defaultText = label || (
    language === 'hi'
      ? '📲 व्हाट्सएप पर रसीद भेजें (WhatsApp Receipt)'
      : language === 'mr'
      ? '📲 व्हॉट्सअॅपवर पावती पाठवा'
      : '📲 Send WhatsApp Vernacular Receipt'
  );

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleShareWhatsApp}
        className={`p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow active:scale-95 transition-all ${className}`}
        title="Share WhatsApp Receipt"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={handleShareWhatsApp}
        className={`px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-black rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${className}`}
      >
        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>{defaultText}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShareWhatsApp}
      className={`px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ${className}`}
    >
      <MessageSquare className="w-4 h-4" />
      <span>{defaultText}</span>
    </button>
  );
};
