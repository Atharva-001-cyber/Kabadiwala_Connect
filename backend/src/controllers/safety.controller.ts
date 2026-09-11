import { Request, Response } from 'express';

export interface SafetyGuide {
  id: string;
  category: string;
  title: { hi: string; mr: string; en: string };
  audioText: { hi: string; mr: string; en: string };
  hazards: { hi: string[]; mr: string[]; en: string[] };
  dos: { hi: string[]; mr: string[]; en: string[] };
  donts: { hi: string[]; mr: string[]; en: string[] };
  icon: string;
  badgeColor: string;
}

export const safetyGuides: SafetyGuide[] = [
  {
    id: 'safe_battery',
    category: 'BATTERY',
    title: {
      hi: 'बैटरी और लिथियम सेल सुरक्षा',
      mr: 'बॅटरी आणि लिथियम सेल सुरक्षा',
      en: 'Battery & Lithium Cell Safety'
    },
    audioText: {
      hi: 'बैटरी को कभी न जलाएं और न ही तोड़े। यह आग पकड़ सकती है। इसे हमेशा अलग प्लास्टिक कंटेनर में रखें।',
      mr: 'बॅटरी कधीही जाळू नका किंवा फोडू नका. यात आग लागू शकते. हे वेगळे ठेवा.',
      en: 'Never burn, puncture, or crush batteries. Store separately in dry containers and handover directly to authorized recyclers.'
    },
    hazards: {
      hi: ['आग और विस्फोट का गंभीर खतरा', 'जहरीला केमिकल रिसाव', 'त्वचा जलने का खतरा'],
      mr: ['आग आणि स्फोटाचा धोका', 'विषारी रसायनांची गळती', 'त्वचा जळण्याचा धोका'],
      en: ['Fire & thermal runaway hazard', 'Toxic chemical leakage', 'Corrosive acid exposure']
    },
    dos: {
      hi: ['सूखी और ठंडी जगह पर अलग रखें', 'टर्मिनल्स पर टेप लगाएं', 'सीधे अधिकृत रीसाइक्लर को सौंपें'],
      mr: ['कोरड्या आणि थंड ठिकाणी वेगळे ठेवा', 'टर्मिनलवर टेप लावा', 'थेट अधिकृत रिसायकलर्सना द्या'],
      en: ['Store in dry, non-conductive containers', 'Tape exposed terminals', 'Handover intact to authorized recyclers']
    },
    donts: {
      hi: ['कभी भी आग में न जलाएं', 'हथौड़े से न तोड़ें', 'पानी में न फेंकें'],
      mr: ['कधीही आगीत टाकू नका', 'हातोड्याने फोडू नका', 'पाण्यात फेकू नका'],
      en: ['Do NOT burn in open air', 'Do NOT crush or puncture', 'Do NOT discard in normal garbage']
    },
    icon: 'BatteryCharging',
    badgeColor: 'amber'
  },
  {
    id: 'safe_cable',
    category: 'CABLE',
    title: {
      hi: 'तार और केबल - आग लगाने का खतरा',
      mr: 'वायर आणि केबल - जाळण्याचा धोका',
      en: 'Cables & Wire Stripping Safety'
    },
    audioText: {
      hi: 'तारों को कभी भी खुले में न जलाएं। इससे निकलने वाला धुआं फेफड़ों और आंखों के लिए बेहद जहरीला है। अधिकृत रीसाइक्लर पूरी तार का अच्छा दाम देते हैं।',
      mr: 'वायर उघड्यावर कधीही जाळू नका. याचा धूर आरोग्यासाठी घातक आहे. अधिकृत रिसायकलर्स संपूर्ण वायरचे चांगले पैसे देतात.',
      en: 'Never burn insulated cables in open air. Burning produces toxic dioxins and damages lungs. Authorized recyclers pay full fair value for intact insulated cables.'
    },
    hazards: {
      hi: ['कैंसर पैदा करने वाला डाइऑक्सिन धुआं', 'फेफड़ों की गंभीर बीमारी', 'कॉपर धातु का नुकसान'],
      mr: ['कॅन्सर निर्माण करणारा विषारी धूर', 'फुफ्फुसांचे आजार', 'तांब्याचे नुकसान'],
      en: ['Carcinogenic dioxin emissions', 'Severe respiratory damage', 'Loss of copper recovery value']
    },
    dos: {
      hi: ['पूरी इंसुलेटेड तार बिना जलाए बेचें', 'मैकेनिकल स्ट्रिपर का उपयोग करें', 'धूल से बचने के लिए मास्क पहनें'],
      mr: ['संपूर्ण इन्सुलेटेड वायर न जाळता विका', 'वायर स्ट्रिपर वापरा', 'मास्क वापरा'],
      en: ['Sell unstripped to authorized recyclers with mechanical granulators', 'Use hand mechanical strippers if required', 'Wear safety gloves and mask']
    },
    donts: {
      hi: ['कचरे के ढेर में आग न लगाएं', 'प्लास्टिक को न जलाएं', 'धुआं सूंघने से बचें'],
      mr: ['कचऱ्याच्या ढिगाऱ्यात आग लावू नका', 'प्लॅस्टिक जाळू नका', 'धूर घेणे टाळा'],
      en: ['Do NOT burn in open heaps', 'Do NOT use petrol or kerosene to strip', 'Do NOT expose children to stripping sites']
    },
    icon: 'Flame',
    badgeColor: 'red'
  },
  {
    id: 'safe_crt',
    category: 'CRT',
    title: {
      hi: 'सीआरटी और टीवी मॉनिटर सुरक्षा',
      mr: 'सीआरटी आणि टीव्ही मॉनिटर सुरक्षा',
      en: 'CRT & Monitor Handling'
    },
    audioText: {
      hi: 'पुराने टीवी के कांच में लेड और फॉस्फोरस होता है। हथौड़े से स्क्रीन न फोड़ें।',
      mr: 'जुन्या टीव्हीच्या काचेत शिसे असते. हातोड्याने स्क्रीन फोडू नका.',
      en: 'CRT glass contains toxic lead and phosphor powder under high vacuum. Never shatter CRT tubes manually.'
    },
    hazards: {
      hi: ['वैक्यूम इम्प्लोजन (कांच के टुकड़े उड़ना)', 'लेड (सीसा) जहर', 'फास्फोरस सांस में जाना'],
      mr: ['काच उडण्याचा धोका', 'शिशाचे विषबाधा', 'विषारी पावडर'],
      en: ['Implosion & sharp flying glass', 'Lead poisoning', 'Phosphor inhalation']
    },
    dos: {
      hi: ['सावधानी से सीधा रखें', 'मोटे दस्ताने पहनें', 'स्क्रीन को सुरक्षित रखें'],
      mr: ['काळजीपूर्वक सरळ ठेवा', 'जाड हातमोजे वापरा', 'स्क्रीन सुरक्षित ठेवा'],
      en: ['Keep CRT tube intact and upright', 'Wear heavy safety gloves and goggles', 'Transport in cushioned boxes']
    },
    donts: {
      hi: ['कांच को हथौड़े से न फोड़ें', 'तांबा निकालने के लिए ट्यूब न तोड़ें', 'खुले में न छोड़ें'],
      mr: ['काच फोडू नका', 'तांबे काढण्यासाठी ट्यूब फोडू नका', 'उघड्यावर टाकू नका'],
      en: ['Do NOT smash the funnel glass', 'Do NOT inhale inner coating powders', 'Do NOT break neck yolk with hammer']
    },
    icon: 'Tv',
    badgeColor: 'blue'
  },
  {
    id: 'safe_pcb',
    category: 'PCB',
    title: {
      hi: 'पीसीबी और मदरबोर्ड एसिड लीचिंग निषेध',
      mr: 'पीसीबी आणि मदरबोर्ड ऍसिड लीचिंग बंदी',
      en: 'PCB & Motherboard Chemical Safety'
    },
    audioText: {
      hi: 'पीसीबी से सोना निकालने के लिए एसिड या तेजाब का इस्तेमाल न करें। यह जानलेवा है। अधिकृत रीसाइक्लर आधुनिक तकनीक से सोना और तांबा सुरक्षित निकालते हैं।',
      mr: 'पीसीबीमधून सोने काढण्यासाठी ऍसिड वापरू नका. हे धोकादायक आहे. अधिकृत रिसायकलर्स योग्य भाव देतात.',
      en: 'Never use backyard nitric/cyanide acid leaching on circuit boards. Backyard leaching destroys health and environment. Sell intact to authorized hydrometallurgy facilities.'
    },
    hazards: {
      hi: ['नाइट्रिक एसिड का जानलेवा धुआं', 'अंधापन और त्वचा गलना', 'भूजल का विषैला होना'],
      mr: ['ऍसिडचा विषारी धूर', 'डोळे आणि त्वचेला इजा', 'पाणी दूषित होणे'],
      en: ['Lethal nitrous oxide fumes', 'Permanent blindness and chemical burns', 'Groundwater heavy metal pollution']
    },
    dos: {
      hi: ['सर्किट बोर्ड को सूखा रखें', 'बोर्ड को साबुत रखें', 'अधिकृत रीसाइक्लर को बेचें'],
      mr: ['सर्किट बोर्ड कोरडे ठेवा', 'बोर्ड शाबूत ठेवा', 'अधिकृत रिसायकलरला विका'],
      en: ['Keep circuit boards dry and sorted', 'Maintain original components intact', 'Sell to authorized green recyclers']
    },
    donts: {
      hi: ['तेजाब या बर्नर पर न पकाएं', 'नाली में केमिकल न बहाएं', 'घरों में डि-सोल्डरिंग न करें'],
      mr: ['ऍसिड किंवा चुलीवर गरम करू नका', 'नालीत केमिकल टाकू नका', 'घरात काम करू नका'],
      en: ['Do NOT boil in acid pots or open gas stoves', 'Do NOT pour cyanide/acids into soil or drains', 'Do NOT manually desolder in living areas']
    },
    icon: 'Cpu',
    badgeColor: 'emerald'
  },
  {
    id: 'safe_lcd',
    category: 'LCD',
    title: {
      hi: 'एलसीडी और फ्लैट स्क्रीन सुरक्षा',
      mr: 'एलसीडी आणि फ्लॅट स्क्रीन सुरक्षा',
      en: 'LCD & Flat Panel Display Safety'
    },
    audioText: {
      hi: 'एलसीडी स्क्रीन में मरकरी यानी पारे की बैकलाइट ट्यूब हो सकती है। इसे कभी भी मोड़ें या तोड़ें नहीं।',
      mr: 'एलसीडी स्क्रीनमध्ये पारा असू शकतो. स्क्रीन कधीही वाकवू नका किंवा फोडू नका.',
      en: 'LCD panels may contain mercury backlights. Never bend or crush screens. Handover intact to authorized recyclers.'
    },
    hazards: {
      hi: ['पारे (मर्करी) का जहरीला रिसाव', 'कांच के नुकीले टुकड़ों से कटने का डर', 'तरल क्रिस्टल का त्वचा संपर्क'],
      mr: ['पारा गळतीचा धोका', 'काचेच्या तुकड्यांनी इजा', 'स्क्रीन लिक्विडचा संपर्क'],
      en: ['Toxic mercury vapor leakage', 'Sharp glass lacerations', 'Liquid crystal chemical contact']
    },
    dos: {
      hi: ['स्क्रीन को सीधा और सुरक्षित रखें', 'दस्ताने पहनकर उठाएं', 'अधिकृत रीसाइक्लर को सौंपें'],
      mr: ['स्क्रीन सुरक्षित ठेवा', 'हातमोजे वापरा', 'थेट रिसायकलर्सना द्या'],
      en: ['Store upright and cushioned', 'Wear cut-resistant safety gloves', 'Keep CCFL backlights intact']
    },
    donts: {
      hi: ['स्क्रीन को हथौड़े से न तोड़ें', 'कांच को न खुरचें', 'आग में न डालें'],
      mr: ['स्क्रीन फोडू नका', 'काच स्क्रॅच करू नका', 'आगीत टाकू नका'],
      en: ['Do NOT crush screen layers', 'Do NOT expose to open flame', 'Do NOT discard broken panel glass in open soil']
    },
    icon: 'Tv',
    badgeColor: 'cyan'
  },
  {
    id: 'safe_motor',
    category: 'MOTOR',
    title: {
      hi: 'इलेक्ट्रिक मोटर और ट्रांसफार्मर सुरक्षा',
      mr: 'इलेक्ट्रिक मोटर आणि ट्रान्सफॉर्मर सुरक्षा',
      en: 'Electric Motors & Transformers Safety'
    },
    audioText: {
      hi: 'मोटर और ट्रांसफार्मर भारी होते हैं। उठाते समय कमर का ध्यान रखें और पुराने तेल को जमीन पर न बहाएं।',
      mr: 'मोटर आणि ट्रान्सफॉर्मर जड असतात. तेल जमिनीवर सांडू नका.',
      en: 'Heavy motors pose lifting and oil leakage hazards. Never spill transformer coolant oil on soil.'
    },
    hazards: {
      hi: ['भारी वजन से पैर और कमर में चोट', 'ट्रांसफार्मर तेल का जहरीला प्रभाव', 'तांबे की तार से हाथ कटने का खतरा'],
      mr: ['जड वजनाने दुखापत', 'तेल प्रदूषण', 'तांब्याच्या वायरने जखम'],
      en: ['Ergonomic lifting injuries', 'Hazardous dielectric oil spills', 'Sharp copper wire cuts']
    },
    dos: {
      hi: ['उठाने के लिए ट्रॉली या दो लोगों की मदद लें', 'तेल के रिसाव पर सूखा चूना या रेत डालें', 'मोटे चमड़े के दस्ताने पहनें'],
      mr: ['उचलण्यासाठी मदत घ्या', 'तेल गळती रोखा', 'जाड हातमोजे वापरा'],
      en: ['Use mechanical lifting or two-person lift', 'Contain any coolant oil leaks immediately', 'Wear heavy work gloves']
    },
    donts: {
      hi: ['अकेले भारी मोटर न खींचें', 'तेल को नाली में न बहाएं', 'तार निकालने के लिए आग न लगाएं'],
      mr: ['एकट्याने जड मोटर ओढू नका', 'तेल गटारात टाकू नका', 'वायर जाळू नका'],
      en: ['Do NOT lift loads exceeding 25kg alone', 'Do NOT dump transformer oil into drains', 'Do NOT burn motor windings to remove enamel']
    },
    icon: 'Cpu',
    badgeColor: 'purple'
  },
  {
    id: 'safe_magnet',
    category: 'MAGNET',
    title: {
      hi: 'नियोडिमियम मैग्नेट और हार्ड ड्राइव सुरक्षा',
      mr: 'मॅग्नेट आणि हार्ड ड्राइव्ह सुरक्षा',
      en: 'Neodymium Magnets & HDD Assemblies'
    },
    audioText: {
      hi: 'नियोडिमियम चुंबक बहुत शक्तिशाली होते हैं। ये उंगलियों को बुरी तरह दबा सकते हैं और टूटने पर आंख में लग सकते हैं।',
      mr: 'हे चुंबक अतिशय शक्तिशाली असतात. बोटे अडकण्याचा धोका असतो. चष्मा वापरा.',
      en: 'Neodymium rare-earth magnets have intense pull forces. Keep away from fingers and wear eye protection against shattering.'
    },
    hazards: {
      hi: ['उंगलियां दबने और हड्डी टूटने का जोखिम', 'चुंबक टकराने पर धातु के टुकड़े उड़ना', 'पेसमेकर और इलेक्ट्रॉनिक उपकरण को नुकसान'],
      mr: ['बोटांना गंभीर दुखापत', 'तुकडे डोळ्यात जाणे', 'इलेक्ट्रॉनिक वस्तूंचे नुकसान'],
      en: ['Severe pinching and blood blisters', 'Brittle shattering eye hazard', 'Interference with medical pacemakers']
    },
    dos: {
      hi: ['चुंबकों को हमेशा अलग लकड़ी या कार्डबोर्ड में रखें', 'सुरक्षा चश्मा पहनें', 'मोबाइल और कार्ड्स से दूर रखें'],
      mr: ['चुंबक लाकडाच्या बॉक्समध्ये ठेवा', 'सुरक्षा चष्मा वापरा', 'मोबाईलपासून दूर ठेवा'],
      en: ['Separate with thick cardboard or plastic spacers', 'Wear protective eye goggles', 'Keep at safe distance from cards and phones']
    },
    donts: {
      hi: ['दो बड़े चुंबकों को पास में न छोड़ें', 'हथौड़े से न मारें', 'बच्चों की पहुंच में न रखें'],
      mr: ['दोन मोठे चुंबक जवळ आणू नका', 'हातोड्याने मारू नका', 'मुलांपासून दूर ठेवा'],
      en: ['Do NOT allow magnets to snap together uncontrolled', 'Do NOT hammer brittle neodymium', 'Do NOT heat above 80 degrees Celsius']
    },
    icon: 'Cpu',
    badgeColor: 'rose'
  },
  {
    id: 'safe_plastic',
    category: 'MIXED_PLASTIC',
    title: {
      hi: 'मिश्रित ई-कचरा प्लास्टिक सुरक्षा',
      mr: 'मिश्रित ई-कचरा प्लॅस्टिक सुरक्षा',
      en: 'Mixed E-Waste Plastics & Flame Retardants'
    },
    audioText: {
      hi: 'ई-कचरे के प्लास्टिक में केमिकल और फ्लेम रिटार्डेंट होते हैं। इसे कभी भी बर्तन या खिलौने बनाने वाले कबाड़ में न मिलाएं और न जलाएं।',
      mr: 'ई-कचऱ्याच्या प्लॅस्टिकमध्ये रसायने असतात. हे घरगुती प्लॅस्टिकमध्ये मिसळू नका आणि जाळू नका.',
      en: 'Electronic plastics contain Brominated Flame Retardants (BFRs). Never mix with food-grade plastic and never incinerate openly.'
    },
    hazards: {
      hi: ['ब्रोमिनेटेड फ्लेम रिटार्डेंट्स (BFR) का जहर', 'प्लास्टिक जलाने से जहरीली गैस', 'खाद्य बर्तनों के प्लास्टिक में मिलावट'],
      mr: ['विषारी रसायनांचा धोका', 'जाळल्यास विषारी वायू', 'अन्नाच्या भांड्यात मिश्रण टाळा'],
      en: ['Toxic brominated flame retardant exposure', 'Harmful dioxin and furan combustion fumes', 'Downcycling contamination of food-grade plastics']
    },
    dos: {
      hi: ['ई-कचरे के प्लास्टिक को अलग बोरे में रखें', 'साफ-सुथरे सूखे प्लास्टिक को अधिकृत रीसाइक्लर को दें', 'काम करते समय मास्क लगाएं'],
      mr: ['प्लॅस्टिक वेगळ्या गोणीत ठेवा', 'अधिकृत रिसायकलरला द्या', 'मास्क वापरा'],
      en: ['Keep electronic plastic segregated in marked bags', 'Provide sorted polymers to authorized granulators', 'Wear particulate dust masks']
    },
    donts: {
      hi: ['खुले में कभी न जलाएं', 'घरेलू प्लास्टिक के साथ न मिलाएं', 'गर्म प्लास्टिक का धुआं न सूंघें'],
      mr: ['कधीही जाळू नका', 'घरगुती प्लॅस्टिकमध्ये मिसळू नका', 'धूर घेणे टाळा'],
      en: ['Do NOT burn in backyard heaps', 'Do NOT melt in crude domestic stoves', 'Do NOT mix with consumer food containers']
    },
    icon: 'Cpu',
    badgeColor: 'teal'
  }
];

export const getSafetyGuides = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    count: safetyGuides.length,
    guides: safetyGuides
  });
};
