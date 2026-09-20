import { Language, MaterialCategory } from '../types';

export const categoryLabels: Record<MaterialCategory, { hi: string; mr: string; en: string; icon: string; desc: string }> = {
  PCB: {
    hi: 'पीसीबी / सर्किट बोर्ड',
    mr: 'पीसीबी / सर्किट बोर्ड',
    en: 'PCB / Circuit Boards',
    icon: 'Cpu',
    desc: 'Motherboards, RAM, Computer cards, TV boards'
  },
  BATTERY: {
    hi: 'बैटरी / लिथियम सेल',
    mr: 'बॅटरी / लिथियम सेल',
    en: 'Batteries / Li-ion',
    icon: 'BatteryCharging',
    desc: 'Laptop batteries, UPS lead-acid, phone cells'
  },
  CRT: {
    hi: 'सीआरटी मॉनिटर / टीवी',
    mr: 'सीआरटी मॉनिटर / टीव्ही',
    en: 'CRT Monitors / TVs',
    icon: 'Tv',
    desc: 'Old cathode ray tube monitors & heavy TVs'
  },
  LCD: {
    hi: 'एलसीडी / एलईडी स्क्रीन',
    mr: 'एलसीडी / एलईडी स्क्रीन',
    en: 'LCD / Flat Screens',
    icon: 'Monitor',
    desc: 'Flat TV screens, laptop displays, monitors'
  },
  CABLE: {
    hi: 'कॉपर तार / केबल',
    mr: 'कॉपर वायर / केबल',
    en: 'Copper Cables / Wire',
    icon: 'Cable',
    desc: 'Insulated copper power cords & wiring'
  },
  MOTOR: {
    hi: 'इलेक्ट्रिक मोटर',
    mr: 'इलेक्ट्रिक मोटर',
    en: 'Electric Motors',
    icon: 'Zap',
    desc: 'Washing machine, fan, appliance copper motors'
  },
  MAGNET: {
    hi: 'मैग्नेट असेंबली',
    mr: 'चुंबक असेंब्ली',
    en: 'Magnets / Assemblies',
    icon: 'Magnet',
    desc: 'Neodymium hard drive magnets, speakers'
  },
  MIXED_PLASTIC: {
    hi: 'ई-वेस्ट प्लास्टिक बॉडी',
    mr: 'ई-कचरा प्लॅस्टिक बॉडी',
    en: 'E-Waste Plastic Body',
    icon: 'Layers',
    desc: 'Computer/printer outer ABS plastic chassis'
  }
};


export const statusLabels: Record<string, { hi: string; mr: string; en: string }> = {
  // Lot & Traceability Statuses
  CREATED: { hi: 'नया लॉट', mr: 'नवीन लॉट', en: 'Created' },
  OFFER_RECEIVED: { hi: 'ऑफर प्राप्त', mr: 'ऑफर प्राप्त', en: 'Offer Received' },
  ACCEPTED: { hi: 'स्वीकृत', mr: 'स्वीकृत', en: 'Accepted' },
  PICKUP_SCHEDULED: { hi: 'पिकअप निर्धारित', mr: 'पिकअप नियोजित', en: 'Pickup Scheduled' },
  PICKED_UP: { hi: 'पिकअप संपन्न', mr: 'पिकअप पूर्ण', en: 'Picked Up' },
  RECEIVED: { hi: 'फैक्ट्री पहुंचा', mr: 'कारखान्यात प्राप्त', en: 'Received' },
  RECYCLER_RECEIVED: { hi: 'वेयरहाउस में प्राप्त', mr: 'वेअरहाऊसमध्ये प्राप्त', en: 'Warehouse Received' },
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
  // Recycler Authorization Statuses
  AUTHORIZED: { hi: 'अधिकृत', mr: 'अधिकृत', en: 'Authorized' },
  PENDING_VERIFICATION: { hi: 'सत्यापन लंबित', mr: 'पडताळणी प्रलंबित', en: 'Pending Verification' },
  SUSPENDED: { hi: 'निलंबित', mr: 'निलंबित', en: 'Suspended' },
  REJECTED: { hi: 'अस्वीकृत', mr: 'नाकारले', en: 'Rejected' },
  ESCALATED: { hi: 'उच्च स्तर पर प्रेषित', mr: 'वरिष्ठ स्तरावर वर्ग', en: 'Escalated' }
};

export const getStatusLabel = (status: string, lang: Language): string => {
  return statusLabels[status]?.[lang] || status;
};

export const getCategoryLabel = (category: string, lang: Language): string => {
  if (!category) return '';
  const directObj = (categoryLabels as any)[category];
  if (directObj && directObj[lang]) return directObj[lang];

  const upper = category.toUpperCase();
  if (upper.includes('PCB')) return categoryLabels.PCB[lang] || category;
  if (upper.includes('BATT') || upper.includes('LI-ION') || upper.includes('CELL')) return categoryLabels.BATTERY[lang] || category;
  if (upper.includes('CRT')) return categoryLabels.CRT[lang] || category;
  if (upper.includes('LCD') || upper.includes('SCREEN') || upper.includes('PANEL')) return categoryLabels.LCD[lang] || category;
  if (upper.includes('CABLE') || upper.includes('COPPER') || upper.includes('WIRE')) return categoryLabels.CABLE[lang] || category;
  if (upper.includes('MOTOR')) return categoryLabels.MOTOR[lang] || category;
  if (upper.includes('MAGNET')) return categoryLabels.MAGNET[lang] || category;
  if (upper.includes('PLASTIC') || upper.includes('MIXED')) return categoryLabels.MIXED_PLASTIC[lang] || category;

  return category;
};

export const formatUserDisplayName = (name?: string, role: string = 'COLLECTOR', lang: Language = 'hi'): string => {
  if (!name || name === 'Authorized Collector' || name === 'Collector') {
    return lang === 'hi' ? 'अधिकृत कलेक्टर' : lang === 'mr' ? 'अधिकृत संकलक' : 'Authorized Collector';
  }
  if (name.startsWith('Kabadiwala ')) {
    const num = name.replace('Kabadiwala ', '');
    return lang === 'hi' ? `कबाड़ीवाला ${num}` : lang === 'mr' ? `कबाडीवाला ${num}` : name;
  }
  if (name === 'Recycler Facility') {
    return lang === 'hi' ? 'अधिकृत रीसाइक्लिंग केंद्र' : lang === 'mr' ? 'अधिकृत रिसायकलिंग केंद्र' : 'Recycler Facility';
  }
  if (name === 'Regulatory Officer' || name === 'Admin') {
    return lang === 'hi' ? 'नियामक अधिकारी' : lang === 'mr' ? 'नियामक अधिकारी' : 'Regulatory Officer';
  }
  if (name === 'Bmn' || name === 'bmn' || name === 'BMN') {
    return lang === 'hi' ? 'बीएमएन' : lang === 'mr' ? 'बीएमएन' : 'Bmn';
  }
  if (name === 'Ramesh Kumar') {
    return lang === 'hi' ? 'रमेश कुमार' : lang === 'mr' ? 'रमेश कुमार' : 'Ramesh Kumar';
  }
  if (name === 'Sunita Sharma') {
    return lang === 'hi' ? 'सुनीता शर्मा' : lang === 'mr' ? 'सुनिता शर्मा' : 'Sunita Sharma';
  }
  if (name.includes('Mayank') || name.includes('mayank') || name.includes('Mayank Gaur') || name.includes('mayank gaur')) {
    return lang === 'hi' ? 'मयंक गौर' : lang === 'mr' ? 'मयंक गौर' : name;
  }
  if (name === 'Arun Bhatia' || name === 'Arun') {
    return lang === 'hi' ? 'अरुण भाटिया' : lang === 'mr' ? 'अरुण भाटीया' : 'Arun Bhatia';
  }
  if (name === 'Balak' || name === 'balak') {
    return lang === 'hi' ? 'बालक' : lang === 'mr' ? 'बालक' : 'Balak';
  }
  if (name === 'Sanklap' || name === 'Sankalp' || name === 'sanklap' || name === 'sankalp') {
    return lang === 'hi' ? 'संकल्प' : lang === 'mr' ? 'संकल्प' : 'Sankalp';
  }
  if (name === 'Atharva' || name === 'atharva') {
    return lang === 'hi' ? 'अथर्व' : lang === 'mr' ? 'अथर्व' : 'Atharva';
  }
  if (name === 'Avinash' || name === 'avinash') {
    return lang === 'hi' ? 'अविनाश' : lang === 'mr' ? 'अविनाश' : 'Avinash';
  }
  if (name === 'Rahul' || name === 'rahul') {
    return lang === 'hi' ? 'राहुल' : lang === 'mr' ? 'राहुल' : 'Rahul';
  }
  if (name === 'Priya' || name === 'priya') {
    return lang === 'hi' ? 'प्रिया' : lang === 'mr' ? 'प्रिया' : 'Priya';
  }
  if (name === 'Amit' || name === 'amit') {
    return lang === 'hi' ? 'अमित' : lang === 'mr' ? 'अमित' : 'Amit';
  }
  if (name === 'Vikram' || name === 'vikram') {
    return lang === 'hi' ? 'विक्रम' : lang === 'mr' ? 'विक्रम' : 'Vikram';
  }
  if (name === 'Suresh' || name === 'suresh') {
    return lang === 'hi' ? 'सुरेश' : lang === 'mr' ? 'सुरेश' : 'Suresh';
  }
  if (name === 'Rajesh' || name === 'rajesh') {
    return lang === 'hi' ? 'राजेश' : lang === 'mr' ? 'राजेश' : 'Rajesh';
  }
  if (name === 'Mohan Singh' || name === 'mohan singh') {
    return lang === 'hi' ? 'मोहन सिंह' : lang === 'mr' ? 'मोहन सिंग' : 'Mohan Singh';
  }
  if (name === 'Suresh Patil' || name === 'suresh patil') {
    return lang === 'hi' ? 'सुरेश पाटिल' : lang === 'mr' ? 'सुरेश पाटील' : 'Suresh Patil';
  }
  if (name === 'kaalu' || name === 'Kaalu' || name === 'kalu') {
    return lang === 'hi' ? 'कालू' : lang === 'mr' ? 'कालू' : 'Kaalu';
  }
  if (name === 'ABS' || name === 'abs') {
    return lang === 'hi' ? 'एबीएस' : lang === 'mr' ? 'एबीएस' : 'ABS';
  }
  if (name === 'Deepak' || name === 'deepak') {
    return lang === 'hi' ? 'दीपक' : lang === 'mr' ? 'दीपक' : 'Deepak';
  }
  if (name.includes('CPCB E-Waste Officer') || name.includes('CPCB Officer') || name.includes('CPCB Admin')) {
    return lang === 'hi' ? 'CPCB ई-वेस्ट अधिकारी' : lang === 'mr' ? 'CPCB ई-कचरा अधिकारी' : name;
  }
  if (name.includes('Avadh Green Tech')) {
    return lang === 'hi' ? 'अवध ग्रीन टेक एग्रीगेटर्स' : lang === 'mr' ? 'अवध ग्रीन टेक ॲग्रिगेटर्स' : name;
  }
  if (name.includes('GreenEarth')) {
    return lang === 'hi' ? 'ग्रीनअर्थ ई-वेस्ट सॉल्यूशंस प्रा. लि.' : lang === 'mr' ? 'ग्रीनअर्थ ई-कचरा सोल्यूशन्स प्रा. लि.' : name;
  }
  if (name.includes('ABC E-Waste') || name.includes('ABC Recycling') || name.includes('ABC') || name.includes('एबीसी') || name.includes('ABC ई-वेस्ट') || name.includes('ABC ई-कचरा')) {
    return lang === 'hi' ? 'एबीसी ई-वेस्ट रीसायकलिंग प्रा. लि.' : lang === 'mr' ? 'एबीसी ई-कचरा रीसायकलिंग प्रा. लि.' : 'ABC E-Waste Recycling Pvt Ltd';
  }
  if (name.includes('EcoClean') || name.includes('इकोक्लीन')) {
    return lang === 'hi' ? 'इकोक्लीन रीसाइकलर्स इंडिया प्रा. लि.' : lang === 'mr' ? 'इकोक्लीन रिसायकलर्स इंडिया प्रा. लि.' : 'EcoClean Recyclers India Pvt Ltd';
  }
  if (name.includes('EcoMetals')) {
    return lang === 'hi' ? 'इकोमेटल्स रीसाइक्लिंग यूनिट' : lang === 'mr' ? 'इकोमेटल्स रिसायकलिंग युनिट' : name;
  }
  if (name.includes('Apex') || name.includes('apex')) {
    return lang === 'hi' ? 'एपेक्स स्क्रैप डिस्मैंटलर्स' : lang === 'mr' ? 'ॲपेक्स स्क्रॅप डिस्मँटलर्स' : name;
  }
  if (name === 'Authorized Recycler' || name === 'authorized recycler') {
    return lang === 'hi' ? 'अधिकृत रीसायकलिंग प्लांट' : lang === 'mr' ? 'अधिकृत रिसायकलिंग प्लांट' : name;
  }
  if (name === 'Ook' || name === 'ook') {
    return lang === 'hi' ? 'उक रीसाइक्लिंग केंद्र' : lang === 'mr' ? 'उक रिसायकलिंग केंद्र' : name;
  }
  if (name.includes('Atharva Ranjan') || name.includes('Atharva Soni') || name.includes('atharva ranjan')) {
    return lang === 'hi' ? 'अथर्व रंजन सोनी' : lang === 'mr' ? 'अथर्व रंजन सोनी' : name;
  }
  if (name.includes('Recycling Facility') || name.includes('Recycler Facility')) {
    const phone = name.match(/\d+/)?.[0] || '';
    return lang === 'hi'
      ? `रीसाइक्लिंग केंद्र${phone ? ` (${phone})` : ''}`
      : lang === 'mr'
      ? `रिसायकलिंग केंद्र${phone ? ` (${phone})` : ''}`
      : name;
  }

  // Dynamic Devanagari Transliteration Fallback for Any Latin English Name
  if (lang !== 'en') {
    const isHi = lang === 'hi';
    let str = name;
    str = str
      .replace(/E-Waste|E-waste|e-waste|E-WASTE/g, 'ई-कचरा')
      .replace(/Authorization|authorization|AUTHORIZATION/g, 'प्राधिकरण')
      .replace(/Authorized Recycler|authorized recycler/gi, isHi ? 'अधिकृत रीसायकलर' : 'अधिकृत रिसायकलर')
      .replace(/Authorized|authorized|AUTHORIZED/g, 'अधिकृत')
      .replace(/Recycler|recycler|RECYCLER/g, isHi ? 'रीसायकलर' : 'रिसायकलर')
      .replace(/Recycling|recycling|RECYCLING/g, isHi ? 'रीसायकलिंग' : 'रिसायकलिंग')
      .replace(/Dismantlers|dismantlers/gi, isHi ? 'डिस्मैंटलर्स' : 'डिस्मँटलर्स')
      .replace(/Dismantler|dismantler/gi, isHi ? 'डिस्मैंटलर' : 'डिस्मँटल')
      .replace(/Scrap|scrap/gi, isHi ? 'स्क्रैप' : 'स्क्रॅप')
      .replace(/Facility|facility/gi, 'सुविधा')
      .replace(/Plant|plant/gi, 'प्लांट')
      .replace(/Center|center/gi, 'केंद्र')
      .replace(/Hub|hub/gi, 'हब')
      .replace(/Solutions|solutions/gi, isHi ? 'सॉल्यूशंस' : 'सोल्यूशन्स')
      .replace(/Services|services/gi, isHi ? 'सर्विसेज' : 'सर्व्हिसेस')
      .replace(/Aggregators|aggregators/gi, isHi ? 'एग्रीगेटर्स' : 'ॲग्रिगेटर्स')
      .replace(/Aggregator|aggregator/gi, isHi ? 'एग्रीगेटर' : 'ॲग्रिगेटर')
      .replace(/Enterprises|enterprises/gi, isHi ? 'एंटरप्राइज' : 'एन्टरप्रायजेस')
      .replace(/Enterprise|enterprise/gi, isHi ? 'एंटरप्राइज' : 'एन्टरप्राइज')
      .replace(/Traders|traders/gi, isHi ? 'ट्रेडर्स' : 'ट्रेडर्स')
      .replace(/Trader|trader/gi, isHi ? 'ट्रेडर' : 'ट्रेडर')
      .replace(/Pvt Ltd|pvt ltd/gi, 'प्रा. लि.')
      .replace(/Private Limited|private limited/gi, 'प्राईवेट लिमिटेड')
      .replace(/Ltd|ltd/gi, 'लि.')
      .replace(/Corporation|corporation/gi, 'कॉर्पोरेशन')
      .replace(/Apex|apex/gi, isHi ? 'एपेक्स' : 'ॲपेक्स')
      .replace(/Ook|ook/gi, 'उक')
      .replace(/Bmn|bmn|BMN/g, 'बीएमएन')
      .replace(/Mayank Gaur|mayank gaur/gi, 'मयंक गौर')
      .replace(/Mayank|mayank/gi, 'मयंक')
      .replace(/Gaur|gaur/gi, 'गौर')
      .replace(/Atharva Ranjan Soni/gi, 'अथर्व रंजन सोनी')
      .replace(/Atharva/gi, 'अथर्व')
      .replace(/Ranjan/gi, 'रंजन')
      .replace(/Soni/gi, 'सोनी');

    if (!isHi) {
      // In Marathi, convert Hindi spelling of recycler to Marathi spelling
      str = str
        .replace(/रीसायकलर|रीसाइक्लर/g, 'रिसायकलर')
        .replace(/रीसायकलिंग|रीसाइक्लिंग/g, 'रिसायकलिंग');
    }

    // Universal phonetic transliteration for any unmapped English Latin names
    if (/[a-zA-Z]/.test(str)) {
      str = str.split(' ').map(w => {
        if (!/[a-zA-Z]/.test(w)) return w;
        if (w === 'Bmn' || w === 'bmn' || w === 'BMN') return 'बीएमएन';
        return w
          .replace(/sh/gi, 'श').replace(/ch/gi, 'च').replace(/th/gi, 'थ').replace(/dh/gi, 'ध')
          .replace(/bh/gi, 'भ').replace(/gh/gi, 'घ').replace(/kh/gi, 'ख').replace(/ph/gi, 'फ')
          .replace(/zh/gi, 'झ').replace(/ee/gi, 'ी').replace(/oo/gi, 'ू').replace(/ai/gi, 'ै')
          .replace(/au/gi, 'ौ').replace(/ou/gi, 'ौ').replace(/ea/gi, 'ी').replace(/ay/gi, 'े')
          .replace(/aa/gi, 'ा')
          .replace(/a/gi, 'ा').replace(/e/gi, 'े').replace(/i/gi, 'ि').replace(/o/gi, 'ो').replace(/u/gi, 'ु')
          .replace(/b/gi, 'ब').replace(/c/gi, 'क').replace(/d/gi, 'द').replace(/f/gi, 'फ')
          .replace(/g/gi, 'ग').replace(/h/gi, 'ह').replace(/j/gi, 'ज').replace(/k/gi, 'क')
          .replace(/l/gi, 'ल').replace(/m/gi, 'म').replace(/n/gi, 'न').replace(/p/gi, 'प')
          .replace(/q/gi, 'क').replace(/r/gi, 'र').replace(/s/gi, 'स').replace(/t/gi, 'त')
          .replace(/v/gi, 'व').replace(/w/gi, 'व').replace(/x/gi, 'क्स').replace(/y/gi, 'य')
          .replace(/z/gi, 'ज');
      }).join(' ');
    }

    return str;
  }

  return name;
};

export const getConditionLabel = (condition: string, lang: Language = 'hi'): string => {
  if (!condition) return '';
  if (lang === 'en') {
    const upper = condition.toUpperCase().trim();
    if (upper === 'INTACT') return 'Intact';
    if (upper === 'DAMAGED') return 'Damaged';
    if (upper === 'DISMANTLED') return 'Dismantled';
    if (upper === 'MIXED') return 'Mixed';
    return condition;
  }
  const upper = condition.toUpperCase().trim();
  const map: Record<string, { hi: string; mr: string }> = {
    'INTACT': { hi: 'सुरक्षित / सही स्थिति', mr: 'सुरक्षित / उत्तम स्थिती' },
    'DAMAGED': { hi: 'क्षतिग्रस्त / टूटा हुआ', mr: 'क्षतिग्रस्त / तुटलेले' },
    'DISMANTLED': { hi: 'खुला हुआ / विघटित', mr: 'वेगळे केलेले' },
    'MIXED': { hi: 'मिश्रित अवस्था', mr: 'मिश्रित अवस्था' },
    'SCRAP': { hi: 'पुराना स्क्रैप', mr: 'भंगार स्क्रॅप' }
  };
  return map[upper]?.[lang] || condition;
};

export const formatLotDescription = (
  desc?: string,
  weight?: number,
  category?: string,
  lang: Language = 'hi'
): string => {
  if (!desc) return '';
  if (lang === 'en') return desc;

  const match = desc.match(/e-waste scrap lot containing\s*(\d+(?:\.\d+)?)\s*kg of\s*(.*)/i);
  if (match) {
    const w = match[1] || weight || '';
    const rawCat = match[2]?.trim() || category || '';
    const catLabel = getCategoryLabel(rawCat, lang);
    const unit = lang === 'hi' ? 'किग्रा' : 'किग्रॅ';

    if (lang === 'hi') {
      return `${catLabel} का ${w} ${unit} ई-कचरा स्क्रैप लॉट`;
    } else {
      return `${catLabel} चा ${w} ${unit} ई-कचरा स्क्रॅप लॉट`;
    }
  }

  let str = desc;
  const unit = lang === 'hi' ? 'किग्रा' : 'किग्रॅ';

  str = str
    .replace(/E-waste scrap lot containing/gi, lang === 'hi' ? 'ई-कचरा स्क्रैप लॉट जिसमें है' : 'ई-कचरा स्क्रॅप लॉट ज्यामध्ये आहे')
    .replace(/\bkg of\b/gi, `${unit} `)
    .replace(/\bkg\b/gi, unit)
    .replace(/\bPCB\b/gi, getCategoryLabel('PCB', lang))
    .replace(/\bBATTERY\b/gi, getCategoryLabel('BATTERY', lang))
    .replace(/\bCRT\b/gi, getCategoryLabel('CRT', lang))
    .replace(/\bLCD\b/gi, getCategoryLabel('LCD', lang));

  return str;
};

export const formatAddressLocation = (address?: string, lang: Language = 'hi'): string => {
  if (!address) return '';
  if (lang === 'en') return address;

  let str = address;

  if (str.toLowerCase().includes('abhay tent house')) {
    return lang === 'hi' ? 'अभय टेंट हाउस' : 'अभय टेंट हाऊस';
  }

  // General Token and Phrase Substitutions for Indian Address Devanagari Translation
  str = str
    .replace(/Industrial Cluster|Industrial cluster/gi, 'औद्योगिक क्लस्टर')
    .replace(/\bIndustrial Area\b/gi, 'औद्योगिक क्षेत्र')
    .replace(/\bCluster\b/gi, 'क्लस्टर')
    .replace(/\bPlot\b/gi, 'प्लॉट')
    .replace(/\bUPSIDC Industrial Area\b/gi, 'UPSIDC औद्योगिक क्षेत्र')
    .replace(/\bAmausi\b/gi, 'अमौसी')
    .replace(/\bNadarganj\b/gi, 'नादरगंज')
    .replace(/\bFlat\b/gi, lang === 'hi' ? 'फ्लैट' : 'फ्लॅट')
    .replace(/\bRoyal Residence\b/gi, lang === 'hi' ? 'रॉयल रेजीडेंसी' : 'रॉयल रेसिडेन्सी')
    .replace(/\bHouse\b/gi, lang === 'hi' ? 'मकान' : 'घर')
    .replace(/\bWard\b/gi, lang === 'hi' ? 'वार्ड' : 'प्रभाग')
    .replace(/\bBlock\b/gi, 'ब्लॉक')
    .replace(/\bSector\b/gi, 'सेक्टर')
    .replace(/\bRoad\b/gi, 'रोड')
    .replace(/\bStreet\b/gi, lang === 'hi' ? 'स्ट्रीट' : 'रस्ता')
    .replace(/\bSociety\b/gi, 'सोसाइटी')
    .replace(/\bApartment\b/gi, 'अपार्टमेंट')
    .replace(/\bGomti Nagar\b/gi, 'गोमती नगर')
    .replace(/\bAliganj\b/gi, 'अलीगंज')
    .replace(/\bHazratganj\b/gi, 'हजरतगंज')
    .replace(/\bIndira Nagar\b/gi, 'इंदिरा नगर')
    .replace(/\bUttar Pradesh\b/gi, 'उत्तर प्रदेश')
    .replace(/\bMaharashtra\b/gi, 'महाराष्ट्र')
    .replace(/\bKarnataka\b/gi, 'कर्नाटक')
    .replace(/\bDelhi \/ NCR\b/gi, 'दिल्ली / एनसीआर')
    .replace(/\bLucknow\b/gi, 'लखनऊ')
    .replace(/\bKanpur\b/gi, 'कानपुर')
    .replace(/\bVaranasi\b/gi, 'वाराणसी')
    .replace(/\bAgra\b/gi, 'आगरा')
    .replace(/\bNoida\b/gi, 'नोएडा')
    .replace(/\bGhaziabad\b/gi, 'गाजियाबाद')
    .replace(/\bGorakhpur\b/gi, 'गोरखपुर')
    .replace(/\bPrayagraj\b/gi, 'प्रयागराज')
    .replace(/\bPune\b/gi, 'पुणे')
    .replace(/\bNagpur\b/gi, lang === 'hi' ? 'नागपुर' : 'नागपूर')
    .replace(/\bMumbai\b/gi, 'मुंबई')
    .replace(/\bDelhi\b/gi, 'दिल्ली')
    .replace(/\bBengaluru\b/gi, lang === 'hi' ? 'बेंगलुरु' : 'बेंगळुरू')
    .replace(/Location on record/gi, lang === 'hi' ? 'ऑन रिकॉर्ड स्थान' : 'नोंदणीकृत स्थान');

  // Deduplicate consecutive identical city tokens (e.g. लखनऊ, लखनऊ -> लखनऊ)
  str = str.replace(/लखनऊ,\s*लखनऊ/g, 'लखनऊ')
           .replace(/पुणे,\s*पुणे/g, 'पुणे')
           .replace(/नागपुर,\s*नागपुर/g, 'नागपुर')
           .replace(/नागपूर,\s*नागपूर/g, 'नागपूर')
           .replace(/मुंबई,\s*मुंबई/g, 'मुंबई')
           .replace(/दिल्ली,\s*दिल्ली/g, 'दिल्ली');

  return str;
};

export const formatAnomalyDescription = (desc?: string, lang: Language = 'hi'): string => {
  if (!desc) return '';
  if (lang === 'en') return desc;

  const isHi = lang === 'hi';
  const unit = isHi ? 'किग्रा' : 'किग्रॅ';

  let str = desc;

  // 1. Electronic Scale Tare Discrepancy / Variance
  str = str
    .replace(/Electronic Scale Tare Discrepancy:\s*Intake weighment\s*\(([\d.,]+)\s*kg\)\s*,?\s*declared weight\s*\(([\d.,]+)\s*kg\)\s*deviates by\s*([+-\d.,]+)\s*kg\s*\(([^)]+)\)\.\s*Electronic load cell recalibration required\./gi,
      isHi 
        ? 'इलेक्ट्रॉनिक कांटा वजन अंतर: इनटेक वजन ($1 किग्रा), घोषित वजन ($2 किग्रा) से $3 किग्रा ($4) भिन्न है। इलेक्ट्रॉनिक लोड सेल रीकैलिब्रेशन आवश्यक है।'
        : 'इलेक्ट्रॉनिक काटा वजन तफावत: इनटेक वजन ($1 किग्रॅ), घोषित वजनापेक्षा ($2 किग्रॅ) $3 किग्रॅ ($4) भिन्न आहे. इलेक्ट्रॉनिक लोड सेल रिकॅलिब्रेशन आवश्यक आहे.')
    .replace(/Electronic Scale Tare Discrepancy:\s*Intake weighment\s*\(([\d.,]+)\s*kg\)\s*,?\s*from declared weight\s*\(([\d.,]+)\s*kg\)\s*deviates by\s*([+-\d.,]+)\s*kg\s*\(([^)]+)\)\.\s*Electronic load cell recalibration required\./gi,
      isHi 
        ? 'इलेक्ट्रॉनिक कांटा वजन अंतर: इनटेक वजन ($1 किग्रा), घोषित वजन ($2 किग्रा) से $3 किग्रा ($4) भिन्न है। इलेक्ट्रॉनिक लोड सेल रीकैलिब्रेशन आवश्यक है।'
        : 'इलेक्ट्रॉनिक काटा वजन तफावत: इनटेक वजन ($1 किग्रॅ), घोषित वजनापेक्षा ($2 किग्रॅ) $3 किग्रॅ ($4) भिन्न आहे. इलेक्ट्रॉनिक लोड सेल रिकॅलिब्रेशन आवश्यक आहे.');

  // 2. Price Outlier Audit
  str = str.replace(
    /Observed market rate\s*₹([\d.,]+)\/kg\s*for\s*(.*?)\s*in\s*(.*?)\s*deviates by\s*([+-\d.,%]+)\s*from central CPCB benchmark\s*\(₹([\d.,]+)\/kg\)\.\s*Flagged for artificial price inflation audit\./gi,
    (match, rate, mat, loc, dev, bench) => {
      const locName = formatAddressLocation(loc.trim(), lang);
      const matName = getCategoryLabel(mat.trim(), lang);
      return isHi
        ? `${locName} में ${matName} के लिए देखा गया बाजार भाव ₹${rate}/किग्रा, केंद्रीय CPCB बेंचमार्क (₹${bench}/किग्रा) से ${dev} भिन्न है। कृत्रिम मूल्य वृद्धि ऑडिट के लिए फ्लैग किया गया।`
        : `${locName}मध्ये ${matName} साठी दर्शविलेला बाजार दर ₹${rate}/किग्रॅ, केंद्रीय CPCB बेंचमार्कपेक्षा (₹${bench}/किग्रॅ) ${dev} भिन्न आहे. कृत्रिम दर वाढ ऑडिटसाठी चिन्हांकित.`;
    }
  );

  // 3. Computer Vision Quality Audit (MobileNet)
  str = str.replace(
    /Computer Vision Quality Audit:\s*MobileNet image classifier detected non-electronic domestic contamination\s*\(([^)]+)\)\s*mixed inside lot intake stream\./gi,
    (match, contam) => {
      return isHi
        ? `कंप्यूटर विजन गुणवत्ता ऑडिट: मोबाइलनेट इमेज क्लासिफायर ने लॉट इनटेक फोटो में गैर-ई-कचरा घरेलू संदूषण (${contam}) का पता लगाया। मैन्युअल छंटाई निरीक्षण की सिफारिश की जाती है।`
        : `संगणक व्हिजन गुणवत्ता ऑडिट: मोबाईलनेट इमेज क्लासिफायरने लॉट इनटेक फोटोंमध्ये गैर-ई-कचरा घरगुती दूषित घटक (${contam}) शोधले. मॅन्युअल वर्गीकरण तपासणीची शिफारस.`;
    }
  );

  // 4. Regulatory Compliance Violation
  str = str.replace(
    /Regulatory Compliance Violation:\s*Suspended facility\s*"(.*?)"\s*\((.*?)\)\s*attempted scrap lot bidding during active license revocation period\./gi,
    (match, fac, reg) => {
      const facName = formatUserDisplayName(fac, 'RECYCLER', lang);
      return isHi
        ? `नियामक अनुपालन उल्लंघन: निलंबित सुविधा "${facName}" (${reg}) ने सक्रिय लाइसेंस रद्दीकरण अवधि के दौरान स्क्रैप लॉट बोली लगाने का प्रयास किया।`
        : `नियमावली अनुपालन उल्लंघन: निलंबित सुविधा "${facName}" (${reg}) ने परवाना रद्द कालावधीत स्क्रॅप लॉट बोली लावण्याचा प्रयत्न केला.`;
    }
  );

  // 5. Scale Zero-Tare Drift
  str = str.replace(
    /Scale Zero-Tare Drift:\s*Digital load cell reported pre-intake zero-tare drift of\s*([+-\d.,]+)\s*kg\s*before container placement in\s*(.*?)\s*cluster\.\s*Recalibrated against test weights\./gi,
    (match, drift, loc) => {
      const locName = formatAddressLocation(loc.trim(), lang);
      return isHi
        ? `कांटा शून्य-टेयर ड्रिफ्ट: डिजिटल लोड सेल ने ${locName} क्लस्टर में कंटेनर रखने से पहले ${drift} किग्रा का प्री-इंटेक शून्य-टेयर ड्रिफ्ट दर्ज किया। परीक्षण वजन के साथ पुनर्कैलिब्रेट किया गया।`
        : `काटा शून्य-टेअर ड्रिफ्ट: डिजिटल लोड सेलने ${locName} क्लस्टरमध्ये कंटेनर ठेवण्यापूर्वी ${drift} किग्रॅ चा झिरो-टेअर ड्रिफ्ट नोंदवला. चाचणी वजनासह पुनर्कैलिब्रेट केले.`;
    }
  );

  // Token Fallback replacements for dynamic descriptions
  str = str
    .replace(/Electronic Scale Tare Discrepancy:/gi, isHi ? 'इलेक्ट्रॉनिक कांटा वजन अंतर:' : 'इलेक्ट्रॉनिक काटा वजन तफावत:')
    .replace(/Computer Vision Quality Audit:/gi, isHi ? 'कंप्यूटर विजन गुणवत्ता ऑडिट:' : 'संगणक व्हिजन गुणवत्ता ऑडिट:')
    .replace(/Regulatory Compliance Violation:/gi, isHi ? 'नियामक अनुपालन उल्लंघन:' : 'नियमावली अनुपालन उल्लंघन:')
    .replace(/Scale Zero-Tare Drift:/gi, isHi ? 'कांटा शून्य-टेयर ड्रिफ्ट:' : 'काटा शून्य-टेअर ड्रिफ्ट:')
    .replace(/MobileNet image classifier detected/gi, isHi ? 'मोबाइलनेट इमेज क्लासिफायर ने पता लगाया' : 'मोबाईलनेट इमेज क्लासिफायरने शोधले')
    .replace(/non-electronic domestic contamination/gi, isHi ? 'गैर-ई-कचरा घरेलू संदूषण' : 'गैर-ई-कचरा घरगुती दूषित घटक')
    .replace(/plastic beverage containers & packaging waste/gi, isHi ? 'प्लास्टिक पेय कंटेनर और पैकेजिंग कचरा' : 'प्लॅस्टिक पेय कंटेनर आणि पॅकेजिंग कचरा')
    .replace(/mixed inside lot intake stream/gi, isHi ? 'लॉट इनटेक फोटो में मिश्रित' : 'लॉट इनटेक प्रवाहात मिश्रित')
    .replace(/Suspended facility/gi, isHi ? 'निलंबित सुविधा' : 'निलंबित सुविधा')
    .replace(/attempted scrap lot bidding during active license revocation period/gi, isHi ? 'ने लाइसेंस रद्दीकरण अवधि में बोली लगाने का प्रयास किया' : 'ने परवाना रद्द कालावधीत बोली लावण्याचा प्रयत्न केला')
    .replace(/Digital load cell reported/gi, isHi ? 'डिजिटल लोड सेल ने दर्ज किया' : 'डिजिटल लोड सेलने नोंदवले')
    .replace(/pre-intake zero[- ]tare drift(?: of)?/gi, isHi ? 'प्री-इंटेक शून्य-टेयर ड्रिफ्ट' : 'प्री-इंटेक झिरो-टेअर ड्रिफ्ट')
    .replace(/Scale tare auto-zero calibration routine executed and verified against standard 20kg test weight\./gi, isHi ? 'कांटा टेयर ऑटो-जीरो कैलिब्रेशन रूटीन निष्पादित किया गया और मानक 20 किग्रा टेस्ट वेट से सत्यापित हुआ।' : 'काटा टेअर ऑटो-झिरो कॅलिब्रेशन रूटीन कार्यान्वित केले आणि मानक 20 किग्रॅ टेस्ट वेटसह पडताळले.')
    .replace(/Scale tare auto-zero calibration routine executed and verified/gi, isHi ? 'कांटा टेयर ऑटो-जीरो कैलिब्रेशन निष्पादित और सत्यापित' : 'काटा टेअर ऑटो-झिरो कॅलिब्रेशन कार्यान्वित आणि पडताळले')
    .replace(/Minor Rate Variance:/gi, isHi ? 'मामूली दर अंतर:' : 'किरकोळ दर फरक:')
    .replace(/Rate requested/gi, isHi ? 'अनुरोधित दर' : 'विनंती केलेला दर')
    .replace(/vs 7-day regional moving average/gi, isHi ? 'बनाम 7-दिवसीय क्षेत्रीय सचल औसत' : 'विरुद्ध 7-दिवसांचे प्रादेशिक बदलणारे सरासरी')
    .replace(/Rate variance within acceptable regional market fluctuation threshold \(±5%\)\. Cleared by Admin\./gi, isHi ? 'दर अंतर स्वीकार्य क्षेत्रीय बाजार उतार-चढ़ाव सीमा (±5%) के भीतर। एडमिन द्वारा स्वीकृत।' : 'दर फरक स्वीकार्य प्रादेशिक बाजार चढ-उतार मर्यादेत (±5%). ॲडमिनद्वारे मंजूर.')
    .replace(/before container placement in/gi, isHi ? 'कंटेनर रखने से पहले' : 'कंटेनर ठेवण्यापूर्वी')
    .replace(/Recalibrated against test weights\./gi, isHi ? 'परीक्षण वजन के साथ पुनर्कैलिब्रेट किया गया।' : 'चाचणी वजनासह पुनर्कैलिब्रेट केले.')
    .replace(/Intake weighment/gi, isHi ? 'इनटेक वजन' : 'इनटेक वजन')
    .replace(/deviates by/gi, isHi ? 'भिन्न है' : 'भिन्न आहे')
    .replace(/from declared weight/gi, isHi ? 'घोषित वजन से' : 'घोषित वजनापेक्षा')
    .replace(/Electronic load cell recalibration required\./gi, isHi ? 'इलेक्ट्रॉनिक लोड सेल रीकैलिब्रेशन आवश्यक है।' : 'इलेक्ट्रॉनिक लोड सेल रिकॅलिब्रेशन आवश्यक आहे.')
    .replace(/Observed market rate/gi, isHi ? 'देखा गया बाजार भाव' : 'दर्शविलेला बाजार दर')
    .replace(/from central CPCB benchmark/gi, isHi ? 'केंद्रीय CPCB बेंचमार्क से' : 'केंद्रीय CPCB बेंचमार्कपेक्षा')
    .replace(/Flagged for artificial price inflation audit\./gi, isHi ? 'कृत्रिम मूल्य वृद्धि ऑडिट के लिए फ्लैग किया गया।' : 'कृत्रिम दर वाढ ऑडिटसाठी चिन्हांकित.')
    .replace(/Printed Circuit Boards \(PCB\)/gi, isHi ? 'प्रिंटेड सर्किट बोर्ड (PCB)' : 'प्रिंटेड सर्किट बोर्ड (PCB)')
    .replace(/Printed Circuit Boards/gi, isHi ? 'प्रिंटेड सर्किट बोर्ड' : 'प्रिंटेड सर्किट बोर्ड')
    .replace(/Circuit Boards \(PCB\)/gi, isHi ? 'सर्किट बोर्ड (PCB)' : 'सर्किट बोर्ड (PCB)')
    .replace(/Circuit Boards/gi, isHi ? 'सर्किट बोर्ड' : 'सर्किट बोर्ड')
    .replace(/\bLucknow\b/gi, 'लखनऊ')
    .replace(/\bPune\b/gi, 'पुणे')
    .replace(/\bDelhi\b/gi, 'दिल्ली')
    .replace(/\bMumbai\b/gi, 'मुंबई')
    .replace(/\bkg\b/gi, unit);

  return str;
};

export const formatLocalizedDateTime = (dateStr?: string | Date, lang: Language = 'hi'): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  let formatted = d.toLocaleString(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN', options);

  if (lang === 'hi') {
    formatted = formatted.replace(/\bpm\b/gi, 'अपराह्न').replace(/\bam\b/gi, 'पूर्वाह्न');
  } else if (lang === 'mr') {
    formatted = formatted.replace(/\bpm\b/gi, 'संध्याकाळी').replace(/\bam\b/gi, 'सकाळी');
  }
  return formatted;
};

export const formatDisputeReason = (reason?: string, lang: Language = 'hi'): string => {
  if (!reason) return '';
  if (lang === 'en') return reason;

  const isHi = lang === 'hi';
  const unit = isHi ? 'किग्रा' : 'किग्रॅ';

  let str = reason;
  str = str
    .replace(/Container Tare Deduction Variance & Payout Reconciliation/gi,
      isHi ? 'कंटेनर टियर कटौती अंतर एवं भुगतान समाधान' : 'कंटेनर टियर कपात तफावत आणि देयक जुळवणी')
    .replace(/Container Tare Deduction Variance/gi,
      isHi ? 'कंटेनर टियर कटौती अंतर' : 'कंटेनर टियर कपात तफावत')
    .replace(/PCB Grade-A vs Mixed Plastics/gi,
      isHi ? 'पीसीबी ग्रेड-ए बनाम मिश्रित प्लास्टिक' : 'पीसीबी ग्रेड-ए विरुद्ध मिश्रित प्लॅस्टिक')
    .replace(/Market Rate Volatility & Tare Discrepancy/gi,
      isHi ? 'बाजार दर में उतार-चढ़ाव और वजन अंतर' : 'बाजार दरातील चढ-उतार आणि वजन तफावत')
    .replace(/Material Grading Reclassification Dispute\s*\(([^)]+)\)/gi,
      isHi ? 'सामग्री ग्रेडिंग पुनर्वर्गीकरण विवाद ($1)' : 'सामग्री ग्रेडिंग पुनर्वर्गीकरण विवाद ($1)')
    .replace(/Material Grading Reclassification Dispute/gi,
      isHi ? 'सामग्री ग्रेडिंग पुनर्वर्गीकरण विवाद' : 'सामग्री ग्रेडिंग पुनर्वर्गीकरण विवाद')
    .replace(/Instant Bank UPI Payout Timeliness & Transaction Reconciliation/gi,
      isHi ? 'तत्काल बैंक यूपीआई भुगतान समयबद्धता एवं लेनदेन समाधान' : 'तत्काळ बँक यूपीआय देयक वेळेवर वितरण आणि व्यवहार जुळवणी')
    .replace(/Electronic Scale Tare Weighment Variance\s*\(([^)]+)\)/gi,
      isHi ? 'इलेक्ट्रॉनिक कांटा वजन अंतर ($1)' : 'इलेक्ट्रॉनिक काटा वजन तफावत ($1)')
    .replace(/Electronic Scale Tare Weighment Variance/gi,
      isHi ? 'इलेक्ट्रॉनिक कांटा वजन अंतर' : 'इलेक्ट्रॉनिक काटा वजन तफावत')
    .replace(/Electronic Scale Tare Discrepancy/gi,
      isHi ? 'इलेक्ट्रॉनिक कांटा वजन विसंगति' : 'इलेक्ट्रॉनिक काटा वजन तफावत')
    .replace(/Market Price Differential \/ Outlier/gi,
      isHi ? 'बाजार मूल्य अंतर / आउटलायर' : 'बाजार भाव तफावत / आउटलायर')
    .replace(/Escrow Payout Delay/gi,
      isHi ? 'एस्क्रो भुगतान में देरी' : 'एस्क्रो देयक विलंब')
    .replace(/Material Grade Classification Audit/gi,
      isHi ? 'सामग्री श्रेणी वर्गीकरण ऑडिट' : 'सामग्री श्रेणी वर्गीकरण ऑडिट')
    .replace(/discrepancy/gi, isHi ? 'अंतर' : 'तफावत')
    .replace(/\bkg\b/gi, unit);

  return str;
};

export const formatDisputeDetails = (details?: string, lang: Language = 'hi'): string => {
  if (!details) return '';
  if (lang === 'en') return details;

  const isHi = lang === 'hi';
  const unit = isHi ? 'किग्रा' : 'किग्रॅ';

  let str = details;

  str = str
    // 1. Container Tare Deduction Variance & Payout Reconciliation
    .replace(/Clarification requested on digital platform scale tare allowance for corrugated container packaging\.\s*Electronic load cell recalibrated and digital voucher settled on site\./gi,
      isHi
        ? 'नालीदार कंटेनर पैकेजिंग के लिए डिजिटल प्लेटफॉर्म कांटा टेयर छूट पर स्पष्टीकरण का अनुरोध। इलेक्ट्रॉनिक लोड सेल री-कैलिब्रेट किया गया और डिजिटल वाउचर मौके पर निपटाया गया।'
        : 'नालीदार कंटेनर पॅकेजिंगसाठी डिजिटल प्लॅटफॉर्म काटा टेअर सवलतीवर स्पष्टीकरणाची विनंती. इलेक्ट्रॉनिक लोड सेल पुन्हा कॅलिब्रेट केला आणि डिजिटल व्हाऊचर जागेवरच मिटवले.')

    .replace(/Clarification requested on digital platform scale tare offset value for high-density container packaging\.\s*Load cell re-calibrated and digital voucher re-issued on-site\./gi,
      isHi
        ? 'उच्च घनत्व कंटेनर पैकेजिंग के लिए डिजिटल प्लेटफॉर्म तराजू टेयर ऑफसेट मान पर स्पष्टीकरण का अनुरोध। लोड सेल री-कैलिब्रेट किया गया और डिजिटल वाउचर मौके पर जारी किया गया।'
        : 'उच्च घनता कंटेनर पॅकेजिंगसाठी डिजिटल प्लॅटफॉर्म काटा टेअर ऑफसेट मूल्यावर स्पष्टीकरणाची विनंती. लोड सेल पुन्हा कॅलिब्रेट केला आणि डिजिटल व्हाऊचर जागेवरच जारी केले.')

    .replace(/Arbitration Verdict:\s*Digital scale load cell calibration record re-certified compliant with Legal Metrology Act standards\.\s*Waiver settlement credited with express digital voucher\./gi,
      isHi
        ? 'मध्यस्थता निर्णय: डिजिटल तराजू लोड सेल कैलिब्रेशन रिकॉर्ड विधिक माप विज्ञान अधिनियम मानकों के अनुरूप पुनः प्रमाणित। छूट निपटारा एक्सप्रेस डिजिटल वाउचर से जमा।'
        : 'लवाद निर्णय: डिजिटल काटा लोड सेल कॅलिब्रेशन नोंद कायदेशीर मापनशास्त्र कायदा मानकांनुसार पुन्हा प्रमाणित. सवलत तडजोड एक्सप्रेस डिजिटल व्हाऊचरने जमा.')

    .replace(/Classified as high-grade printed circuit board\s*\(([^)]+)\),\s*but recycler marked as mixed plastics on physical inspection\./gi,
      isHi
        ? 'उच्च-ग्रेड प्रिंटेड सर्किट बोर्ड ($1) के रूप में वर्गीकृत, लेकिन रीसाइक्लर ने भौतिक निरीक्षण पर मिश्रित प्लास्टिक के रूप में चिह्नित किया।'
        : 'उच्च-ग्रेड प्रिंटेड सर्किट बोर्ड ($1) म्हणून वर्गीकृत, परंतु रिसायकलर्सने प्रत्यक्ष तपासणीत मिश्रित प्लॅस्टिक म्हणून नोंदवले.')

    // 2. Material Grading Reclassification Dispute Details
    .replace(/Collector submitted lot under high-grade telecom circuit boards\s*\(([^)]+)\)\.\s*Recycler facility downgraded\s*([\d.,%]+)\s*of the batch to mixed plastic body scrap on physical receipt\.\s*Mediation requested on rate differential\./gi,
      isHi
        ? 'कलेक्टर ने उच्च-ग्रेड टेलीकॉम सर्किट बोर्ड ($1) के तहत लॉट जमा किया। रीसाइक्लिंग केंद्र ने भौतिक प्राप्ति पर बैच के $2 भाग को मिश्रित प्लास्टिक बॉडी स्क्रैप में डाउनग्रेड कर दिया। दर अंतर पर मध्यस्थता का अनुरोध।'
        : 'संकलकाने उच्च-ग्रेड टेलिकॉम सर्किट बोर्ड ($1) अंतर्गत लॉट जमा केला. रिसायकलिंग केंद्राने प्रत्यक्ष प्राप्तीवर बॅचच्या $2 भाग मिश्रित प्लॅस्टिक बॉडी स्क्रॅपमध्ये श्रेणीबद्ध केला. दर फरकावर लवादाची विनंती.')

    // 3. Instant Bank UPI Payout Delay Details
    .replace(/Instant UPI payout of\s*₹([\d.,]+)\s*delayed by banking server timeout during intake handover\.\s*Collector reported pending transaction\./gi,
      isHi
        ? 'हैंडओवर के दौरान बैंकिंग सर्वर टाइमआउट के कारण ₹$1 के तत्काल यूपीआई भुगतान में देरी हुई। कलेक्टर ने लंबित लेनदेन की सूचना दी।'
        : 'हँडओव्हरदरम्यान बँक सर्व्हर टाइमआउटमुळे ₹$1 च्या तत्काळ यूपीआय देयकात विलंब झाला. संकलकाने प्रलंबित व्यवहाराची नोंद केली.')

    // 4. Escrow Gateway Reconciled RRN Notes
    .replace(/Escrow Gateway Reconciled:\s*Transaction RRN\s*#?([\d\w]+)\s*verified successful(?:\s*via bank webhook)?\.\s*Collector bank account credited in full\./gi,
      isHi
        ? 'एस्क्रो गेटवे रीकंसाइल्ड: बैंक वेबहुक के माध्यम से लेनदेन आरआरएन #$1 सफल सत्यापित। कलेक्टर बैंक खाते में पूरा पैसा जमा किया गया।'
        : 'एस्क्रो गेटवे जुळवणी: बँक वेबहुकद्वारे व्यवहार आरआरएन #$1 यशस्वी सत्यापित. संकलक बँक खात्यात पूर्ण रक्कम जमा.')

    // 5. Exact Scale Tare Discrepancy details matcher
    .replace(/Collector claims declared lot weighment was\s*([\d.,]+)\s*kg,\s*but facility intake electronic platform registered net\s*([\d.,]+)\s*kg after heavy bag tare deduction\s*\(([^)]+)\)\.\s*Requesting CPCB tare verification\./gi,
      isHi
        ? 'कलेक्टर का दावा है कि घोषित लॉट वजन $1 किग्रा था, लेकिन संयंत्र इलेक्ट्रॉनिक कांटे ने बोरा टियर कटौती ($3) के बाद शुद्ध $2 किग्रा दर्ज किया। सीपीसीबी कांटा सत्यापन का अनुरोध।'
        : 'संकलकाचा असा दावा आहे की घोषित लॉट वजन $1 किग्रॅ होते, परंतु सुविधा इलेक्ट्रॉनिक काट्याने पोते टियर कपातीनंतर ($3) निव्वळ $2 किग्रॅ नोंदवले. सीपीसीबी काटा पडताळणीची विनंती.')

    .replace(/CPCB Legal Metrology Mediation:\s*Digital load cell calibration record certified compliant with standards\.\s*Mutual settlement confirmed\./gi,
      isHi
        ? 'सीपीसीबी विधिक माप विज्ञान मध्यस्थता: डिजिटल लोड सेल अंशांकन रिकॉर्ड मानकों के अनुरूप प्रमाणित। आपसी सहमति से समाधान की पुष्टि।'
        : 'सीपीसीबी विधिक मापशास्त्र लवाद: डिजिटल लोड सेल कॅलिब्रेशन नोंद मानकांनुसार प्रमाणित. परस्पर संमतीने तोडग्याची पुष्टी.')

    .replace(/Official CPCB Mediation:\s*Digital load cell calibration record certified compliant with Legal Metrology Act standards\.\s*Tare weight adjusted and digital settlement voucher issued\./gi,
      isHi
        ? 'आधिकारिक सीपीसीबी मध्यस्थता: विधिक माप विज्ञान अधिनियम मानकों के अनुरूप डिजिटल लोड सेल अंशांकन प्रमाणित। टियर वजन समायोजित और डिजिटल निपटारा वाउचर जारी।'
        : 'अधिकृत सीपीसीबी लवाद: कायदेशीर मापनशास्त्र कायदा मानकांनुसार डिजिटल लोड सेल कॅलिब्रेशन प्रमाणित. टियर वजन समायोजित आणि डिजिटल तडजोड व्हाऊचर जारी.')

    .replace(/Official CPCB Mediation:\s*Digital load cell calibration record certified compliant with Legal Metrology Act standards\.\s*Mutual settlement confirmed with signed digital voucher\./gi,
      isHi
        ? 'आधिकारिक सीपीसीबी मध्यस्थता: विधिक माप विज्ञान अधिनियम मानकों के अनुरूप डिजिटल लोड सेल अंशांकन रिकॉर्ड प्रमाणित। हस्ताक्षरित डिजिटल वाउचर के साथ आपसी सहमति से समाधान की पुष्टि।'
        : 'अधिकृत सीपीसीबी लवाद: कायदेशीर मापनशास्त्र कायदा मानकांनुसार डिजिटल लोड सेल कॅलिब्रेशन नोंद प्रमाणित. स्वाक्षरी केलेल्या डिजिटल व्हाऊचरसह परस्पर संमतीने तोडग्याची पुष्टी.')

    .replace(/Joint Inspection Audit:\s*Batch re-inspected under optical spectrometry\.\s*Rate differential adjusted according to certified composite assay report\./gi,
      isHi
        ? 'संयुक्त निरीक्षण ऑडिट: ऑप्टिकल स्पेक्ट्रोमेट्री के तहत बैच का पुनः निरीक्षण। प्रमाणित मिश्रित परख रिपोर्ट के अनुसार दर अंतर समायोजित।'
        : 'संयुक्त तपासणी ऑडिट: ऑप्टिकल स्पेक्ट्रोमेट्री अंतर्गत बॅचची पुन्हा तपासणी. प्रमाणित मिश्र चाचणी अहवालानुसार दर तफावत समायोजित.')

    .replace(/Technical Review:\s*Discrepancy within permissible tare tolerance\s*\(([^)]+)\)\.\s*Facility weighment verified accurate and claim dismissed\./gi,
      isHi
        ? 'तकनीकी समीक्षा: विसंगति अनुमेय टियर सहनशीलता ($1) के भीतर है। संयंत्र वजन सटीक सत्यापित और दावा खारिज किया गया।'
        : 'तांत्रिक पुनरावलोकन: तफावत मान्य टियर सहनशीलतेच्या ($1) आत आहे. सुविधा वजन अचूक सत्यापित आणि दावा फेटाळला.')

    // General token matchers for dynamic dispute descriptions
    .replace(/Container Tare Deduction Variance & Payout Reconciliation/gi, isHi ? 'कंटेनर टियर कटौती अंतर एवं भुगतान समाधान' : 'कंटेनर टियर कपात तफावत आणि देयक जुळवणी')
    .replace(/Container Tare Deduction Variance/gi, isHi ? 'कंटेनर टियर कटौती अंतर' : 'कंटेनर टियर कपात तफावत')
    .replace(/Clarification requested on digital platform scale tare allowance for corrugated container packaging\./gi, isHi ? 'नालीदार कंटेनर पैकेजिंग के लिए डिजिटल प्लेटफॉर्म कांटा टेयर छूट पर स्पष्टीकरण का अनुरोध।' : 'नालीदार कंटेनर पॅकेजिंगसाठी डिजिटल प्लॅटफॉर्म काटा टेअर सवलतीवर स्पष्टीकरणाची विनंती.')
    .replace(/Clarification requested on digital platform scale tare offset value for high-density container packaging\./gi, isHi ? 'उच्च घनत्व कंटेनर पैकेजिंग के लिए डिजिटल प्लेटफॉर्म कांटे के टेयर ऑफसेट मान पर स्पष्टीकरण का अनुरोध।' : 'उच्च घनता कंटेनर पॅकेजिंगसाठी डिजिटल प्लॅटफॉर्म काट्याच्या टेअर ऑफसेट मूल्यावर स्पष्टीकरणाची विनंती.')
    .replace(/Clarification requested on/gi, isHi ? 'स्पष्टीकरण का अनुरोध' : 'स्पष्टीकरणाची विनंती')
    .replace(/digital platform scale tare allowance/gi, isHi ? 'डिजिटल प्लेटफॉर्म कांटा टेयर छूट' : 'डिजिटल प्लॅटफॉर्म काटा टेअर सवलत')
    .replace(/digital platform scale tare offset value/gi, isHi ? 'डिजिटल प्लेटफॉर्म कांटा टेयर ऑफसेट मान' : 'डिजिटल प्लॅटफॉर्म काटा टेअर ऑफसेट मूल्य')
    .replace(/digital platform scale/gi, isHi ? 'डिजिटल प्लेटफॉर्म कांटा' : 'डिजिटल प्लॅटफॉर्म काटा')
    .replace(/for corrugated container packaging/gi, isHi ? 'नालीदार कंटेनर पैकेजिंग के लिए' : 'नालीदार कंटेनर पॅकेजिंगसाठी')
    .replace(/for high-density container packaging/gi, isHi ? 'उच्च घनत्व कंटेनर पैकेजिंग के लिए' : 'उच्च घनता कंटेनर पॅकेजिंगसाठी')
    .replace(/Electronic load cell recalibrated and digital voucher settled on site\./gi, isHi ? 'इलेक्ट्रॉनिक लोड सेल री-कैलिब्रेट किया गया और डिजिटल वाउचर मौके पर निपटाया गया।' : 'इलेक्ट्रॉनिक लोड सेल पुन्हा कॅलिब्रेट केला आणि डिजिटल व्हाऊचर जागेवरच मिटवले.')
    .replace(/Load cell re-calibrated and digital voucher re-issued on-site\./gi, isHi ? 'लोड सेल री-कैलिब्रेट किया गया और डिजिटल वाउचर मौके पर जारी किया गया।' : 'लोड सेल पुन्हा कॅलिब्रेट केला आणि डिजिटल व्हाऊचर जागेवरच जारी केले.')
    .replace(/Electronic load cell recalibrated/gi, isHi ? 'इलेक्ट्रॉनिक लोड सेल री-कैलिब्रेट किया गया' : 'इलेक्ट्रॉनिक लोड सेल पुन्हा कॅलिब्रेट केला')
    .replace(/and digital voucher settled on site/gi, isHi ? 'और डिजिटल वाउचर मौके पर निपटाया गया' : 'आणि डिजिटल व्हाऊचर जागेवरच मिटवले')
    .replace(/Arbitration Verdict:/gi, isHi ? 'मध्यस्थता निर्णय:' : 'लवाद निर्णय:')
    .replace(/Official CPCB Mediation:/gi, isHi ? 'आधिकारिक सीपीसीबी मध्यस्थता:' : 'अधिकृत सीपीसीबी लवाद:')
    .replace(/Digital load cell calibration record certified compliant with Legal Metrology Act standards\./gi, isHi ? 'डिजिटल कांटा लोड सेल अंशांकन रिकॉर्ड विधिक माप विज्ञान अधिनियम मानकों के अनुरूप प्रमाणित।' : 'डिजिटल काटा लोड सेल कॅलिब्रेशन नोंद कायदेशीर मापनशास्त्र कायदा मानकांनुसार प्रमाणित.')
    .replace(/Digital load cell calibration record certified compliant with Legal Metrology Act standards/gi, isHi ? 'डिजिटल कांटा लोड सेल अंशांकन रिकॉर्ड विधिक माप विज्ञान अधिनियम मानकों के अनुरूप प्रमाणित' : 'डिजिटल काटा लोड सेल कॅलिब्रेशन नोंद कायदेशीर मापनशास्त्र कायदा मानकांनुसार प्रमाणित')
    .replace(/Mutual settlement confirmed with signed digital voucher\./gi, isHi ? 'हस्ताक्षरित डिजिटल वाउचर के साथ आपसी सहमति से समाधान की पुष्टि।' : 'स्वाक्षरी केलेल्या डिजिटल व्हाऊचरसह परस्पर संमतीने तोडग्याची पुष्टी.')
    .replace(/Mutual settlement confirmed with signed digital voucher/gi, isHi ? 'हस्ताक्षरित डिजिटल वाउचर के साथ आपसी सहमति से समाधान की पुष्टि' : 'स्वाक्षरी केलेल्या डिजिटल व्हाऊचरसह परस्पर संमतीने तोडग्याची पुष्टी')
    .replace(/Mutual settlement confirmed\./gi, isHi ? 'आपसी सहमति से समाधान की पुष्टि।' : 'परस्पर संमतीने तोडग्याची पुष्टी.')
    .replace(/Waiver settlement credited with express digital voucher\./gi, isHi ? 'छूट निपटारा एक्सप्रेस डिजिटल वाउचर से जमा किया गया।' : 'सवलत तडजोड एक्सप्रेस डिजिटल व्हाऊचरने जमा केले.')
    .replace(/Classified as high-grade printed circuit board/gi, isHi ? 'उच्च-ग्रेड प्रिंटेड सर्किट बोर्ड के रूप में वर्गीकृत' : 'उच्च-ग्रेड प्रिंटेड सर्किट बोर्ड म्हणून वर्गीकृत')
    .replace(/but recycler marked as mixed plastics/gi, isHi ? 'लेकिन रीसाइक्लर ने मिश्रित प्लास्टिक के रूप में चिह्नित किया' : 'परंतु रिसायकलर्सने मिश्रित प्लॅस्टिक म्हणून नोंदवले')
    .replace(/on physical inspection\./gi, isHi ? 'भौतिक निरीक्षण पर।' : 'प्रत्यक्ष तपासणीत.')
    .replace(/Collector submitted lot under/gi, isHi ? 'कलेक्टर ने लॉट जमा किया' : 'संकलकाने लॉट जमा केला')
    .replace(/high-grade telecom circuit boards/gi, isHi ? 'उच्च-ग्रेड टेलीकॉम सर्किट बोर्ड' : 'उच्च-ग्रेड टेलिकॉम सर्किट बोर्ड')
    .replace(/Recycler facility downgraded/gi, isHi ? 'रीसाइक्लिंग केंद्र ने डाउनग्रेड किया' : 'रिसायकलिंग केंद्राने श्रेणीबद्ध केले')
    .replace(/of the batch to mixed plastic body scrap on physical receipt\./gi, isHi ? 'बैच को भौतिक प्राप्ति पर मिश्रित प्लास्टिक बॉडी स्क्रैप में।' : 'बॅच प्रत्यक्ष प्राप्तीवर मिश्रित प्लॅस्टिक बॉडी स्क्रॅपमध्ये.')
    .replace(/Mediation requested on rate differential\./gi, isHi ? 'दर अंतर पर मध्यस्थता का अनुरोध।' : 'दर फरकावर लवादाची विनंती.')
    .replace(/Instant UPI payout of/gi, isHi ? 'तत्काल यूपीआई भुगतान' : 'तत्काळ यूपीआय देयक')
    .replace(/delayed by banking server timeout during intake handover\./gi, isHi ? 'हैंडओवर में बैंकिंग सर्वर टाइमआउट के कारण देरी।' : 'हँडओव्हरदरम्यान बँक सर्व्हर टाइमआउटमुळे विलंब.')
    .replace(/Collector reported pending transaction\./gi, isHi ? 'कलेक्टर ने लंबित लेनदेन की सूचना दी।' : 'संकलकाने प्रलंबित व्यवहाराची नोंद केली.')
    .replace(/Escrow Gateway Reconciled:/gi, isHi ? 'एस्क्रो गेटवे रीकंसाइल्ड:' : 'एस्क्रो गेटवे जुळवणी:')
    .replace(/Transaction RRN/gi, isHi ? 'लेनदेन आरआरएन' : 'व्यवहार आरआरएन')
    .replace(/verified successful/gi, isHi ? 'सफल सत्यापित' : 'यशस्वी सत्यापित')
    .replace(/Collector bank account credited in full\./gi, isHi ? 'कलेक्टर बैंक खाते में पूरा पैसा जमा किया गया।' : 'संकलक बँक खात्यात पूर्ण पैसा जमा किया गया।')
    .replace(/Collector claims/gi, isHi ? 'कलेक्टर का दावा है' : 'संकलकाचा दावा आहे')
    .replace(/declared lot weighment was/gi, isHi ? 'घोषित लॉट वजन था' : 'घोषित लॉट वजन होते')
    .replace(/but facility intake electronic platform registered net/gi, isHi ? 'लेकिन संयंत्र कांटा नेट दर्ज हुआ' : 'परंतु सुविधा काटा निव्वळ नोंदवला गेला')
    .replace(/after heavy bag tare deduction/gi, isHi ? 'बोरा टियर कटौती के बाद' : 'पोते टियर कपातीनंतर')
    .replace(/Requesting CPCB tare verification\./gi, isHi ? 'सीपीसीबी कांटा सत्यापन का अनुरोध।' : 'सीपीसीबी काटा पडताळणीची विनंती.')
    .replace(/All e-waste transaction handovers are running smoothly without unresolved discrepancies\./gi,
      isHi ? 'सभी ई-कचरा लेनदेन और हैंडओवर बिना किसी अनसुलझे विवाद के सुचारू रूप से चल रहे हैं।' : 'सर्व ई-कचरा व्यवहार आणि हस्तांतरण कोणत्याही अनसुलझ वादविना सुरळीत सुरू आहेत.')
    .replace(/\bkg\b/gi, unit);

  return str;
};

export const DISTRICT_STATE_MAP: Record<string, string> = {
  'Lucknow': 'Uttar Pradesh',
  'Pune': 'Maharashtra',
  'Nagpur': 'Maharashtra',
  'Delhi NCR': 'Delhi / NCR',
  'Delhi': 'Delhi / NCR',
  'Bengaluru': 'Karnataka',
  'Bangalore': 'Karnataka',
  'Mumbai': 'Maharashtra'
};

export const MANDI_LOCATIONS = [
  { district: 'Lucknow', state: 'Uttar Pradesh' },
  { district: 'Pune', state: 'Maharashtra' },
  { district: 'Nagpur', state: 'Maharashtra' },
  { district: 'Delhi NCR', state: 'Delhi / NCR' },
  { district: 'Bengaluru', state: 'Karnataka' }
] as const;

export const formatLocationString = (district?: string, state?: string, lang: Language = 'hi'): string => {
  const d = district?.trim() || 'Lucknow';
  // Use provided state if non-empty, or resolve from authoritative DISTRICT_STATE_MAP
  const s = (state && state.trim().length > 0) ? state.trim() : DISTRICT_STATE_MAP[d];

  const districtMap: Record<string, { hi: string; mr: string; en: string }> = {
    'Lucknow': { hi: 'लखनऊ', mr: 'लखनऊ', en: 'Lucknow' },
    'Pune': { hi: 'पुणे', mr: 'पुणे', en: 'Pune' },
    'Nagpur': { hi: 'नागपुर', mr: 'नागपूर', en: 'Nagpur' },
    'Delhi NCR': { hi: 'दिल्ली एनसीआर', mr: 'दिल्ली एनसीआर', en: 'Delhi NCR' },
    'Delhi': { hi: 'दिल्ली', mr: 'दिल्ली', en: 'Delhi' },
    'Bengaluru': { hi: 'बेंगलुरु', mr: 'बंगळुरू', en: 'Bengaluru' },
    'Mumbai': { hi: 'मुंबई', mr: 'मुंबई', en: 'Mumbai' }
  };

  const stateMap: Record<string, { hi: string; mr: string; en: string }> = {
    'Uttar Pradesh': { hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश', en: 'Uttar Pradesh' },
    'UP': { hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश', en: 'UP' },
    'Maharashtra': { hi: 'महाराष्ट्र', mr: 'महाराष्ट्र', en: 'Maharashtra' },
    'MH': { hi: 'महाराष्ट्र', mr: 'महाराष्ट्र', en: 'MH' },
    'Delhi': { hi: 'दिल्ली', mr: 'दिल्ली', en: 'Delhi' },
    'Delhi / NCR': { hi: 'दिल्ली / एनसीआर', mr: 'दिल्ली / एनसीआर', en: 'Delhi / NCR' },
    'Delhi NCR': { hi: 'दिल्ली एनसीआर', mr: 'दिल्ली एनसीआर', en: 'Delhi NCR' },
    'Karnataka': { hi: 'कर्नाटक', mr: 'कर्नाटक', en: 'Karnataka' }
  };

  const localizedDistrict = districtMap[d]?.[lang] || d;

  // If no state exists or can be resolved, return only the localized district
  if (!s) {
    return localizedDistrict;
  }

  const localizedState = stateMap[s]?.[lang] || s;
  return `${localizedDistrict}, ${localizedState}`;
};

export const translations = {
  hi: {
    appTitle: 'कबाड़ीवाला कनेक्ट',
    appSubtitle: 'अनौपचारिक कलेक्टर को औपचारिक रीसाइक्लिंग से जोड़ना',
    slogan: 'सही दाम, पक्का हिसाब, स्वच्छ पर्यावरण',
    upliftLabel: 'अधिक लाभ',

    // Auth & Roles
    selectLanguage: 'भाषा चुनें',
    loginTitle: 'कबाड़ीवाला कनेक्ट लॉगिन',
    loginSubtitle: 'डिजिटल मंडी, सुरक्षित भाव और पक्का बहीखाता',
    enterMobile: 'अपना 10-अंकों का मोबाइल नंबर दर्ज करें',
    sendOtp: 'ओटीपी प्राप्त करें',
    enterOtp: '4-अंकों का ओटीपी दर्ज करें',
    verifyOtp: 'लॉगिन करें',
    demoLoginTip: 'डेमो सिम्युलेटर OTP: 1234 ',
    quickDemoUser: 'त्वरित डेमो रोल चुनें:',
    collectorRole: 'कलेक्टर',
    recyclerRole: 'रीसाइक्लर',
    adminRole: 'प्रशासक',
    signOut: 'लॉगआउट',
    loggedInAs: 'लॉग इन हैं:',
    roleConflictNotice: 'भूमिका टकराव',
    roleRegisteredAs: 'यह मोबाइल नंबर पहले से {role} के रूप में पंजीकृत है।',
    switchToPortal: '{role} पोर्टल पर जाएं',
    newUserNotice: 'नया उपयोगकर्ता पंजीकरण',
    fullNameLabel: 'पूरा नाम',
    districtLabel: 'जिला (स्थान)',
    facilityNameLabel: 'रीसाइक्लिंग केंद्र / फर्म का नाम',
    adminPasscodeLabel: 'CPCB मास्टर पासकोड (अनिवार्य)',
    resendOtpIn: 'पुनः OTP भेजें',
    resendOtp: 'OTP पुनः भेजें',

    // Navigation & Layout (Sidebar & Header)
    navDashboard: 'डैशबोर्ड',
    navAddLot: 'ई-वेस्ट जोड़ें',
    navRequests: 'मेरे लॉट व अनुरोध',
    navRecyclers: 'रीसाइक्लर खोजें',
    navPrices: 'दैनिक भाव बोर्ड',
    navTracking: 'ट्रेसिबिलिटी ट्रैकिंग',
    navLedger: 'कमाई व बहीखाता',
    navSafety: 'सुरक्षा नियम',
    navProfile: 'मेरी प्रोफाइल',

    navRecyclerDashboard: 'रीसाइक्लर डैशबोर्ड',
    navIncomingRequests: 'आवक लॉट व बोलियां',
    navPickups: 'पिकअप व वाहन प्रबंधन',
    navHandover: 'कांटा वजन व हैंडओवर',
    navInventory: 'इन्वेंटरी व प्रोसेसिंग',
    navTransactions: 'लेनदेन व फॉर्म-6 प्रमाण',
    navVerification: 'CPCB राजपत्र सत्यापन',
    navFacilityProfile: 'प्लांट प्रोफाइल',

    navAdminDashboard: 'प्रशासन डैशबोर्ड',
    navGeoMap: 'राष्ट्रीय GIS मानचित्र',
    navRecyclerVerify: 'रीसाइक्लर राजपत्र ऑडिट',
    navAnomaly: 'AI विसंगति रडार',
    navDisputes: 'विवाद निवारण केंद्र',
    navDatasets: 'ओपन डेटासेट मैनेजर',

    navSwitchRole: 'भूमिका बदलें',
    activeRoleBadge: 'सक्रिय भूमिका',
    collapseSidebar: 'साइडबार समेटें',
    expandSidebar: 'साइडबार खोलें',
    judgeEvaluationLogin: 'SIH जज मूल्यांकन 1-क्लिक लॉगिन',
    judgeEvaluationDesc: 'सत्यापित डेमो खातों के साथ सीधे किसी भी भूमिका में प्रवेश करें:',
    authCollectorTitle: 'कलेक्टर डिजिटल पहचान',
    authCollectorDesc: 'पारदर्शी भाव, डिजिटल लॉट और सीधा बैंक/कैश भुगतान',
    authRecyclerTitle: 'अधिकृत रीसाइक्लर पोर्टल',
    authRecyclerDesc: 'औद्योगिक ई-कचरा खरीद, पिकअप शेड्यूलिंग और फॉर्म-6 EPR प्रमाण',
    authAdminTitle: 'राष्ट्रीय ई-कचरा नियामक एवं ऑडिट सेल',
    authAdminDesc: 'राज्य प्रदूषण नियंत्रण बोर्ड निगरानी एवं टेलीमेट्री डैशबोर्ड',
    portalCollector: 'कलेक्टर पोर्टल',
    portalRecycler: 'रीसाइक्लर पोर्टल',
    portalAdmin: 'नियामक प्रशासक पोर्टल',

    // Navbar
    judgeGuideBtn: 'जज गाइड ',
    offlineBadge: 'ऑफलाइन',
    syncedBadge: 'क्लाउड सिंक ✓',
    pendingBadge: 'सिंक प्रतीक्षारत',

    // Collector Dashboard
    welcome: 'नमस्ते',
    todaysEarnings: 'आज की कमाई',
    totalEwasteCollected: 'कुल ई-कचरा जमा किया',
    pendingRequests: 'प्रतीक्षारत लॉट',
    quickActions: 'त्वरित कार्य',

    addEwaste: 'ई-वेस्ट जोड़ें',
    addEwasteDesc: 'फोटो खींचकर नया लॉट बनाएं',
    checkPrices: 'आज का भाव देखें',
    checkPricesDesc: 'सभी 8 सामानों के सरकारी रेट',
    findRecycler: 'रीसाइक्लर खोजें',
    findRecyclerDesc: 'पास के अधिकृत खरीदार',
    myRequests: 'मेरे लॉट / अनुरोध',
    myRequestsDesc: 'लॉट की स्थिति और रीसाइक्लर के ऑफर',
    earningsLedger: 'मेरा हिसाब-किताब',
    earningsLedgerDesc: 'दैनिक कमाई और भुगतान पर्ची',
    safetyCenter: 'सुरक्षा मार्गदर्शन',
    safetyCenterDesc: 'खतरनाक कचरे से बचाव के नियम',

    onlineStatus: 'ऑनलाइन',
    offlineStatus: 'ऑफलाइन',
    listenDashboardAudio: 'डैशबोर्ड ऑडियो सुनें',
    voiceUnavailable: 'इस डिवाइस पर हिंदी आवाज उपलब्ध नहीं है।',
    voicePlaying: 'आवाज़ चल रही है...',
    voiceListen: 'सुनें',
    voiceStop: 'रोकें',
    mandiRateTicker: 'दैनिक सरकारी दरें:',
    totalCollectedKg: 'कुल वजन',
    formalChannelBadge: '100% औपचारिक चैनल',

    directFinancialBenefit: 'सीधा आर्थिक लाभ ',
    directFinancialBenefitDesc: 'पारंपरिक बिचौलिए के बजाय सीधे अधिकृत रीसाइक्लर को बेचने पर अतिरिक्त मुनाफा! डिजिटल कांटे पर 100% सही वजन व शून्य परिवहन कटौती।',
    viewPassbookBtn: 'खाता पासबुक देखें',

    activeDeliveryTitle: 'वर्तमान लॉट की स्थिति :',
    statusWaitingOffer: 'रीसाइक्लर से भाव आने की प्रतीक्षा...',
    statusOfferReceived: 'रीसाइक्लर ने खरीद भाव भेजा है।',
    statusOfferAccepted: 'भाव स्वीकृत! पिकअप शेड्यूल हो रहा है।',
    statusPickupScheduled: 'पिकअप वाहन आ रहा है। कांटा पर्ची व OTP तैयार रखें।',
    statusReceived: 'माल वजन सत्यापित हो चुका है। भुगतान पर्ची देखें।',
    statusProcessing: 'अधिकृत प्लांट में सुरक्षित प्रोसेसिंग जारी है।',
    statusRecycled: 'ग्रीन रीसाइक्लिंग व धातु निष्कर्षण पूर्ण।',

    openHandoverOtpBtn: 'हैंडओवर OTP खोलें',
    viewScaleReceiptBtn: 'कांटा रसीद देखें',
    trackStatusBtn: 'स्थिति देखें',

    circularJourneyTitle: 'आपकी 6-चरणीय यात्रा :',
    journeyStep1: '1. फोटो लें',
    journeyStep2: '2. भाव देखें',
    journeyStep3: '3. रीसाइक्लर',
    journeyStep4: '4. पिकअप',
    journeyStep5: '5. भुगतान',
    journeyStep6: '6. रीसाइक्लिंग',

    heroActionsTitle: '⚡ मुख्य कार्य ',
    heroSellTag: '+ नया लॉट',
    heroPriceTag: '8 श्रेणियां',
    heroRecyclerTag: 'सत्यापित',
    heroRequestsTag: 'सक्रिय लॉट',
    heroLedgerTag: 'पासबुक',
    heroSafetyTag: 'नियम',

    fairPriceUpliftTitle: 'पारदर्शी मूल्य लाभ ',
    fairPriceUpliftDesc: 'कबाड़ीवाला कनेक्ट पर सीधे अधिकृत रीसाइक्लर को बेचने पर स्थानीय दलाल के मुकाबले अधिक मुनाफा',
    verifiedMandiRates: 'प्रमाणित मंडी दरें',
    traditionalMiddlemanTitle: 'पारंपरिक स्थानीय दलाल ',
    middlemanTrickNotice: 'वजन में हेराफेरी + कम भाव कटौती',
    platformRecyclerTitle: 'कबाड़ीवाला कनेक्ट ',
    platformAdvantageNotice: 'सत्यापित कांटा + तुरंत नकद रसीद',
    extraIncomeTitle: 'आपकी अतिरिक्त बचत ',
    perKgExtraEarning: 'प्रति किलो अधिक कमाई',

    recentLotsTitle: 'हालिया लॉट स्थिति ',
    viewAllLots: 'सभी देखें',
    noLotsCreatedYet: 'अभी कोई लॉट नहीं बनाया गया है।',
    addFirstLotBtn: '+ पहला लॉट जोड़ें ',
    demoBadge: '🏷️ डेमो',
    liveBadge: '🟢 लाइव',

    // Add Lot Wizard
    takePhoto: 'फोटो खींचे या अपलोड करें',
    aiPredictionTitle: 'एआई पहचान ',
    aiConfirmTip: 'कृपया सुनिश्चित करें कि श्रेणी सही है या नीचे से बदलें',
    materialCategoryLabel: 'ई-वेस्ट की श्रेणी चुनें',
    approxWeightLabel: 'अनुमानित वजन (किलोग्राम)',
    conditionLabel: 'सामान की स्थिति',
    intact: 'साबुत ',
    damaged: 'टूटा-फूटा ',
    dismantled: 'खुला हुआ ',
    sourceLabel: 'सामान का स्रोत',
    household: 'घर से ',
    commercial: 'दुकान/ऑफिस ',
    repairShop: 'रिपेयर शॉप ',
    scrapHeap: 'कबाड़ ढेर ',
    estimatedValueTitle: 'अनुमानित बाजार मूल्य',
    createLotBtn: 'डिजिटल लॉट बनाएं',
    lotCreatedSuccess: 'डिजिटल लॉट सफलतापूर्वक बन गया!',

    step1Photo: '1. फोटो',
    step2Material: '2. सामग्री',
    step3Weight: '3. वजन',
    step4Value: '4. भाव',
    step5Review: '5. समीक्षा',
    nextBtn: 'आगे बढ़ें ➔',
    backBtn: '⬅ पीछे',
    creatingBtn: 'लॉट दर्ज हो रहा है...',
    audioGuidanceBtn: 'निर्देश सुनें',

    wizardSubtitle: 'सरल 5-चरणीय विज़ार्ड: फोटो ➔ सामग्री ➔ वजन ➔ भाव ➔ लॉट निर्माण',
    step1Heading: 'स्क्रैप की फोटो लें ',
    optionalRecommended: 'वैकल्पिक परंतु अनुशंसित',
    retakeCamera: 'कैमरा से दोबारा लें',
    chooseGallery: '🖼️ गैलरी से चुनें',
    takeOrUploadPrompt: 'स्क्रैप की फोटो खींचें या चुनें',
    photoTakenNotice: 'फोटो सफलतापूर्वक ली गई',

    ruleBasedSuggestion: 'नियम-आधारित सुझाव',
    manualConfirmRequired: 'सामग्री सुझाव — पुष्टि आवश्यक',
    enterWeightPrompt: 'अनुमानित वजन दर्ज करें',
    conditionPrompt: 'सामान की स्थिति चुनें',
    sourcePrompt: 'कचरा कहाँ से मिला?',
    benchmarkEstimateNotice: 'यह भाव सरकारी मंडी दर पर आधारित अनुमान है।',

    lotCreatedTitle: 'डिजिटल लॉट पंजीकृत ',
    lotIdLabel: 'आपका डिजिटल लॉट नंबर :',
    materialLabel: 'सामग्री :',
    weightLabel: 'दर्ज वजन :',
    estRangeLabel: 'अनुमानित मूल्य सीमा:',
    viewOffersBtn: 'रीसाइक्लर ऑफर देखें ➔',
    addAnotherLotBtn: '+ एक और लॉट जोड़ें ',

    // Price Board & Discovery
    priceBoardTitle: 'ई-वेस्ट भाव खोज बोर्ड',
    prevailingRate: 'वर्तमान खरीद भाव',
    trend7Days: '7 दिनों का रुझान',
    listenPrice: 'भाव सुनें',
    mandiPrice: 'मंडी भाव',
    calculatorTitle: 'पारदर्शी भाव कैलकुलेटर',
    calcSubtitle: 'वजन और स्थिति के अनुसार तत्काल अनुमानित कमाई की गणना करें',
    enterWeight: 'वजन (किलो)',
    selectCondition: 'सामान की स्थिति',
    estFormula: 'पारदर्शी गणना सूत्र',
    estEarnings: 'अनुमानित कमाई',
    estDisclaimer: 'यह केवल अनुमानित मूल्य है, अंतिम बिक्री कीमत नहीं। अंतिम भुगतान अधिकृत रीसाइक्लर के डिजिटल कांटे पर वास्तविक वजन के बाद होगा।',
    threePriceStagesTitle: 'भाव के 3 स्पष्ट चरण समझें',
    stageEstTitle: '1. अनुमानित मूल्य ',
    stageEstDesc: 'लॉट बनाते समय मंडी दर और वजन पर आधारित प्रारंभिक अनुमान।',
    stageQuoteTitle: '2. खरीदार की बोली ',
    stageQuoteDesc: 'अधिकृत रीसाइक्लर द्वारा आपके सामान के लिए दिया गया औपचारिक ऑफर।',
    stageFinalTitle: '3. अंतिम बिक्री मूल्य ',
    stageFinalDesc: 'भौतिक कांटे पर वजन जांचने के बाद सीधे खाते/कैश में मिलने वाली रसीद राशि।',
    noHistory: 'अभी पर्याप्त भाव डेटा उपलब्ध नहीं है',
    noHistoryDesc: 'जैसे-जैसे इस जिले में नई मंडियों के भाव दर्ज होंगे, वास्तविक इतिहास यहाँ दिखेगा।',
    observedTrend: 'वास्तविक देखा गया रुझान ',
    provenanceLive: '🟢 सत्यापित मंडी भाव',
    provenanceBenchmark: '🟡 सरकारी बेसलाइन',
    provenanceSeed: '🏷️ डेमो संदर्भ',
    recycOffer: 'खरीदार की बोली',
    noRecycOffer: 'अभी खरीदार का ऑफर नहीं है',
    useGpsDistrict: '🛰️ मेरा GPS स्थान उपयोग करें',
    syncStatusCached: '🟡 ऑफलाइन कैश (पूर्व सिंक)',
    syncStatusLive: '🟢 लाइव ऑनलाइन मंडी',

    // Recyclers & Offers
    authorizedTag: 'CPCB अधिकृत',
    distanceKm: 'दूरी',
    freePickup: 'डोरस्टेप पिकअप उपलब्ध',
    makeDeal: 'ऑफर स्वीकार करें',
    offersReceived: 'रीसाइक्लर ऑफर आए हैं',
    matchingTitle: 'रीसाइक्लर खोज व पारदर्शी ऑफर तुलना',
    matchingSubtitle: 'CPCB राष्ट्रीय राजपत्र अधिकृत रीसाइक्लिंग केंद्र एवं पारदर्शी बोली तुलना',
    compareOffersTitle: 'ऑफर तुलना व चयन ',
    bestRateBadge: '🥇 सबसे अधिक भाव ',
    fastestPickupBadge: '⚡ सबसे तेज़ पिकअप ',
    doorstepPickupOption: '🚚 मुफ्त वाहन पिकअप ',
    doorstepPickupDesc: 'रीसाइक्लर का अधिकृत वाहन आपके पास आएगा। परिवहन खर्च शून्य (₹0)।',
    selfDeliveryOption: '🚶 स्वयं डिलीवरी ',
    selfDeliveryDesc: 'आप स्वयं माल केंद्र तक पहुंचाएंगे। (परिवहन खर्च उपलब्ध नहीं - कृपया रीसाइक्लर से बात करें)',
    zeroDeduction: '₹0 परिवहन कटौती',
    transportNotAvail: 'परिवहन खर्च उपलब्ध नहीं',
    requestQuoteBtn: 'ऑफर मंगाएं / भाव तय करें',
    acceptOfferBtn: 'ऑफर स्वीकार करें ',
    mcdaWhyRanked: 'सुझाव स्कोर का आधार ',
    noCompatibleRecycler: 'इस सामग्री के लिए कोई अधिकृत रीसाइक्लर नहीं मिला',
    noCompatibleRecyclerDesc: 'कृपया किसी अन्य सामग्री या निकटवर्ती जिले का चयन करें।',
    offerAcceptSuccess: 'ऑफर सफलतापूर्वक स्वीकार कर लिया गया है! रीसाइक्लर को वाहन पिकअप का अनुरोध भेजा गया।',
    activeLotBanner: 'चयनित लॉट का विवरण',
    searchPlaceholder: 'रीसाइक्लर का नाम या जिला खोजें...',
    allMaterialsTab: 'सभी सामग्रियां',
    sortByScore: 'उच्चतम स्कोर',
    sortByRate: 'सर्वोत्तम भाव',
    sortByDistance: 'निकटतम दूरी',

    // Digital Handover & Tracking
    handoverTitle: 'डिजिटल हैंडओवर पर्ची',
    handoverOtp: 'हैंडओवर ओटीपी',
    actualWeight: 'वास्तविक तुला वजन',
    weightDiff: 'वजन में अंतर',
    trackingTitle: 'ई-वेस्ट यात्रा ट्रैकिंग',
    stepCollected: 'कचरा एकत्र किया',
    stepPickup: 'पिकअप संपन्न',
    stepReceived: 'फैक्ट्री पहुंचा',
    stepProcessing: 'प्रोसेसिंग जारी',
    stepRecycled: 'सफलतापूर्वक रीसायकल',
    scaleWeightPrompt: 'कांटे पर तौला गया वास्तविक वजन दर्ज करें',
    signaturePrompt: 'हैंडओवर हस्ताक्षर / पुष्टि',
    receiptSettled: 'भुगतान बहीखाता में दर्ज हो गया है',
    viewReceiptBtn: 'रसीद व वाउचर देखें',

    // Earnings & Passbook
    ledgerTitle: 'कलेक्टर बहीखाता व पासबुक',
    ledgerSubtitle: 'दैनिक कमाई, डिजिटल वाउचर और नकद रसीदें',
    totalEarningsLabel: 'कुल जीवनकाल कमाई',
    cashEarningsLabel: 'नकद भुगतान',
    ledgerVouchersLabel: 'लेजर वाउचर',
    unitEconomicsTitle: '💡 बिचौलिए के मुकाबले अतिरिक्त आय :',
    unitEconomicsBenchmarkLabel: 'प्रारंभिक आर्थिक मॉडल ',
    informalMiddlemanComparison: 'पारंपरिक स्थानीय कबाड़ दुकान पर यही माल बेचने पर लगभग मिलते (बिचौलिया कटौती एवं कांटा बट्टा अनुमान पर आधारित)।',
    netPocketUpliftLabel: 'सीधा संभावित मुनाफा :',
    voucherReceiptLabel: 'लेन-देन रसीदें ',
    dateLabel: 'दिनांक',
    materialCategory: 'सामग्री',
    ratePerKgLabel: 'दर / किलो',
    totalPaidLabel: 'कुल भुगतान',
    paymentMethodLabel: 'माध्यम',
    digitalLedgerVoucherTag: '📱 लेजर वाउचर दर्ज ✓',
    cashPaidTag: '💵 नकद भुगतान दर्ज ✓',

    // Safety Center
    safetyTitle: 'पर्यावरण व व्यक्तिगत सुरक्षा केंद्र',
    safetySubtitle: 'ई-कचरा प्रबंधन नियम 2022 के अनुसार 8 धाराओं के सुरक्षा दिशानिर्देश',
    safetyNotice: 'अनौपचारिक रूप से तार जलाना या तेजाब से धोना दंडनीय अपराध है।',
    dosTitle: 'क्या करें (सुरक्षित अभ्यास)',
    dontsTitle: 'क्या न करें (सख्त मनाही)',
    ppeNotice: 'दस्ताने, मास्क और भारी जूते अनिवार्य हैं।',
    emergencyHelpTitle: 'आपातकालीन सहायता हेल्पलाइन:',
    readAloudRules: 'सुरक्षा नियम सुनें',

    // Recycler Portal
    recyclerDashboardTitle: 'रीसाइक्लर प्रबंधन पोर्टल',
    incomingRequestsTitle: 'आने वाले स्क्रैप अनुरोध',
    schedulePickupTitle: 'वाहन पिकअप शेड्यूल करें',
    verifyHandoverTitle: 'इलेक्ट्रॉनिक कांटा वजन सत्यापन',
    processInventoryTitle: 'फैक्ट्री रीसाइक्लिंग व इन्वेंट्री',
    greenCertTitle: 'फॉर्म-6 ग्रीन रीसाइक्लिंग प्रमाण पत्र',
    submitBidBtn: 'औपचारिक भाव भेजें',
    enterScaleWeightBtn: 'कांटा वजन दर्ज करें',

    // Admin Portal
    adminDashboardTitle: 'CPCB राष्ट्रीय ई-वेस्ट मॉनिटरिंग',
    kpiTotalLots: 'कुल डिजिटल लॉट',
    kpiTotalWeight: 'एकल ई-कचरा वजन',
    kpiTotalEarnings: 'कलेक्टरों को भुगतान',
    geoMapTitle: 'राष्ट्रीय GIS ई-वेस्ट मानचित्र',
    anomaliesTitle: 'वजन व भाव विसंगति मॉनिटर',
    disputesTitle: 'विवाद समाधान आर्बिट्रेशन',
    datasetsTitle: 'CPCB EPR डेटासेट एक्सपोर्ट',
    exportCsvBtn: 'CSV डाउनलोड करें',
    exportJsonBtn: 'JSON डाउनलोड करें',

    // Sync & Common
    syncedStatus: 'सर्वर से सिंक है',
    offlineSavedStatus: 'फ़ोन में सेव है (इंटरनेट का इंतज़ार)',
    offlineMode: 'ऑफ़लाइन मोड सक्रिय',
    refreshBtn: 'ताज़ा करें',
    closeBtn: 'बंद करें',
    confirmBtn: 'पुष्टि करें',
    cancelBtn: 'रद्द करें',
    loadingText: 'लोड हो रहा है...',
    // Form-6 / Green Certificate
    certHeaderTitle: 'डिजिटल हैंडओवर व रीसाइक्लिंग रिकॉर्ड',
    certHeaderSubtitle: 'आंतरिक विस्तारित उत्पादक उत्तरदायित्व (EPR) ट्रैसेबिलिटी प्रमाण',
    certRegulatoryNotice: 'वैधानिक प्रकटीकरण: यह प्लेटफॉर्म-जनरेटेड डिजिटल रीसाइक्लिंग/हैंडओवर रिकॉर्ड है — आधिकारिक सीपीसीबी प्रमाणपत्र नहीं।',
    certChainOfCustodyTitle: 'ई-कचरा रीसाइक्लिंग चेन ऑफ कस्टडी प्रमाण',
    certAuditRecordId: 'ऑडिट रिकॉर्ड आईडी',
    certDigitalLotId: 'डिजिटल लॉट आईडी',
    certMaterialCategory: 'सामग्री श्रेणी',
    certScaleWeight: 'प्रमाणित तुला वजन',
    certCollector: 'कलेक्टर / कबाड़ीवाला',
    certAuthorizedRecycler: 'अधिकृत रीसाइक्लर',
    certSettledAmount: 'निस्तारित राशि',
    certFormalDeclaration: 'औपचारिक हरित प्रसंस्करण घोषणा:',
    certDeclarationText: 'यह प्रमाणित करता है कि उपरोक्त सामग्री को अनौपचारिक खुले में जलाने और एसिड लीचिंग से सुरक्षित रूप से रोका गया, तथा घोषित एसओपी के अनुसार अधिकृत रीसाइक्लर द्वारा प्राप्त किया गया।',
    certVerifiedTimestamp: 'सत्यापित समय',
    certPlatformSeal: 'प्लेटफॉर्म डिजिटल मुहर',
    certPrintPdf: 'प्रिंट / पीडीएफ सेव करें',

    // Recycler Incoming Lots & Make Offer
    incomingLotsTitle: 'कलेक्टर ई-कचरा लॉट एवं बोलियां',
    incomingLotsSubtitle: 'अनौपचारिक कबाड़ीवालों द्वारा पंजीकृत डिजिटल लॉट देखें और अपनी खरीद दरें प्रस्तुत करें',
    makeOfferBtn: 'भाव कोट करें',
    makeOfferModalTitle: 'रीसाइक्लर कोटेशन प्रस्तुत करें',
    offeredRateLabel: 'प्रति किलोग्राम खरीद दर (₹/किग्रा):',
    estTotalLabel: 'अनुमानित कुल राशि:',
    doorstepPickupQuestion: 'डोरस्टेप पिकअप उपलब्ध कराएंगे?',
    pickupEtaLabel: 'पिकअप समय सीमा:',
    within12Hours: '12 घंटे के भीतर',
    within24Hours: '24 घंटे के भीतर',
    within48Hours: '48 घंटे के भीतर',
    notesToCollector: 'कलेक्टर के लिए निर्देश / टिप्पणी:',
    sendOfferBtn: 'कलेक्टर को ऑफर भेजें',
    submittingOffer: 'ऑफर भेजा जा रहा है...',
    offerSubmittedSuccess: 'कोटेशन सफलतापूर्वक जमा हो गया!',
    noIncomingLots: 'वर्तमान में कोई नया लॉट उपलब्ध नहीं है।',

    // Recycler Processing & Inventory
    inventoryProcessingTitle: 'फैक्ट्री इन्वेंटरी एवं रीसाइक्लिंग चक्र',
    inventoryProcessingSubtitle: 'सामग्री वर्गीकरण, घटक पृथक्करण, दुर्लभ धातु निष्कर्षण एवं 100% औपचारिक रीसाइक्लिंग',
    materialStockTitle: 'फैक्ट्री सामग्री स्टॉक',
    advanceStageTitle: 'रीसाइक्लिंग चरण आगे बढ़ाएं',
    selectLotPrompt: 'प्रक्रिया हेतु लॉट चुनें:',
    nextStagePrompt: 'नया रीसाइक्लिंग चरण:',
    stageWarehouseReceived: '1. वेयरहाउस में प्राप्त',
    stageSorting: '2. घटकों का वर्गीकरण व पृथक्करण',
    stageProcessing: '3. रासायनिक व धातुकर्म निष्कर्षण',
    stageRecovered: '4. दुर्लभ व बहुमूल्य धातुएं पुनर्प्राप्त',
    stageRecycled: '5. 100% औपचारिक रूप से रीसायकल',
    recoveredDetailsLabel: 'पुनर्प्राप्त धातु / आउटपुट विवरण:',
    advanceStageBtn: 'रीसाइक्लिंग स्थिति अपडेट करें',
    updatingStage: 'अपडेट हो रहा है...',
    stageUpdateSuccess: 'लॉट स्थिति सफलतापूर्वक अपडेट हो गई!',
    noProcessingLots: 'वर्तमान में प्रोसेसिंग हेतु कोई लॉट उपलब्ध नहीं है।',

    // Recycler Home
    newIncomingLots: 'नए आगमन लॉट',
    requiresPriceBids: 'कोटेशन आवश्यक',
    pendingPickupsLabel: 'लंबित पिकअप',
    scheduledEnroute: 'शेड्यूल / मार्ग में',
    inProcessingLabel: 'प्रोसेसिंग जारी',
    activeHydrometallurgy: 'सक्रिय शुद्धीकरण',
    totalFormallyRecycled: 'कुल औपचारिक रीसायकल',
    form6Certified: '100% सीपीसीबी फॉर्म-6 प्रमाणित',
    viewNewLotsBtn: 'नए लॉट देखें',
    handoverScaleNav: 'हैंडओवर व कांटा सत्यापन',
    handoverScaleDesc: 'कांटा वजन व ओटीपी सत्यापन',
    processingLifecycleNav: 'प्रोसेसिंग व चक्र',
    processingLifecycleDesc: 'वर्गीकरण ➔ निष्कर्षण ➔ रीसायकल',
    activeLotsInPipeline: 'सक्रिय लॉट सूची',
    schedulePickupBtn: 'पिकअप तय करें',
    updateLifecycleBtn: 'प्रक्रिया अपडेट करें',

    // Admin
    adminRecyclerTitle: 'सीपीसीबी रीसाइक्लर सत्यापन व क्षमता प्रबंधन',
    adminRecyclerSubtitle: 'केंद्रीय व राज्य प्रदूषण नियंत्रण बोर्ड के अंतर्गत पंजीकृत रीसाइक्लर्स का अनुमोदन एवं निलंबन',
    approveLicenseBtn: 'लाइसेंस अनुमोदित करें',
    suspendLicenseBtn: 'निलंबित करें',
    confirmSuspendTitle: 'क्या आप इस रीसाइक्लर को निलंबित करना चाहते हैं?',
    confirmSuspendDesc: 'निलंबन के बाद यह रीसाइक्लर नए ई-कचरे के लिए बोली नहीं लगा सकेगा।',
    confirmApproveTitle: 'क्या आप इस रीसाइक्लर को अनुमोदित करना चाहते हैं?',
    recyclerStatusUpdated: 'रीसाइक्लर स्थिति सफलतापूर्वक अपडेट की गई!',
    adminAnomalyTitle: 'एआई विसंगति जांच एवं धोखाधड़ी रोकथाम',
    adminAnomalySubtitle: 'असामान्य भाव, वजन में अंतर एवं संदिग्ध गतिविधियों का स्वचालित ऑडिट',
    filterAll: 'सभी',
    filterOpen: 'समीक्षाधीन',
    filterUnderReview: 'जांच जारी',
    filterResolved: 'निस्तारित',
    filterDismissed: 'खारिज',
    resolveAnomalyBtn: 'निपटारा करें',
    dismissAnomalyBtn: 'खारिज करें',
    anomalyUpdated: 'विसंगति स्थिति अपडेट की गई!',
    noAnomaliesFound: 'कोई विसंगति नहीं मिली।',
    adminDatasetTitle: 'राष्ट्रीय ई-कचरा डेटासेट प्रबंधन',
    adminDatasetSubtitle: 'EPR फ्रेमवर्क एवं नीति निर्धारण हेतु स्वचालित रूप से अद्यतन डेटासेट निर्यात',
    recordsLabel: 'रिकॉर्ड्स',
    schemaFieldsLabel: 'संरचित फील्ड स्कीमा:',
    downloadJsonBtn: 'JSON डाउनलोड',
    downloadCsvBtn: 'CSV स्प्रेडशीट',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    roleCollector: 'कलेक्टर',
    roleRecycler: 'रीसाइक्लर',
    roleAdmin: 'प्रशासक',
    phoneRequired: 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
    verifying: 'सत्यापित हो रहा...',
    changeMobile: '← मोबाइल नंबर बदलें',
    sihQuickDemo: 'त्वरित डेमो लॉगिन:',

    // Handover Verification
    handoverVerificationTitle: 'हैंडओवर एवं डिजिटल वजन सत्यापन',
    totalWeight: 'कुल वजन',
    condition: 'स्थिति',
    estimatedValue: 'अनुमानित मूल्य',
    estimatedTotalLabel: 'अनुमानित कुल राशि:',
    pickupIncludedLabel: 'वाहन पिकअप शामिल',
    eta12h: '12 घंटे के भीतर',
    eta24h: '24 घंटे के भीतर (अगले दिन)',
    eta48h: '48 घंटे के भीतर',
    notesToCollectorLabel: 'कलेक्टर को निर्देश / संदेश:',
    handoverSubtitle: 'कैलिब्रेटेड इलेक्ट्रॉनिक कांटे का वजन दर्ज करें, कलेक्टर ओटीपी सत्यापित करें और भुगतान रिकॉर्ड करें',
    handoverSelectLot: '1. हस्तांतरण हेतु लॉट चुनें:',
    handoverNoLots: 'कोई पेंडिंग लॉट नहीं है',
    handoverActualWeight: '2. कांटे का वास्तविक वजन (किलो):',
    handoverCollectorWeight: 'कलेक्टर का अनुमानित वजन:',
    handoverVariance: 'वजन अंतर:',
    handoverVarianceWarning: 'सावधानी: 30% से अधिक अंतर होने पर ऑडिट के लिए विसंगति दर्ज होगी।',
    handoverEnterOtp: '3. कलेक्टर का हैंडओवर OTP दर्ज करें:',
    handoverOtpDesc: 'कलेक्टर के फोन स्क्रीन पर प्रदर्शित 4-अंकीय कोड',
    handoverPaymentMethod: '4. भुगतान माध्यम:',
    handoverCash: '💵 नकद भुगतान ',
    handoverUpi: '📱 तुरंत UPI ट्रांसफर ',
    handoverTotalPayable: 'कुल देय राशि:',
    handoverLocationSource: 'हैंडओवर स्थान स्रोत:',
    handoverSignatureTitle: '5. कलेक्टर डिजिटल हस्ताक्षर (वैकल्पिक):',
    handoverClearSig: 'मिटाएं',
    handoverSigDesc: 'कांटा वजन की पुष्टि के लिए स्क्रीन पर हस्ताक्षर करें',
    handoverDisclaimer: '* यह प्रक्रिया ऑडिट ट्रेल में अधिकृत डिजिटल वाउचर दर्ज करती है।',
    handoverSubmitBtn: 'हैंडओवर व भुगतान संपन्न करें',
    handoverSubmitting: 'सत्यापित हो रहा...',
    handoverSuccessTitle: 'हैंडओवर व भुगतान सफलतापूर्वक सत्यापित!',
    handoverVerifiedWeight: 'सत्यापित वास्तविक वजन:',
    handoverTotalSettled: 'कुल भुगतान:',
    handoverNextBtn: '+ अगला हैंडओवर सत्यापित करें',
    handoverPleaseSelectLot: 'कृपया लॉट चुनें',
    handoverVerifyFailed: 'सत्यापन विफल रहा',
  },

  mr: {
    appTitle: 'कबाडीवाला कनेक्ट',
    appSubtitle: 'अनौपचारिक संकलनकर्त्याला अधिकृत रिसायकलिंगशी जोडणारा सेतू',
    slogan: 'वाजवी दर, पारदर्शक हिशोब, स्वच्छ पर्यावरण',
    upliftLabel: 'जास्त नफा',

    // Auth & Roles
    selectLanguage: 'भाषा निवडा',
    loginTitle: 'कबाडीवाला कनेक्ट लॉगिन',
    loginSubtitle: 'डिजिटल बाजार, सुरक्षित दर आणि पक्की नोंदवही',
    enterMobile: 'तुमचा 10-अंकी मोबाईल नंबर टाका',
    sendOtp: 'ओटीपी पाठवा',
    enterOtp: '4-अंकी ओटीपी टाका',
    verifyOtp: 'लॉगिन करा',
    demoLoginTip: 'डेमो सिम्युलेटर OTP: 1234 ',
    quickDemoUser: 'डेमो रोल निवडा:',
    collectorRole: 'कलेक्टर',
    recyclerRole: 'रीसायकलर',
    adminRole: 'प्रशासक',
    signOut: 'लॉगआउट',
    loggedInAs: 'लॉगिन आहात:',
    roleConflictNotice: 'भूमिका संघर्ष',
    roleRegisteredAs: 'हा मोबाईल नंबर आधीच {role} म्हणून नोंदणीकृत आहे.',
    switchToPortal: '{role} पोर्टलवर जा',
    newUserNotice: 'नवीन वापरकर्ता नोंदणी',
    fullNameLabel: 'पूर्ण नाव',
    districtLabel: 'जिल्हा (स्थान)',
    facilityNameLabel: 'रिसायकलिंग केंद्र / फर्मचे नाव',
    adminPasscodeLabel: 'CPCB मास्टर पासकोड (अनिवार्य)',
    resendOtpIn: 'पुन्हा OTP पाठवा',
    resendOtp: 'OTP पुन्हा पाठवा',

    // Navigation & Layout (Sidebar & Header)
    navDashboard: 'डॅशबोर्ड',
    navAddLot: 'ई-कचरा जोडा',
    navRequests: 'माझे लॉट्स व विनंत्या',
    navRecyclers: 'रिसायकलर शोधा',
    navPrices: 'दैनिक दर फलक',
    navTracking: 'ट्रॅसेबिलिटी ट्रॅकिंग',
    navLedger: 'कमाई व हिशोब नोंद',
    navSafety: 'सुरक्षा नियम',
    navProfile: 'माझी प्रोफाइल',

    navRecyclerDashboard: 'रिसायकलर डॅशबोर्ड',
    navIncomingRequests: 'येणारे लॉट्स व बोली',
    navPickups: 'पिकअप व वाहन व्यवस्थापन',
    navHandover: 'काटा वजन व हँडओव्हर',
    navInventory: 'इन्व्हेंटरी व प्रक्रिया',
    navTransactions: 'व्यवहार व Form-6 पुरावा',
    navVerification: 'CPCB राजपत्र पडताळणी',
    navFacilityProfile: 'प्रकल्प प्रोफाइल',

    navAdminDashboard: 'प्रशासन डॅशबोर्ड',
    navGeoMap: 'राष्ट्रीय GIS नकाशा',
    navRecyclerVerify: 'रिसायकलर राजपत्र ऑडिट',
    navAnomaly: 'AI विसंगती रडार',
    navDisputes: 'तक्रार निवारण केंद्र',
    navDatasets: 'ओपन डेटासेट मॅनेजर',

    navSwitchRole: 'भूमिका बदला',
    activeRoleBadge: 'सक्रिय भूमिका',
    collapseSidebar: 'साइडबार बंद करा',
    expandSidebar: 'साइडबार उघडा',
    judgeEvaluationLogin: 'SIH परीक्षक मूल्यमापन 1-क्लिक लॉगिन',
    judgeEvaluationDesc: 'सत्यापित डेमो खात्यांसह थेट कोणत्याही भूमिकेत प्रवेश करा:',
    authCollectorTitle: 'संकलक डिजिटल ओळख',
    authCollectorDesc: 'पारदर्शक दर, डिजिटल लॉट आणि थेट बँक/रोख पेमेंट',
    authRecyclerTitle: 'अधिकृत रिसायकलर पोर्टल',
    authRecyclerDesc: 'औद्योगिक ई-कचरा खरेदी, पिकअप नियोजन आणि Form-6 EPR पुरावा',
    authAdminTitle: 'राष्ट्रीय ई-कचरा नियामक व ऑडिट सेल',
    authAdminDesc: 'राज्य प्रदूषण नियंत्रण मंडळ देखरेख आणि टेलिमेट्री डॅशबोर्ड',
    portalCollector: 'कलेक्टर पोर्टल',
    portalRecycler: 'रिसायकलर पोर्टल',
    portalAdmin: 'नियामक प्रशासक पोर्टल',

    // Navbar
    judgeGuideBtn: 'परीक्षक मार्गदर्शक ',
    offlineBadge: 'ऑफलाईन',
    syncedBadge: 'क्लाउड सिंक ✓',
    pendingBadge: 'सिंक प्रलंबित',

    // Collector Dashboard
    welcome: 'नमस्कार',
    todaysEarnings: 'आजची कमाई',
    totalEwasteCollected: 'एकूण जमा ई-कचरा',
    pendingRequests: 'प्रलंबित लॉट्स',
    quickActions: 'मुख्य पर्याय',

    addEwaste: 'ई-कचरा जोडा',
    addEwasteDesc: 'फोटो काढून डिजिटल लॉट बनवा',
    checkPrices: 'आजचे दर पहा',
    checkPricesDesc: 'सर्व ८ वस्तूंचे चालू बाजारभाव',
    findRecycler: 'रिसायकलर शोधा',
    findRecyclerDesc: 'जवळचे अधिकृत खरेदीदार',
    myRequests: 'माझे व्यवहार / लॉट्स',
    myRequestsDesc: 'लॉटची स्थिती आणि रिसायकलर्सचे ऑफर्स',
    earningsLedger: 'माझा हिशोब',
    earningsLedgerDesc: 'रोजची कमाई आणि पावती',
    safetyCenter: 'सुरक्षा मार्गदर्शक',
    safetyCenterDesc: 'धोकादायक कचरा सुरक्षित ठेवण्याचे नियम',

    onlineStatus: 'ऑनलाइन',
    offlineStatus: 'ऑफलाइन',
    listenDashboardAudio: 'डॅशबोर्ड ऑडिओ ऐका',
    voiceUnavailable: 'तुमच्या डिव्हाइसवर मराठी आवाज उपलब्ध नाही.',
    voicePlaying: 'आवाज सुरू आहे...',
    voiceListen: 'ऐका',
    voiceStop: 'थांबवा',
    mandiRateTicker: 'दैनिक बाजारभाव:',
    totalCollectedKg: 'एकूण वजन',
    formalChannelBadge: '१००% अधिकृत मार्ग',

    directFinancialBenefit: 'थेट आर्थिक फायदा ',
    directFinancialBenefitDesc: 'मध्यस्थांशिवाय थेट अधिकृत रिसायकलरला विकल्यास अतिरिक्त नफा! डिजिटल काट्यावर १००% अचूक वजन व शून्य वाहतूक खर्च.',
    viewPassbookBtn: 'पासबुक पहा',

    activeDeliveryTitle: 'सध्याच्या लॉटची स्थिती :',
    statusWaitingOffer: 'रिसायकलरकडून ऑफरची वाट पाहत आहे...',
    statusOfferReceived: 'रिसायकलरने खरेदीचा दर पाठवला आहे.',
    statusOfferAccepted: 'दर मंजूर! गाडी पाठवली जात आहे.',
    statusPickupScheduled: 'गाडी येत आहे. काटा पावती व OTP तयार ठेवा.',
    statusReceived: 'काट्यावर वजन तपासले गेले आहे. पावती पहा.',
    statusProcessing: 'अधिकृत प्लांटमध्ये सुरक्षित प्रक्रिया सुरू आहे.',
    statusRecycled: 'ग्रीन रिसायकलिंग व धातू पुनर्प्राप्ती पूर्ण.',

    openHandoverOtpBtn: 'हँडओव्हर OTP उघडा',
    viewScaleReceiptBtn: 'काटा पावती पहा',
    trackStatusBtn: 'स्थिती पहा',

    circularJourneyTitle: 'तुमचा ६-टप्प्यांचा प्रवास :',
    journeyStep1: '१. फोटो घ्या',
    journeyStep2: '२. दर पहा',
    journeyStep3: '३. रिसायकलर',
    journeyStep4: '४. पिकअप',
    journeyStep5: '५. पेमेंट',
    journeyStep6: '६. रिसायकलिंग',

    heroActionsTitle: '⚡ मुख्य कृती ',
    heroSellTag: '+ नवीन लॉट',
    heroPriceTag: '८ प्रकार',
    heroRecyclerTag: 'प्रमाणित',
    heroRequestsTag: 'सक्रिय लॉट',
    heroLedgerTag: 'पासबुक',
    heroSafetyTag: 'नियम',

    fairPriceUpliftTitle: 'पारदर्शक दर फायदा ',
    fairPriceUpliftDesc: 'कबाडीवाला कनेक्टवर थेट अधिकृत कारखान्याला विकल्याने स्थानिक दलालापेक्षा जास्त नफा',
    verifiedMandiRates: 'प्रमाणित बाजारभाव',
    traditionalMiddlemanTitle: 'पारंपरिक स्थानिक दलाल ',
    middlemanTrickNotice: 'वजनात फसवणूक + कमी दर कपात',
    platformRecyclerTitle: 'कबाडीवाला कनेक्ट ',
    platformAdvantageNotice: 'डिजिटल काटा + तत्काळ पावती',
    extraIncomeTitle: 'तुमची जादा कमाई ',
    perKgExtraEarning: 'प्रति किलो जास्त नफा',

    recentLotsTitle: 'नुकतेच नोंदवलेले लॉट्स ',
    viewAllLots: 'सर्व पहा',
    noLotsCreatedYet: 'अद्याप कोणताही लॉट तयार केलेला नाही.',
    addFirstLotBtn: '+ पहिला लॉट जोडा ',
    demoBadge: '🏷️ डेमो',
    liveBadge: '🟢 थेट',

    // Add Lot Wizard
    takePhoto: 'फोटो काढा किंवा अपलोड करा',
    aiPredictionTitle: 'एआय तपासणी ',
    aiConfirmTip: 'कृपया खात्री करा किंवा खालील पर्यायांमधून बदला',
    materialCategoryLabel: 'ई-कचरा प्रकार निवडा',
    approxWeightLabel: 'अंदाजे वजन (किलोग्रॅम)',
    conditionLabel: 'मालाची स्थिती',
    intact: 'अखंड ',
    damaged: 'तुटलेले ',
    dismantled: 'सुटे केलेले ',
    sourceLabel: 'कचरा मिळण्याचे ठिकाण',
    household: 'घरातून ',
    commercial: 'दुकान/ऑफिस ',
    repairShop: 'दुरुस्ती केंद्र ',
    scrapHeap: 'कचरा डेपो ',
    estimatedValueTitle: 'अंदाजे बाजार मूल्य',
    createLotBtn: 'डिजिटल लॉट बनवा',
    lotCreatedSuccess: 'डिजिटल लॉट यशस्वीपणे तयार झाला!',

    step1Photo: '१. फोटो',
    step2Material: '२. साहित्य',
    step3Weight: '३. वजन',
    step4Value: '४. दर',
    step5Review: '५. तपासणी',
    nextBtn: 'पुढे जा ➔',
    backBtn: '⬅ मागे',
    creatingBtn: 'नोंदणी सुरू आहे...',
    audioGuidanceBtn: 'मार्गदर्शन ऐका',

    wizardSubtitle: 'सोपे ५ टप्पे: फोटो ➔ साहित्य ➔ वजन ➔ दर ➔ लॉट नोंदणी',
    step1Heading: 'स्क्रॅपचा फोटो घ्या ',
    optionalRecommended: 'ऐच्छिक पण शिफारसीय',
    retakeCamera: 'कॅमेऱ्याने पुन्हा घ्या',
    chooseGallery: '🖼️ गॅलरीतून निवडा',
    takeOrUploadPrompt: 'स्क्रॅपचा फोटो काढा किंवा फाईल निवडा',
    photoTakenNotice: 'फोटो यशस्वीपणे जोडला गेला',

    ruleBasedSuggestion: 'नियम-आधारित सूचना',
    manualConfirmRequired: 'साहित्य सूचना — पुष्टी आवश्यक',
    enterWeightPrompt: 'अंदाजे वजन प्रविष्ट करा',
    conditionPrompt: 'मालाची स्थिती निवडा',
    sourcePrompt: 'कचरा कोठून मिळाला?',
    benchmarkEstimateNotice: 'हा दर सरकारी बाजारभावावर आधारित अंदाज आहे.',

    lotCreatedTitle: 'डिजिटल लॉट नोंदणीकृत ',
    lotIdLabel: 'तुमचा डिजिटल लॉट क्रमांक :',
    materialLabel: 'साहित्य :',
    weightLabel: 'नोंदवलेले वजन :',
    estRangeLabel: 'अंदाजे मूल्य मर्यादा:',
    viewOffersBtn: 'रिसायकलर ऑफर्स पहा ➔',
    addAnotherLotBtn: '+ आणखी एक लॉट जोडा ',

    // Price Board & Discovery
    priceBoardTitle: 'ई-कचरा बाजारभाव शोध फलक',
    prevailingRate: 'चालू खरेदी दर',
    trend7Days: '७ दिवसांचा कल',
    listenPrice: 'दर ऐका',
    mandiPrice: 'बाजारभाव',
    calculatorTitle: 'पारदर्शक दर कॅल्क्युलेटर',
    calcSubtitle: 'वजन आणि स्थितीनुसार तत्काळ कमाईची गणना करा',
    enterWeight: 'वजन (किलो)',
    selectCondition: 'मालाची स्थिती',
    estFormula: 'पारदर्शक गणना सूत्र',
    estEarnings: 'अंदाजे कमाई',
    estDisclaimer: 'हे फक्त अंदाजे मूल्य आहे, अंतिम विक्री किंमत नाही. अंतिम देयक अधिकृत रिसायकलरच्या काट्यावरील वजनानंतर मिळेल.',
    threePriceStagesTitle: 'दराचे ३ स्पष्ट टप्पे समजून घ्या',
    stageEstTitle: '१. अंदाजे मूल्य ',
    stageEstDesc: 'लॉट नोंदवताना बाजारभाव आणि वजनावर आधारित प्रारंभिक अंदाज.',
    stageQuoteTitle: '२. खरेदीदाराची बोली ',
    stageQuoteDesc: 'अधिकृत रिसायकलरने तुमच्या मालासाठी दिलेली पक्की ऑफर.',
    stageFinalTitle: '३. अंतिम विक्री मूल्य ',
    stageFinalDesc: 'काट्यावर वजन तपासल्यानंतर थेट हातात मिळणारी रक्कम.',
    noHistory: 'अद्याप पुरेसा दर डेटा उपलब्ध नाही',
    noHistoryDesc: 'या जिल्ह्यात नवीन खरेदी दरांची नोंद झाल्यावर खरा इतिहास येथे दिसेल.',
    observedTrend: 'प्रत्यक्ष नोंदवलेला कल ',
    provenanceLive: '🟢 प्रमाणित बाजार दर',
    provenanceBenchmark: '🟡 सरकारी बेसलाईन',
    provenanceSeed: '🏷️ डेमो संदर्भ',
    recycOffer: 'खरेदीदाराची ऑफर',
    noRecycOffer: 'सध्या ऑफर उपलब्ध नाही',
    useGpsDistrict: '🛰️ माझे GPS स्थान वापरा',
    syncStatusCached: '🟡 ऑफलाइन साठवलेले दर',
    syncStatusLive: '🟢 थेट ऑनलाइन दर',

    // Recyclers & Offers
    authorizedTag: 'CPCB अधिकृत',
    distanceKm: 'अंतर',
    freePickup: 'दारापर्यंत मोफत गाडी उपलब्ध',
    makeDeal: 'सौदा पक्का करा',
    offersReceived: 'रिसायकलरकडून ऑफर्स आल्या आहेत',
    matchingTitle: 'रिसायकलर शोध व पारदर्शक ऑफर तुलना',
    matchingSubtitle: 'CPCB राजपत्र अधिकृत रिसायकलिंग केंद्र आणि बोली तुलना',
    compareOffersTitle: 'ऑफर तुलना व निवड ',
    bestRateBadge: '🥇 सर्वोत्तम दर ',
    fastestPickupBadge: '⚡ जलद पिकअप ',
    doorstepPickupOption: '🚚 दारापर्यंत मोफत पिकअप ',
    doorstepPickupDesc: 'कंपनीची अधिकृत गाडी तुमच्याकडे येईल. वाहतूक खर्च शून्य (₹०).',
    selfDeliveryOption: '🚶 स्वतः डिलिव्हरी ',
    selfDeliveryDesc: 'तुम्ही स्वतः माल केंद्रापर्यंत पोहचवाल. (वाहतूक खर्च रिसायकलरशी बोला)',
    zeroDeduction: '₹० वाहतूक कपात',
    transportNotAvail: 'वाहतूक खर्च उपलब्ध नाही',
    requestQuoteBtn: 'ऑफर मागवा / दर निश्चित करा',
    acceptOfferBtn: 'ऑफर स्वीकारा ',
    mcdaWhyRanked: 'रँकिंग गुणांचा आधार ',
    noCompatibleRecycler: 'या साहित्यासाठी अधिकृत रिसायकलर सापडला नाही',
    noCompatibleRecyclerDesc: 'कृपया इतर साहित्य किंवा जवळचा जिल्हा निवडा.',
    offerAcceptSuccess: 'ऑफर यशस्वीपणे स्वीकारली आहे! रिसायकलरला गाडी पाठवण्याची सूचना दिली गेली.',
    activeLotBanner: 'निवडलेल्या लॉटचा तपशील',
    searchPlaceholder: 'रिसायकलरचे नाव किंवा जिल्हा शोधा...',
    allMaterialsTab: 'सर्व साहित्य',
    sortByScore: 'सर्वोच्च गुण',
    sortByRate: 'सर्वोत्तम दर',
    sortByDistance: 'सर्वात जवळ',

    // Digital Handover & Tracking
    handoverTitle: 'डिजिटल हँडओव्हर पावती',
    handoverOtp: 'हँडओव्हर ओटीपी',
    actualWeight: 'काट्यावरील प्रत्यक्ष वजन',
    weightDiff: 'वजनातील फरक',
    trackingTitle: 'ई-कचरा प्रवास ट्रॅकिंग',
    stepCollected: 'कचरा गोळा केला',
    stepPickup: 'गाडीत भरला',
    stepReceived: 'फॅक्टरीत पोहोचला',
    stepProcessing: 'प्रक्रिया सुरू',
    stepRecycled: 'यशस्वी रिसायकल',
    scaleWeightPrompt: 'काट्यावर मोजलेले प्रत्यक्ष वजन नोंदवा',
    signaturePrompt: 'हँडओव्हर सही / पुष्टी',
    receiptSettled: 'रक्कम खात्यात नोंदवली गेली आहे',
    viewReceiptBtn: 'पावती व वाउचर पहा',

    // Earnings & Passbook
    ledgerTitle: 'कलेक्टर नोंदवही व पासबुक',
    ledgerSubtitle: 'दैनिक कमाई, डिजिटल वाउचर्स आणि रोख पावत्या',
    totalEarningsLabel: 'एकूण आजवरची कमाई',
    cashEarningsLabel: 'रोख रक्कम',
    ledgerVouchersLabel: 'लेजर वाउचर्स',
    unitEconomicsTitle: '💡 मध्यस्थापेक्षा जास्त नफा :',
    unitEconomicsBenchmarkLabel: 'प्रारंभिक आर्थिक मॉडेल ',
    informalMiddlemanComparison: 'पारंपरिक भंगार दुकानात हाच माल विकल्यास सुमारे मिळतील (दलाल कपात व काटा बट्टा अंदाजानुसार).',
    netPocketUpliftLabel: 'थेट संभाव्य नफा :',
    voucherReceiptLabel: 'व्यवहार पावत्या ',
    dateLabel: 'तारीख',
    materialCategory: 'साहित्य',
    ratePerKgLabel: 'दर / किलो',
    totalPaidLabel: 'एकूण रक्कम',
    paymentMethodLabel: 'पद्धत',
    digitalLedgerVoucherTag: '📱 लेजर नोंद ✓',
    cashPaidTag: '💵 रोख दिले ✓',

    // Safety Center
    safetyTitle: 'पर्यावरण व व्यक्तिगत सुरक्षा केंद्र',
    safetySubtitle: 'ई-कचरा नियम २०२२ नुसार ८ प्रकारांसाठी सुरक्षा नियम',
    safetyNotice: 'तार जाळणे किंवा ॲसिडने धुणे कायद्याने गुन्हा आहे.',
    dosTitle: 'काय करावे (सुरक्षित पद्धती)',
    dontsTitle: 'काय करू नये (कडक मनाई)',
    ppeNotice: 'हातमोजे, मास्क आणि जाड बूट वापरणे बंधनकारक आहे.',
    emergencyHelpTitle: 'आपत्कालीन मदत हेल्पलाईन:',
    readAloudRules: 'सुरक्षा नियम ऐका',

    // Recycler Portal
    recyclerDashboardTitle: 'रिसायकलर व्यवस्थापन पोर्टल',
    incomingRequestsTitle: 'येणारे स्क्रॅप लॉट्स',
    schedulePickupTitle: 'पिकअप गाडी पाठवा',
    verifyHandoverTitle: 'डिजिटल काटा वजन तपासणी',
    processInventoryTitle: 'फॅक्टरी प्रक्रिया व साठा',
    greenCertTitle: 'फॉर्म-६ ग्रीन रिसायकलिंग प्रमाणपत्र',
    submitBidBtn: 'अधिकृत दर पाठवा',
    enterScaleWeightBtn: 'काटा वजन नोंदवा',

    // Admin Portal
    adminDashboardTitle: 'CPCB राष्ट्रीय ई-कचरा नियंत्रण',
    kpiTotalLots: 'एकूण डिजिटल लॉट्स',
    kpiTotalWeight: 'एकूण स्क्रॅप वजन',
    kpiTotalEarnings: 'संकलनकर्त्यांना दिलेली रक्कम',
    geoMapTitle: 'राष्ट्रीय GIS ई-कचरा नकाशा',
    anomaliesTitle: 'वजन व दर विसंगती तपासणी',
    disputesTitle: 'तक्रार निवारण व लवाद',
    datasetsTitle: 'CPCB EPR डेटासेट एक्सपोर्ट',
    exportCsvBtn: 'CSV डाउनलोड करा',
    exportJsonBtn: 'JSON डाउनलोड करा',

    // Sync & Common
    syncedStatus: 'सर्व्हरशी जोडलेले आहे',
    offlineSavedStatus: 'मोबाईलमध्ये सेव्ह आहे (नेट आल्यावर सिंक होईल)',
    offlineMode: 'ऑफलाईन मोड सुरू',
    refreshBtn: 'ताजे करा',
    closeBtn: 'बंद करा',
    confirmBtn: 'पुष्टी करा',
    cancelBtn: 'रद्द करा',
    loadingText: 'लोड होत आहे...',
    // Form-6 / Green Certificate
    certHeaderTitle: 'डिजिटल हँडओव्हर व रिसायकलिंग नोंद',
    certHeaderSubtitle: 'अंतर्गत विस्तारित उत्पादक जबाबदारी (EPR) ट्रॅसेबिलिटी पुरावा',
    certRegulatoryNotice: 'वैधानिक प्रकटीकरण: हा प्लॅटफॉर्म-निर्मित डिजिटल रिसायकलिंग/हँडओव्हर रेकॉर्ड आहे — अधिकृत सीपीसीबी प्रमाणपत्र नाही.',
    certChainOfCustodyTitle: 'ई-कचरा रिसायकलिंग चेन ऑफ कस्टडी पुरावा',
    certAuditRecordId: 'ऑडिट रेकॉर्ड आयडी',
    certDigitalLotId: 'डिजिटल लॉट आयडी',
    certMaterialCategory: 'साहित्य प्रकार',
    certScaleWeight: 'प्रमाणित काटा वजन',
    certCollector: 'संकलनकर्ता / कबाडीवाला',
    certAuthorizedRecycler: 'अधिकृत रिसायकलर',
    certSettledAmount: 'निकाली रक्कम',
    certFormalDeclaration: 'औपचारिक हरित प्रक्रिया घोषणा:',
    certDeclarationText: 'हे प्रमाणित करते की वरील संदर्भातील साहित्य अनधिकृत उघड्यावर जाळणे आणि ऍसिड प्रक्रियेपासून सुरक्षितपणे रोखून अधिकृत केंद्रात जमा केले गेले आहे.',
    certVerifiedTimestamp: 'पडताळणी वेळ',
    certPlatformSeal: 'प्लॅटफॉर्म डिजिटल शिक्का',
    certPrintPdf: 'प्रिंट / पीडीएफ जतन करा',

    // Recycler Incoming Lots & Make Offer
    incomingLotsTitle: 'संकलनकर्ता ई-कचरा लॉट व बोली',
    incomingLotsSubtitle: 'कबाडीवाल्यांनी नोंदवलेले डिजिटल लॉट पहा आणि आपले खरेदी दर सादर करा',
    makeOfferBtn: 'दर सादर करा',
    makeOfferModalTitle: 'रिसायकलर दर सादर करा',
    offeredRateLabel: 'प्रति किलो खरेदी दर (₹/किलो):',
    estTotalLabel: 'अंदाजे एकूण रक्कम:',
    doorstepPickupQuestion: 'डोअरस्टेप पिकअप उपलब्ध करणार?',
    pickupEtaLabel: 'पिकअप वेळ मर्यादा:',
    within12Hours: '12 तासांच्या आत',
    within24Hours: '24 तासांच्या आत',
    within48Hours: '48 तासांच्या आत',
    notesToCollector: 'संकलनकर्त्यासाठी सूचना / टीप:',
    sendOfferBtn: 'संकलनकर्त्याला ऑफर पाठवा',
    submittingOffer: 'ऑफर पाठवली जात आहे...',
    offerSubmittedSuccess: 'दर यशस्वीरीत्या सादर केला गेला!',
    noIncomingLots: 'सध्या कोणताही नवीन लॉट उपलब्ध नाही.',

    // Recycler Processing & Inventory
    inventoryProcessingTitle: 'फॅक्टरी इन्व्हेंटरी व रिसायकलिंग जीवनचक्र',
    inventoryProcessingSubtitle: 'साहित्य वर्गीकरण, घटक वेगळे करणे, धातू पुनर्प्राप्ती व १००% अधिकृत रिसायकलिंग',
    materialStockTitle: 'फॅक्टरी साहित्य साठा',
    advanceStageTitle: 'रिसायकलिंग टप्पा पुढे करा',
    selectLotPrompt: 'प्रक्रियेसाठी लॉट निवडा:',
    nextStagePrompt: 'नवीन रिसायकलिंग टप्पा:',
    stageWarehouseReceived: '1. वेअरहाऊसमध्ये प्राप्त',
    stageSorting: '2. घटकांचे वर्गीकरण व विलगीकरण',
    stageProcessing: '3. रासायनिक व धातुकर्म प्रक्रिया',
    stageRecovered: '4. दुर्मिळ व मौल्यवान धातू पुनर्प्राप्त',
    stageRecycled: '5. 100% अधिकृतपणे रीसायकल',
    recoveredDetailsLabel: 'पुनर्प्राप्त धातू / आउटपुट तपशील:',
    advanceStageBtn: 'रिसायकलिंग स्थिती अद्यतन करा',
    updatingStage: 'अद्यतन होत आहे...',
    stageUpdateSuccess: 'लॉट स्थिती यशस्वीरीत्या अद्यतन झाली!',
    noProcessingLots: 'सध्या प्रक्रियेसाठी कोणताही लॉट उपलब्ध नाही.',

    // Recycler Home
    newIncomingLots: 'नवीन प्राप्त लॉट',
    requiresPriceBids: 'दर आवश्यक',
    pendingPickupsLabel: 'प्रलंबित पिकअप',
    scheduledEnroute: 'नियोजित / मार्गावर',
    inProcessingLabel: 'प्रक्रिया सुरू',
    activeHydrometallurgy: 'सक्रिय प्रक्रिया',
    totalFormallyRecycled: 'एकूण अधिकृत रीसायकल',
    form6Certified: '100% सीपीसीबी फॉर्म-6 प्रमाणित',
    viewNewLotsBtn: 'नवीन लॉट पहा',
    handoverScaleNav: 'हँडओव्हर व काटा पडताळणी',
    handoverScaleDesc: 'काटा वजन व ओटीपी पडताळणी',
    processingLifecycleNav: 'प्रक्रिया व जीवनचक्र',
    processingLifecycleDesc: 'वर्गीकरण ➔ निष्कर्षण ➔ रीसायकल',
    activeLotsInPipeline: 'सक्रिय लॉट यादी (पाइपलाइन)',
    schedulePickupBtn: 'पिकअप निश्चित करा',
    updateLifecycleBtn: 'प्रक्रिया अद्यतन करा',

    // Admin
    adminRecyclerTitle: 'सीपीसीबी रिसायकलर पडताळणी व क्षमता व्यवस्थापन',
    adminRecyclerSubtitle: 'केंद्रीय व राज्य प्रदूषण नियंत्रण मंडळाच्या अंतर्गत नोंदणीकृत रिसायकलर मंजुरी व निलंबन',
    approveLicenseBtn: 'परवाना मंजूर करा',
    suspendLicenseBtn: 'निलंबित करा',
    confirmSuspendTitle: 'तुम्ही या रिसायकलरला निलंबित करू इच्छिता?',
    confirmSuspendDesc: 'निलंबनानंतर हा रिसायकलर नवीन ई-कचऱ्यासाठी बोली लावू शकणार नाही.',
    confirmApproveTitle: 'तुम्ही या रिसायकलरला मान्यता देऊ इच्छिता?',
    recyclerStatusUpdated: 'रिसायकलर स्थिती यशस्वीरीत्या अद्यतन केली!',
    adminAnomalyTitle: 'एआय विसंगती शोध व फसवणूक प्रतिबंध',
    adminAnomalySubtitle: 'असामान्य दर, वजनातील तफावत व संशयास्पद व्यवहारांचे स्वयंचलित ऑडिट',
    filterAll: 'सर्व',
    filterOpen: 'पुनरावलोकनात (ओपन)',
    filterUnderReview: 'तपासणी सुरू',
    filterResolved: 'निकाली',
    filterDismissed: 'फेटाळलेले',
    resolveAnomalyBtn: 'निकाली काढा',
    dismissAnomalyBtn: 'फेटाळा',
    anomalyUpdated: 'विसंगती स्थिती अद्यतन केली!',
    noAnomaliesFound: 'कोणतीही विसंगती आढळली नाही.',
    adminDatasetTitle: 'राष्ट्रीय ई-कचरा डेटासेट व्यवस्थापन',
    adminDatasetSubtitle: 'EPR फ्रेमवर्क व धोरण निश्चितीसाठी स्वयंचलित डेटासेट निर्यात',
    recordsLabel: 'नोंदी',
    schemaFieldsLabel: 'संरचित फील्ड स्कीमा:',
    downloadJsonBtn: 'JSON डाउनलोड',
    downloadCsvBtn: 'CSV स्प्रेडशीट',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    roleCollector: 'कलेक्टर',
    roleRecycler: 'रीसायकलर',
    roleAdmin: 'प्रशासक',
    phoneRequired: 'कृपया वैध 10-अंकी मोबाईल नंबर प्रविष्ट करा',
    verifying: 'पडताळणी सुरू आहे...',
    changeMobile: '← मोबाईल नंबर बदला',
    sihQuickDemo: 'त्वरित डेमो लॉगिन:',

    // Handover Verification
    handoverVerificationTitle: 'हँडओव्हर आणि डिजिटल वजन पडताळणी',
    totalWeight: 'एकूण वजन',
    condition: 'स्थिती',
    estimatedValue: 'अंदाजे मूल्य',
    estimatedTotalLabel: 'अंदाजे एकूण रक्कम:',
    pickupIncludedLabel: 'वाहन पिकअप समाविष्ट',
    eta12h: '12 तासांच्या आत',
    eta24h: '24 तासांच्या आत (दुसऱ्या दिवशी)',
    eta48h: '48 तासांच्या आत',
    notesToCollectorLabel: 'कलेक्टरला सूचना / संदेश:',
    handoverSubtitle: 'कॅलिब्रेटेड इलेक्ट्रॉनिक काट्याचे वजन नोंदवा, कलेक्टर ओटीपी सत्यापित करा आणि पेमेंट नोंदवा',
    handoverSelectLot: '1. हस्तांतरणासाठी लॉट निवडा:',
    handoverNoLots: 'कोणताही प्रलंबित लॉट नाही',
    handoverActualWeight: '2. काट्याचे प्रत्यक्ष वजन (किलो):',
    handoverCollectorWeight: 'कलेक्टरचे अंदाजे वजन:',
    handoverVariance: 'वजन फरक:',
    handoverVarianceWarning: 'सावधान: 30% पेक्षा जास्त फरक असल्यास ऑडिटसाठी विसंगती नोंदवली जाईल.',
    handoverEnterOtp: '3. कलेक्टरचा हँडओव्हर OTP नोंदवा:',
    handoverOtpDesc: 'कलेक्टरच्या फोन स्क्रीनवर दिसणारा 4-अंकी कोड',
    handoverPaymentMethod: '4. पेमेंट पद्धत:',
    handoverCash: '💵 रोख पेमेंट ',
    handoverUpi: '📱 त्वरित UPI ट्रान्सफर ',
    handoverTotalPayable: 'एकूण देय रक्कम:',
    handoverLocationSource: 'हँडओव्हर स्थान स्त्रोत:',
    handoverSignatureTitle: '5. कलेक्टर पोचपावती डिजिटल स्वाक्षरी (पर्यायी):',
    handoverClearSig: 'साफ करा',
    handoverSigDesc: 'काट्याच्या वजनाची पुष्टी करण्यासाठी स्क्रीनवर स्वाक्षरी करा',
    handoverDisclaimer: '* ही प्रक्रिया अधिकृत डिजिटल लेजर व्हाउचर नोंदवते.',
    handoverSubmitBtn: 'डिजिटल हँडओव्हर आणि पेमेंट पूर्ण करा',
    handoverSubmitting: 'पडताळणी होत आहे...',
    handoverSuccessTitle: 'हँडओव्हर आणि पेमेंट यशस्वीरीत्या सत्यापित!',
    handoverVerifiedWeight: 'सत्यापित प्रत्यक्ष वजन:',
    handoverTotalSettled: 'एकूण पेमेंट:',
    handoverNextBtn: '+ पुढील हँडओव्हर सत्यापित करा',
    handoverPleaseSelectLot: 'कृपया लॉट निवडा',
    handoverVerifyFailed: 'पडताळणी अयशस्वी झाली',
  },

  en: {
    appTitle: 'Kabadiwala Connect',
    appSubtitle: 'Bridging the Informal Collector into the Formal Recycling Chain',
    slogan: 'Fair Prices, Transparent Ledger, Clean Environment',
    upliftLabel: 'Uplift',

    // Auth & Roles
    selectLanguage: 'Select Language',
    loginTitle: 'Kabadiwala Connect Login',
    loginSubtitle: 'Digital Mandi, Guaranteed Benchmark Rates & Passbook',
    enterMobile: 'Enter 10-digit mobile number',
    sendOtp: 'Send OTP',
    enterOtp: 'Enter 4-digit OTP',
    verifyOtp: 'Verify & Login',
    demoLoginTip: 'Demo Simulator OTP: 1234 ',
    quickDemoUser: 'Select Quick Demo Persona:',
    collectorRole: 'Collector',
    recyclerRole: 'Recycler',
    adminRole: 'Admin',
    signOut: 'Sign Out',
    loggedInAs: 'Logged in as:',
    roleConflictNotice: 'Role Conflict Detected',
    roleRegisteredAs: 'This mobile number is already registered as {role}.',
    switchToPortal: 'Switch to {role} Portal',
    newUserNotice: 'New User Registration',
    fullNameLabel: 'Full Name',
    districtLabel: 'District (Location)',
    facilityNameLabel: 'Recycling Facility / Organization Name',
    adminPasscodeLabel: 'CPCB Master Passcode (Required)',
    resendOtpIn: 'Resend OTP in',
    resendOtp: 'Resend OTP',

    // Navigation & Layout (Sidebar & Header)
    navDashboard: 'Dashboard',
    navAddLot: 'Add E-Waste Lot',
    navRequests: 'My Requests & Lots',
    navRecyclers: 'Find Recyclers',
    navPrices: 'Mandi Price Board',
    navTracking: 'Lifecycle Tracking',
    navLedger: 'Earnings & Ledger',
    navSafety: 'Safety Center',
    navProfile: 'Profile',

    navRecyclerDashboard: 'Recycler Dashboard',
    navIncomingRequests: 'Incoming Requests',
    navPickups: 'Pickup Management',
    navHandover: 'Scale & Handover',
    navInventory: 'Inventory & Processing',
    navTransactions: 'Transactions & Form-6',
    navVerification: 'Gazette Verification',
    navFacilityProfile: 'Facility Profile',

    navAdminDashboard: 'Admin Dashboard',
    navGeoMap: 'National GIS Map',
    navRecyclerVerify: 'Recycler Verification',
    navAnomaly: 'AI Anomaly Monitor',
    navDisputes: 'Dispute Resolution',
    navDatasets: 'Dataset Manager',

    navSwitchRole: 'Switch Role',
    activeRoleBadge: 'Active Role',
    collapseSidebar: 'Collapse Sidebar',
    expandSidebar: 'Expand Sidebar',
    judgeEvaluationLogin: 'SIH Judge Evaluation 1-Click Login',
    judgeEvaluationDesc: 'Directly authenticate with pre-verified demonstration credentials:',
    authCollectorTitle: 'Informal Collector Portal',
    authCollectorDesc: 'Transparent Mandi Rates, Digital Lot Creation & Instant Payment',
    authRecyclerTitle: 'CPCB Authorized Recycler Portal',
    authRecyclerDesc: 'Bulk E-Waste Procurement, Logistics & Statutory EPR Form-6 Issuance',
    authAdminTitle: 'National E-Waste Regulatory & Audit Cell',
    authAdminDesc: 'SPCB / CPCB Oversight, Machine Learning Anomaly Detection & Gazette Telemetry',
    portalCollector: 'Collector Portal',
    portalRecycler: 'Recycler Portal',
    portalAdmin: 'Regulatory Admin Portal',

    // Navbar
    judgeGuideBtn: 'Judge Demo Guide',
    offlineBadge: 'Offline',
    syncedBadge: 'Cloud Synced ✓',
    pendingBadge: 'Pending Sync',

    // Collector Dashboard
    welcome: 'Welcome',
    todaysEarnings: "Today's Earnings",
    totalEwasteCollected: 'Total E-Waste Collected',
    pendingRequests: 'Active Lots',
    quickActions: 'Quick Actions',

    addEwaste: 'Add E-Waste Lot',
    addEwasteDesc: 'Capture photo & generate digital lot',
    checkPrices: 'Check Price Board',
    checkPricesDesc: 'Government & fair market rates for 8 categories',
    findRecycler: 'Find Recycler',
    findRecyclerDesc: 'Nearby CPCB verified buyers & rates',
    myRequests: 'My Lots & Offers',
    myRequestsDesc: 'Track status and compare recycler bids',
    earningsLedger: 'Earnings Ledger',
    earningsLedgerDesc: 'Daily income breakdown and payment vouchers',
    safetyCenter: 'Safety Center',
    safetyCenterDesc: 'Pictorial rules & hazard prevention',

    onlineStatus: 'Online',
    offlineStatus: 'Offline',
    listenDashboardAudio: 'Listen Dashboard Audio',
    voiceUnavailable: 'No compatible voice is available on this device.',
    voicePlaying: 'Playing voice...',
    voiceListen: 'Listen',
    voiceStop: 'Stop',
    mandiRateTicker: 'Daily Benchmark Rates:',
    totalCollectedKg: 'Total Scrap',
    formalChannelBadge: '100% Formal Channel',

    directFinancialBenefit: 'Direct Financial Benefit (+72% Margin)',
    directFinancialBenefitDesc: 'Earn significantly higher income by connecting directly with licensed recyclers instead of informal middlemen! 100% certified electronic weighbridge with zero transport deductions.',
    viewPassbookBtn: 'View Passbook',

    activeDeliveryTitle: 'Current Active Delivery Status:',
    statusWaitingOffer: 'Awaiting formal quote from recyclers...',
    statusOfferReceived: 'Recycler submitted a formal purchase bid.',
    statusOfferAccepted: 'Offer accepted! Dispatching pickup logistics.',
    statusPickupScheduled: 'Pickup vehicle en route. Keep handover OTP ready.',
    statusReceived: 'Electronic scale weight verified. Payment voucher issued.',
    statusProcessing: 'Safe processing active at authorized facility.',
    statusRecycled: 'Green closed-loop recycling and metal recovery completed.',

    openHandoverOtpBtn: 'Open Handover OTP',
    viewScaleReceiptBtn: 'View Scale Receipt',
    trackStatusBtn: 'Track Status',

    circularJourneyTitle: 'Collector 6-Stage Lifecycle Journey:',
    journeyStep1: '1. Photo',
    journeyStep2: '2. Prices',
    journeyStep3: '3. Recycler',
    journeyStep4: '4. Pickup',
    journeyStep5: '5. Payment',
    journeyStep6: '6. Recycled',

    heroActionsTitle: '⚡ Quick Actions ',
    heroSellTag: '+ New Lot',
    heroPriceTag: '8 Streams',
    heroRecyclerTag: 'Verified',
    heroRequestsTag: 'Active Lots',
    heroLedgerTag: 'Passbook',
    heroSafetyTag: 'Safety',

    fairPriceUpliftTitle: 'Direct Recycler Fair Price Uplift',
    fairPriceUpliftDesc: 'Higher net earnings on Kabadiwala Connect by selling directly to CPCB authorized factories vs middleman deductions',
    verifiedMandiRates: 'Certified Mandi Rates',
    traditionalMiddlemanTitle: 'Traditional Local Middleman',
    middlemanTrickNotice: 'Uncalibrated scale cut + below-market rates',
    platformRecyclerTitle: 'Kabadiwala Connect ',
    platformAdvantageNotice: 'Calibrated weighbridge + instant payment receipt',
    extraIncomeTitle: 'Your Extra Income',
    perKgExtraEarning: 'higher pocket earnings per kg',

    recentLotsTitle: 'Recent Scrap Lots',
    viewAllLots: 'View All',
    noLotsCreatedYet: 'No e-waste lots created yet.',
    addFirstLotBtn: '+ Add First Scrap Lot',
    demoBadge: '🏷️ DEMO',
    liveBadge: '🟢 LIVE',

    // Add Lot Wizard
    takePhoto: 'Take or Upload Photo',
    aiPredictionTitle: 'AI Material Classification',
    aiConfirmTip: 'Verify AI category prediction or tap to change below',
    materialCategoryLabel: 'Select Material Category',
    approxWeightLabel: 'Approximate Weight (kg)',
    conditionLabel: 'Item Condition',
    intact: 'Intact',
    damaged: 'Damaged',
    dismantled: 'Dismantled',
    sourceLabel: 'Collection Source',
    household: 'Household',
    commercial: 'Commercial / Office',
    repairShop: 'Repair Shop',
    scrapHeap: 'Scrap Heap',
    estimatedValueTitle: 'Estimated Market Value',
    createLotBtn: 'Create Digital Lot',
    lotCreatedSuccess: 'Digital lot created successfully!',

    step1Photo: '1. Photo',
    step2Material: '2. Material',
    step3Weight: '3. Weight',
    step4Value: '4. Value',
    step5Review: '5. Review',
    nextBtn: 'Next Step ➔',
    backBtn: '⬅ Back',
    creatingBtn: 'Registering Lot...',
    audioGuidanceBtn: 'Listen Audio',

    wizardSubtitle: 'Simple 5-step wizard: Photo ➔ Material ➔ Weight ➔ Price ➔ Lot Creation',
    step1Heading: 'Take Photo of Scrap Item',
    optionalRecommended: 'Optional but strongly recommended',
    retakeCamera: 'Retake Camera Photo',
    chooseGallery: '🖼️ Choose from Gallery',
    takeOrUploadPrompt: 'Take photo or select an image file',
    photoTakenNotice: 'Photo captured successfully',

    ruleBasedSuggestion: 'Rule-Based Suggestion',
    manualConfirmRequired: 'Material Suggestion — Confirmation Required',
    enterWeightPrompt: 'Enter approximate weight in kg',
    conditionPrompt: 'Select condition of scrap',
    sourcePrompt: 'Where did you collect this from?',
    benchmarkEstimateNotice: 'Valuation is estimated based on official Mandi benchmark rates.',

    lotCreatedTitle: 'Digital Lot Created (Lot Registered)',
    lotIdLabel: 'Your Digital Lot Number :',
    materialLabel: 'Material:',
    weightLabel: 'Recorded Weight:',
    estRangeLabel: 'Estimated Value Range:',
    viewOffersBtn: 'View Recycler Bids ➔',
    addAnotherLotBtn: '+ Add Another Lot',

    // Price Board & Discovery
    priceBoardTitle: 'E-Waste Price Discovery Board',
    prevailingRate: 'Prevailing Buy Rate',
    trend7Days: '7-Day Trend',
    listenPrice: 'Listen Rate',
    mandiPrice: 'Mandi Rate',
    calculatorTitle: 'Transparent Price Calculator',
    calcSubtitle: 'Calculate instant estimated earnings by weight and condition',
    enterWeight: 'Weight (kg)',
    selectCondition: 'Material Condition',
    estFormula: 'Transparent Calculation Formula',
    estEarnings: 'Estimated Earnings',
    estDisclaimer: 'This is an illustrative estimate. Final settlement occurs upon verified digital scale weight at the recycler facility.',
    threePriceStagesTitle: 'Understanding the 3 Pricing Stages',
    stageEstTitle: '1. Estimated Value',
    stageEstDesc: 'Preliminary benchmark based on Mandi rate and declared weight.',
    stageQuoteTitle: '2. Recycler Quoted Bid',
    stageQuoteDesc: 'Binding purchase offer submitted by authorized facility.',
    stageFinalTitle: '3. Final Sale Value',
    stageFinalDesc: 'Settled amount based on calibrated electronic weighbridge reading.',
    noHistory: 'Insufficient historical data',
    noHistoryDesc: 'Historical trends will appear as genuine local Mandi observations are logged.',
    observedTrend: 'Observed Market Trend',
    provenanceLive: '🟢 Verified Mandi Rate',
    provenanceBenchmark: '🟡 Baseline Benchmark',
    provenanceSeed: '🏷️ Demo Reference',
    recycOffer: 'Recycler Bid',
    noRecycOffer: 'No bid placed yet',
    useGpsDistrict: '🛰️ Use My Device GPS Location',
    syncStatusCached: '🟡 Cached Offline Rates',
    syncStatusLive: '🟢 Live Online Mandi',

    // Recyclers & Offers
    authorizedTag: 'CPCB Authorized',
    distanceKm: 'Distance',
    freePickup: 'Doorstep Pickup Available',
    makeDeal: 'Accept Offer',
    offersReceived: 'Recycler bids received',
    matchingTitle: 'Recycler Matching & Transparent Bid Comparison',
    matchingSubtitle: 'CPCB Gazette authorized facilities and explainable MCDA scoring',
    compareOffersTitle: 'Compare & Select Offer',
    bestRateBadge: '🥇 Best Price',
    fastestPickupBadge: '⚡ Fastest Pickup',
    doorstepPickupOption: '🚚 Free Doorstep Pickup',
    doorstepPickupDesc: 'Recycler vehicle collects from your location. Zero transport deductions (₹0).',
    selfDeliveryOption: '🚶 Self Delivery',
    selfDeliveryDesc: 'You deliver the lot to the facility. Transport expenses not covered.',
    zeroDeduction: '₹0 Transport Deduction',
    transportNotAvail: 'Transport cost not recorded',
    requestQuoteBtn: 'Request Direct Quote',
    acceptOfferBtn: 'Confirm & Accept Bid',
    mcdaWhyRanked: 'Ranking Factor Breakdown',
    noCompatibleRecycler: 'No authorized recycler found for this material',
    noCompatibleRecyclerDesc: 'Please select another material or a nearby district.',
    offerAcceptSuccess: 'Offer accepted successfully! Pickup request dispatched to recycler.',
    activeLotBanner: 'Selected Lot Overview',
    searchPlaceholder: 'Search recycler by name or district...',
    allMaterialsTab: 'All Materials',
    sortByScore: 'Highest Match',
    sortByRate: 'Best Rate',
    sortByDistance: 'Closest Distance',

    // Digital Handover & Tracking
    handoverTitle: 'Digital Handover Receipt',
    handoverOtp: 'Handover OTP',
    actualWeight: 'Calibrated Scale Weight',
    weightDiff: 'Weight Difference',
    trackingTitle: 'E-Waste Lifecycle Tracking',
    stepCollected: 'Lot Created',
    stepPickup: 'Pickup Scheduled',
    stepReceived: 'Facility Received',
    stepProcessing: 'Processing Active',
    stepRecycled: 'Recycled & Recovered',
    scaleWeightPrompt: 'Enter physical scale weight in kg',
    signaturePrompt: 'Handover Confirmation / Signature',
    receiptSettled: 'Payment settled in digital passbook',
    viewReceiptBtn: 'View Receipt & Voucher',

    // Earnings & Passbook
    ledgerTitle: 'Collector Earnings Passbook',
    ledgerSubtitle: 'Daily earnings, digital vouchers, and cash receipts',
    totalEarningsLabel: 'Lifetime Earnings',
    cashEarningsLabel: 'Cash Received',
    ledgerVouchersLabel: 'Ledger Vouchers',
    unitEconomicsTitle: '💡 Fair Price Margin Uplift (vs Informal Middleman):',
    unitEconomicsBenchmarkLabel: 'Benchmark Model • Field Validation Required',
    informalMiddlemanComparison: 'Selling the same volume to informal scrap dealers would yield approx (based on middleman cuts and scale deductions).',
    netPocketUpliftLabel: 'Model Pocket Uplift:',
    voucherReceiptLabel: 'Transaction Vouchers',
    dateLabel: 'Date',
    materialCategory: 'Material',
    ratePerKgLabel: 'Rate / kg',
    totalPaidLabel: 'Total Paid',
    paymentMethodLabel: 'Method',
    digitalLedgerVoucherTag: '📱 Ledger Voucher ✓',
    cashPaidTag: '💵 Cash Paid ✓',

    // Safety Center
    safetyTitle: 'Environmental & Occupational Safety Center',
    safetySubtitle: 'Safety guidelines across 8 hazardous e-waste streams per E-Waste Rules 2022',
    safetyNotice: 'Informal open wire burning and acid washing are illegal and hazardous.',
    dosTitle: 'Do’s (Safe Practices)',
    dontsTitle: 'Don’ts (Strictly Prohibited)',
    ppeNotice: 'Gloves, mask, and heavy safety shoes are mandatory.',
    emergencyHelpTitle: 'Emergency Safety Helpline:',
    readAloudRules: 'Listen Safety Rules',

    // Recycler Portal
    recyclerDashboardTitle: 'Recycler Facility Management Portal',
    incomingRequestsTitle: 'Incoming Scrap Lots',
    schedulePickupTitle: 'Schedule Logistics Pickup',
    verifyHandoverTitle: 'Electronic Weighbridge Handover',
    processInventoryTitle: 'Factory Inventory & Recycling',
    greenCertTitle: 'Form-6 Green Recycling Certificate',
    submitBidBtn: 'Submit Formal Quote',
    enterScaleWeightBtn: 'Record Scale Weight',

    // Admin Portal
    adminDashboardTitle: 'CPCB National E-Waste Governance',
    kpiTotalLots: 'Total Digital Lots',
    kpiTotalWeight: 'Total E-Waste Weight',
    kpiTotalEarnings: 'Total Paid to Collectors',
    geoMapTitle: 'National GIS E-Waste Map',
    anomaliesTitle: 'Weight & Price Anomaly Monitor',
    disputesTitle: 'Dispute Arbitration & Resolution',
    datasetsTitle: 'CPCB EPR Datasets & Exports',
    exportCsvBtn: 'Export CSV',
    exportJsonBtn: 'Export JSON',

    // Sync & Common
    syncedStatus: 'Synced with cloud',
    offlineSavedStatus: 'Saved locally on phone (Pending internet)',
    offlineMode: 'Offline Mode Active',
    refreshBtn: 'Refresh',
    closeBtn: 'Close',
    confirmBtn: 'Confirm',
    cancelBtn: 'Cancel',
    loadingText: 'Loading...',
    // Form-6 / Green Certificate
    certHeaderTitle: 'Digital Handover & Recycling Record',
    certHeaderSubtitle: 'Internal Extended Producer Responsibility (EPR) Traceability Proof',
    certRegulatoryNotice: 'Regulatory Notice: Platform-generated digital recycling/handover record — not an official statutory CPCB certificate.',
    certChainOfCustodyTitle: 'E-Waste Recycling Chain of Custody Proof',
    certAuditRecordId: 'Audit Record ID',
    certDigitalLotId: 'Digital Lot ID',
    certMaterialCategory: 'Material Category',
    certScaleWeight: 'Certified Scale Weight',
    certCollector: 'Collector / Kabadiwala',
    certAuthorizedRecycler: 'Authorized Recycler',
    certSettledAmount: 'Settled Amount',
    certFormalDeclaration: 'Formal Green Processing Declaration:',
    certDeclarationText: 'This certifies that the material referenced above was safely diverted from informal backyard burning and acid leaching, and received by the licensed recycling facility in accordance with declared processing SOPs.',
    certVerifiedTimestamp: 'Verified Timestamp',
    certPlatformSeal: 'Platform Digital Seal',
    certPrintPdf: 'Print / Save PDF',

    // Recycler Incoming Lots & Make Offer
    incomingLotsTitle: 'Incoming Collector Lots & Offers',
    incomingLotsSubtitle: 'Review digital lots listed by collectors and submit competitive purchase bids',
    makeOfferBtn: 'Make Price Offer',
    makeOfferModalTitle: 'Submit Recycler Quote',
    offeredRateLabel: 'Offered Purchase Rate (₹/kg):',
    estTotalLabel: 'Estimated Total Value:',
    doorstepPickupQuestion: 'Include Doorstep Vehicle Pickup?',
    pickupEtaLabel: 'Pickup Timeframe:',
    within12Hours: 'Within 12 Hours',
    within24Hours: 'Within 24 Hours',
    within48Hours: 'Within 48 Hours',
    notesToCollector: 'Notes to Collector:',
    sendOfferBtn: 'Send Offer to Collector',
    submittingOffer: 'Submitting Offer...',
    offerSubmittedSuccess: 'Offer submitted successfully!',
    noIncomingLots: 'No incoming lots available at the moment.',

    // Recycler Processing & Inventory
    inventoryProcessingTitle: 'Factory Inventory & Recycling Lifecycle',
    inventoryProcessingSubtitle: 'Material sorting, component depopulation, critical metal recovery, and 100% formal recycling',
    materialStockTitle: 'Facility Material Stock',
    advanceStageTitle: 'Advance Recycling Stage',
    selectLotPrompt: 'Select Lot for Processing:',
    nextStagePrompt: 'Next Processing Stage:',
    stageWarehouseReceived: '1. Warehouse Received',
    stageSorting: '2. Sorting & Depopulation',
    stageProcessing: '3. Hydrometallurgical Extraction',
    stageRecovered: '4. Critical Metals Recovered',
    stageRecycled: '5. 100% Formally Recycled',
    recoveredDetailsLabel: 'Recovered Metals / Output Notes:',
    advanceStageBtn: 'Advance Processing Stage',
    updatingStage: 'Updating Stage...',
    stageUpdateSuccess: 'Lot status successfully updated!',
    noProcessingLots: 'No lots currently in processing pipeline.',

    // Recycler Home
    newIncomingLots: 'New Incoming Lots',
    requiresPriceBids: 'Requires Price Bids',
    pendingPickupsLabel: 'Pending Pickups',
    scheduledEnroute: 'Scheduled / Enroute',
    inProcessingLabel: 'In Processing',
    activeHydrometallurgy: 'Active Hydrometallurgy',
    totalFormallyRecycled: 'Total Formally Recycled',
    form6Certified: '100% CPCB Form-6 Certified',
    viewNewLotsBtn: 'View New Lots',
    handoverScaleNav: 'Handover & Weighbridge Scale',
    handoverScaleDesc: 'Verify scale weight & collector OTP',
    processingLifecycleNav: 'Processing & Lifecycle',
    processingLifecycleDesc: 'Sorted ➔ Recovered ➔ Recycled',
    activeLotsInPipeline: 'Active Lots in Pipeline',
    schedulePickupBtn: 'Schedule Pickup',
    updateLifecycleBtn: 'Update Lifecycle',

    // Admin
    adminRecyclerTitle: 'CPCB Recycler Verification & Capacity Management',
    adminRecyclerSubtitle: 'Approval and suspension of e-waste recyclers registered under CPCB and SPCB',
    approveLicenseBtn: 'Approve Authorization',
    suspendLicenseBtn: 'Suspend Facility',
    confirmSuspendTitle: 'Are you sure you want to suspend this recycler?',
    confirmSuspendDesc: 'Once suspended, this facility will no longer be eligible to bid on incoming scrap lots.',
    confirmApproveTitle: 'Confirm Recycler Approval',
    recyclerStatusUpdated: 'Recycler status successfully updated!',
    adminAnomalyTitle: 'AI Anomaly Detection & Fraud Prevention',
    adminAnomalySubtitle: 'Automated audit of unusual prices, scale tare discrepancies, and suspicious patterns',
    filterAll: 'ALL',
    filterOpen: 'OPEN',
    filterUnderReview: 'UNDER REVIEW',
    filterResolved: 'RESOLVED',
    filterDismissed: 'DISMISSED',
    resolveAnomalyBtn: 'Resolve',
    dismissAnomalyBtn: 'Dismiss',
    anomalyUpdated: 'Anomaly status updated successfully!',
    noAnomaliesFound: 'No anomalies found.',
    adminDatasetTitle: 'National E-Waste Dynamic Dataset Manager',
    adminDatasetSubtitle: 'Export dynamically generated datasets for EPR compliance and policy planning',
    recordsLabel: 'Records',
    schemaFieldsLabel: 'Structured Field Schema:',
    downloadJsonBtn: 'Download JSON',
    downloadCsvBtn: 'CSV Spreadsheet',
    login: 'Login',
    logout: 'Logout',
    roleCollector: 'Collector',
    roleRecycler: 'Recycler',
    roleAdmin: 'Admin',
    phoneRequired: 'Please enter valid 10-digit mobile number',
    verifying: 'Verifying...',
    changeMobile: '← Change Mobile Number',
    sihQuickDemo: 'Quick Demo Login:',

    // Handover Verification
    handoverVerificationTitle: 'Handover & Digital Scale Verification',
    totalWeight: 'Total Weight',
    condition: 'Condition',
    estimatedValue: 'Estimated Value',
    estimatedTotalLabel: 'Estimated Total:',
    pickupIncludedLabel: 'Doorstep Pickup Included',
    eta12h: 'Within 12 Hours',
    eta24h: 'Within 24 Hours (Next Day)',
    eta48h: 'Within 48 Hours',
    notesToCollectorLabel: 'Notes to Collector:',
    handoverSubtitle: 'Record calibrated electronic scale weight, verify collector OTP, and log payment settlement',
    handoverSelectLot: '1. Select Lot for Handover:',
    handoverNoLots: 'No pending lots available',
    handoverActualWeight: '2. Actual Measured Weight (kg):',
    handoverCollectorWeight: 'Collector Estimated Weight:',
    handoverVariance: 'Weight Variance:',
    handoverVarianceWarning: 'Warning: Variance exceeding 30% flags an automated anomaly audit log.',
    handoverEnterOtp: '3. Enter Collector Handover OTP:',
    handoverOtpDesc: '4-digit code displayed on collector screen',
    handoverPaymentMethod: '4. Settlement Method:',
    handoverCash: '💵 Cash on Handover',
    handoverUpi: '📱 Instant UPI Transfer',
    handoverTotalPayable: 'Total Payable Amount:',
    handoverLocationSource: 'Handover Geolocation Source:',
    handoverSignatureTitle: '5. Collector Digital Finger Signature (Optional):',
    handoverClearSig: 'Clear',
    handoverSigDesc: 'Sign on screen to confirm calibrated electronic scale weight',
    handoverDisclaimer: '* This process records an authorized digital ledger voucher in the immutable audit trail.',
    handoverSubmitBtn: 'Complete Digital Handover & Settlement',
    handoverSubmitting: 'Verifying...',
    handoverSuccessTitle: 'Handover & Payment Successfully Verified!',
    handoverVerifiedWeight: 'Verified Actual Weight:',
    handoverTotalSettled: 'Total Payment Settled:',
    handoverNextBtn: '+ Verify Next Handover',
    handoverPleaseSelectLot: 'Please select a lot',
    handoverVerifyFailed: 'Verification failed',
  }
};
