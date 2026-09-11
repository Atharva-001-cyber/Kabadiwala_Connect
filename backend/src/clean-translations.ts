import fs from 'fs';
import path from 'path';

const transPath = path.resolve(__dirname, '../../frontend/src/i18n/translations.ts');
let content = fs.readFileSync(transPath, 'utf8');

// 1. Add statusLabels and helpers if not present
if (!content.includes('export const statusLabels')) {
  const statusLabelsCode = `
export const statusLabels: Record<string, { hi: string; mr: string; en: string }> = {
  // Lot & Traceability Statuses
  CREATED: { hi: 'नया लॉट', mr: 'नवीन लॉट', en: 'Created' },
  OFFER_RECEIVED: { hi: 'ऑफर प्राप्त', mr: 'ऑफर प्राप्त', en: 'Offer Received' },
  ACCEPTED: { hi: 'स्वीकृत', mr: 'स्वीकृत', en: 'Accepted' },
  PICKUP_SCHEDULED: { hi: 'पिकअप निर्धारित', mr: 'पिकअप नियोजित', en: 'Pickup Scheduled' },
  PICKED_UP: { hi: 'पिकअप संपन्न', mr: 'पिकअप पूर्ण', en: 'Picked Up' },
  RECEIVED: { hi: 'फैक्ट्री पहुंचा', mr: 'कारखान्यात प्राप्त', en: 'Received' },
  SORTED: { hi: 'वर्गीकृत', mr: 'वर्गीकृत', en: 'Sorted' },
  PROCESSING: { hi: 'प्रोसेसिंग जारी', mr: 'प्रक्रिया सुरू', en: 'In Processing' },
  RECOVERED: { hi: 'धातु पुनर्प्राप्त', mr: 'धातू पुनर्प्राप्त', en: 'Metals Recovered' },
  RECYCLED: { hi: 'रीसायकल पूर्ण', mr: 'रीसायकल पूर्ण', en: '100% Recycled' },
  CANCELLED: { hi: 'रद्द', mr: 'रद्द', en: 'Cancelled' },

  // Pickup Statuses
  SCHEDULED: { hi: 'शेड्यूल किया गया', mr: 'नियोजित', en: 'Scheduled' },
  IN_TRANSIT: { hi: 'वाहन रास्ते में है', mr: 'वाहन मार्गावर आहे', en: 'In Transit' },
  COMPLETED: { hi: 'सत्यापित व संपन्न', mr: 'सत्यापित व पूर्ण', en: 'Completed' },

  // Anomaly & Dispute Statuses
  OPEN: { hi: 'समीक्षाधीन', mr: 'पुनरावलोकनात', en: 'Open' },
  UNDER_REVIEW: { hi: 'जांच जारी', mr: 'तपासणी सुरू', en: 'Under Review' },
  RESOLVED: { hi: 'निस्तारित', mr: 'निकाली', en: 'Resolved' },
  DISMISSED: { hi: 'खारिज', mr: 'फेटाळलेले', en: 'Dismissed' },
  REJECTED: { hi: 'अस्वीकृत', mr: 'नाकारले', en: 'Rejected' },
  ESCALATED: { hi: 'उच्च स्तर पर प्रेषित', mr: 'वरिष्ठ स्तरावर वर्ग', en: 'Escalated' }
};

export const getStatusLabel = (status: string, lang: Language): string => {
  return statusLabels[status]?.[lang] || status;
};

export const getCategoryLabel = (category: string, lang: Language): string => {
  return (categoryLabels as any)[category]?.[lang] || category;
};
`;

  content = content.replace('export const translations = {', `${statusLabelsCode}\nexport const translations = {`);
}

// 2. Remove all English bracketed suffixes in Hindi and Marathi sections
const replacements = [
  // Brackets
  [/\(Direct Uplift\)/g, ''],
  [/\(Active Delivery\):/g, ':'],
  [/\(Collector Lifecycle Journey\):/g, ':'],
  [/\(Tap to Act\)/g, ''],
  [/\(Direct Recycler Fair Price Uplift\)/g, ''],
  [/\(Local Middleman\)/g, ''],
  [/\(CPCB Recycler\)/g, ''],
  [/\(Extra Income\)/g, ''],
  [/\(Recent Scrap Lots\)/g, ''],
  [/\(Add First Lot\)/g, ''],
  [/\(AI Classification\)/g, ''],
  [/\(AI Prediction\)/g, ''],
  [/\(Intact\)/g, ''],
  [/\(Damaged\)/g, ''],
  [/\(Dismantled\)/g, ''],
  [/\(Household\)/g, ''],
  [/\(Commercial\)/g, ''],
  [/\(Repair Shop\)/g, ''],
  [/\(Scrap Heap\)/g, ''],
  [/\(Take Photo\)/g, ''],
  [/\(Digital Lot Created\)/g, ''],
  [/\(Lot ID\):/g, ':'],
  [/\(Material\):/g, ':'],
  [/\(Weight\):/g, ':'],
  [/\(Add Another Lot\)/g, ''],
  [/\(Estimated Value\)/g, ''],
  [/\(Recycler Quote\)/g, ''],
  [/\(Final Sale Value\)/g, ''],
  [/\(Observed Trend\)/g, ''],
  [/\(Compare & Select Offer\)/g, ''],
  [/\(Best Price\)/g, ''],
  [/\(Fastest Pickup\)/g, ''],
  [/\(Doorstep Pickup\)/g, ''],
  [/\(Self Delivery\)/g, ''],
  [/\(Confirm & Accept\)/g, ''],
  [/\(Ranking Factors\)/g, ''],
  [/\(Fair Price Margin Uplift\):/g, ':'],
  [/\(Benchmark Model • Field Validation Required\)/g, ''],
  [/\(Model Uplift\):/g, ':'],
  [/\(Transaction Vouchers\)/g, ''],
  [/\(Cash on Handover\)/g, ''],
  [/\(Instant UPI\)/g, ''],
  [/\(Judge Guide\)/g, ''],
  [/\(Local Simulator Mode\)/g, ''],
  [/'कबाड़ीवाला \(कलेक्टर\)'/g, "'कबाड़ीवाला'"],
  [/'कबाडीवाला \(कलेक्टर\)'/g, "'कबाडीवाला'"],
  [/'कलेक्टर \(Collector\)'/g, "'कलेक्टर'"]
];

replacements.forEach(([pattern, repl]) => {
  content = content.replace(pattern, repl as string);
});

// Also add upliftLabel if not present
if (!content.includes('upliftLabel:')) {
  content = content.replace(
    "slogan: 'सही दाम, पारदर्शी बहीखाता, स्वच्छ पर्यावरण',",
    "slogan: 'सही दाम, पारदर्शी बहीखाता, स्वच्छ पर्यावरण',\n    upliftLabel: 'अधिक लाभ',"
  );
  content = content.replace(
    "slogan: 'वाजवी दर, पारदर्शक हिशोब, स्वच्छ पर्यावरण',",
    "slogan: 'वाजवी दर, पारदर्शक हिशोब, स्वच्छ पर्यावरण',\n    upliftLabel: 'जास्त नफा',"
  );
  content = content.replace(
    "slogan: 'Fair Prices, Transparent Ledger, Clean Environment',",
    "slogan: 'Fair Prices, Transparent Ledger, Clean Environment',\n    upliftLabel: 'Uplift',"
  );
}

fs.writeFileSync(transPath, content, 'utf8');
console.log('translations.ts updated successfully with statusLabels and pure HI/MR translations.');
