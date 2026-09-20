import { Language, UserRole } from '../types';

export interface CopilotCalculationItem {
  category: string;
  weightKg: number;
  ratePerKg: number;
  subtotal: number;
  label: { hi: string; mr: string; en: string };
}

export interface CopilotCalculation {
  items: CopilotCalculationItem[];
  total: number;
}

export type CopilotActionType =
  | 'NAVIGATE'
  | 'TOGGLE_THEME'
  | 'CHANGE_LANGUAGE'
  | 'OPEN_CAMERA'
  | 'PLAY_SOUNDBOX';

export interface CopilotAction {
  type: CopilotActionType;
  route?: string;
  label?: string;
  targetTheme?: 'light' | 'dark';
  targetLang?: Language;
  amount?: number;
}

export interface CopilotResponse {
  text: string;
  spokenText: string;
  action?: CopilotAction;
  calculation?: CopilotCalculation;
  soundbox?: boolean;
  source: 'LOCAL_EDGE_BRAIN' | 'GEMINI_CLOUD_COPILOT';
}

export interface CopilotContextData {
  history?: Array<{ sender: string; text: string }>;
  fetchedAt?: number;
  role: UserRole;
  language: Language;
  userName: string;
  district: string;
  kycStatus?: string;
  userVerified?: boolean;
  rates: {
    pcb: number;
    battery: number;
    cable: number;
    display: number;
    appliance: number;
    motor: number;
  };
  collectorData?: {
    totalEarnings: number;
    totalWeightKg: number;
    activeLotsCount: number;
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
  };
  recyclerData?: {
    facilityName?: string;
    pendingPickupsCount: number;
    totalStockKg: number;
    totalDisbursed: number;
  };
  adminData?: {
    totalTonsDiverted: number;
    registeredRecyclers: number;
    activeStates: number;
    openAnomalies: number;
  };
}

/**
 * Web Audio API Soundbox Chime Synthesizer
 * Plays high-fidelity 4-tone melodic ascending banking chime (like Paytm / PhonePe Soundbox)
 * 100% offline, 0 external assets, instantaneous response.
 */
export function playSoundboxChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Harmonious chord notes: E5, G#5, B5, E6
    const notes = [659.25, 830.61, 987.77, 1318.51];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.28);
    });
  } catch (e) {
    console.warn('[Soundbox] AudioContext chime error:', e);
  }
}

/**
 * Number to Vernacular Words Pronouncer
 * Formats currencies and units for natural speech synthesis without English distortions
 */
export function formatSpeechText(text: string, lang: Language): string {
  if (!text) return '';
  let cleaned = text;

  if (lang === 'hi') {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 रुपये')
      .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, '$1 किलो')
      .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, '$1 किलोमीटर')
      .replace(/CPCB/g, 'सी पी सी बी')
      .replace(/EPR/g, 'ई पी आर')
      .replace(/PCB/g, 'पी सी बी')
      .replace(/UPI/g, 'यू पी आई')
      .replace(/OTP/g, 'ओ टी पी');
  } else if (lang === 'mr') {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 रुपये')
      .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, '$1 किलो')
      .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, '$1 किलोमीटर')
      .replace(/CPCB/g, 'सी पी सी बी')
      .replace(/EPR/g, 'ई पी आर')
      .replace(/PCB/g, 'पी सी बी')
      .replace(/UPI/g, 'यू पी आई')
      .replace(/OTP/g, 'ओ टी पी');
  } else {
    cleaned = cleaned
      .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 rupees')
      .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, '$1 kilograms')
      .replace(/(\d+(?:\.\d+)?)\s*km\b/gi, '$1 kilometers');
  }

  return cleaned;
}

/**
 * Voice Copilot Intelligent Multilingual Processing Engine
 */
export class VoiceCopilotEngine {
  public static async processUserQuery(queryText: string, context: CopilotContextData): Promise<CopilotResponse> {
    const q = queryText.trim().toLowerCase();
    const lang = context.language;
    const pick = (en: string, hi: string, mr: string) => lang === 'hi' ? hi : lang === 'mr' ? mr : en;
    const reply = (text: string, action?: CopilotAction): CopilotResponse =>
      ({ text, spokenText: formatSpeechText(text, lang), action, source: 'LOCAL_EDGE_BRAIN' });

    const has = (r: RegExp) => r.test(q);

    // Smart Intent Classifier: Action commands vs Interrogative troubleshooting questions
    const isQuestion = has(/\b(why|how|kaise|kyun|kyu|problem|issue|nahi|nait|not|error|trouble|help|kya|what)\b|कैसे|क्यों|नहीं|समस्या|कसे|काय|अडचण/);
    const isExplicitAction = has(/\b(open|kholo|dikhao|chalo|jao|start|scan|khincho)\b|खोल|दिखा|उघड|दाखव|काढा|स्कॅन/);

    const root = context.role === 'ADMIN' ? '/admin' : context.role === 'RECYCLER' ? '/recycler' : '/collector';
    const action = (route: string, label: string): CopilotAction => ({ type: 'NAVIGATE', route, label });

    const unavailable = pick(
      'No active record found in your account data.',
      'अभी आपके खाते के डेटाबेस में कोई सक्रिय रिकॉर्ड नहीं मिला।',
      'सध्या खात्याच्या डेटाबेसमध्ये कोणतीही नोंद आढळली नाही.'
    );

    // 1. Emergency & Safety Rules
    if (has(/swollen|phooli|blast|burn|acid|tezaab|aag|गरम|फूली|आग|तेजाब|धोका/)) {
      return reply(pick(
        'Stop handling damaged or hot batteries immediately. Do not charge, puncture, burn, or open them. Keep people away and call emergency services if there is smoke or fire.',
        'खराब या गरम बैटरी को तुरंत छूना बंद करें! इन्हें चार्ज, पंचर, या खोलने की कोशिश न करें। धुआं या आग होने पर आपातकालीन सहायता लें।',
        'खराब किंवा गरम बॅटरी ताबडतोब हाताळणे थांबवा! चार्ज, छिद्र किंवा उघडण्याचा प्रयत्न करू नका. धूर असल्यास आपत्कालीन मदत घ्या.'
      ));
    }

    // 2. Stop / Cancel Command
    if (has(/\b(cancel|stop|ruk|ruko)\b|रुको|बंद करो|थांब/)) {
      return reply(pick(
        'Stopped. No transaction or changes have been made.',
        'रुक गया। कोई लेन-देन या बदलाव नहीं किया गया।',
        'थांबलो. कोणताही व्यवहार किंवा बदल केलेला नाही.'
      ));
    }

    // 3. Profile & Real KYC Verification Inquiries
    if (has(/\b(kyc|profile|aadhaar|pan|verification|verify)\b|आधार|बैंक|केवाईसी|सत्यापन|प्रोफाइल/)) {
      const isVerified = context.userVerified || context.kycStatus === 'VERIFIED' || context.kycStatus === 'APPROVED';
      const isPending = context.kycStatus === 'PENDING' || context.kycStatus === 'UNDER_REVIEW';

      if (isVerified) {
        return reply(
          pick(
            'Your KYC & profile verification is complete and approved under CPCB norms.',
            'आपका KYC एवं प्रोफाइल सत्यापन CPCB नियमों के तहत पूर्ण और स्वीकृत है।',
            'तुमचे KYC आणि प्रोफाइल सत्यापन CPCB नियमांनुसार पूर्ण आणि मंजूर आहे.'
          ),
          action(root + '/profile', 'View Profile')
        );
      } else if (isPending) {
        return reply(
          pick(
            'Your KYC verification is currently under review by CPCB authority.',
            'आपका KYC सत्यापन वर्तमान में समीक्षाधीन (Pending) है। जल्द ही अपडेट होगा।',
            'तुमचे KYC सत्यापन सध्या पुनरावलोकनाधीन आहे.'
          ),
          action(root + '/profile', 'Check Profile')
        );
      } else {
        return reply(
          pick(
            'Your account KYC is not verified yet. Please upload your Aadhaar/PAN in profile.',
            'आपका खाता अभी सत्यापित नहीं है। कृपया प्रोफाइल पेज पर आधार या पैन दस्तावेज अपलोड करें।',
            'तुमचे खाते अद्याप सत्यापित नाही. कृपया प्रोफाइलमध्ये आधार/पॅन अपलोड करा.'
          ),
          action(root + '/profile', 'Complete KYC')
        );
      }
    }

    // 4. Critical Financial Action Protection (No Voice Execution of Payments/Deletions)
    if (has(/\b(pay|transfer|accept offer|delete|approve)\b|पैसे भेज|ऑफर स्वीकार|मिटा|हटाओ/)) {
      return reply(pick(
        'For security, payments, offer acceptances, and deletions cannot be executed by voice. Please confirm them manually on the screen.',
        'सुरक्षा कारणों से, भुगतान, ऑफर स्वीकारना या रिकॉर्ड डिलीट करना आवाज से नहीं किया जा सकता। कृपया संबंधित स्क्रीन पर स्वयं पुष्टि करें।',
        'सुरक्षिततेसाठी, पेमेंट, ऑफर स्वीकारणे किंवा हटवणे आवाजाने केले जात नाही. कृपया स्क्रीनवर स्वतः पुष्टी करा.'
      ));
    }

    // 5. Camera & Vision Scanner (Disambiguate Problem Questions vs Explicit Open Command)
    if (has(/camera|photo|scan|vision|कैमरा|फोटो|स्कैन/)) {
      if (isQuestion) {
        return reply(
          pick(
            'Camera troubleshooting: Open Add Lot screen and allow browser camera permissions. Ensure good lighting and hold e-waste clearly.',
            'कैमरा सहायता: नया लॉट (Add Lot) खोलें और ब्राउज़र में कैमरा अनुमति (Permission) दें। अच्छी रोशनी में ई-कचरे की फोटो साफ खींचें।',
            'कॅमेरा मदत: नवीन लॉट उघडा आणि ब्राउझरमध्ये कॅमेरा परवानगी द्या. चांगल्या उजेडात फोटो काढा.'
          ),
          context.role === 'COLLECTOR' ? action('/collector/add', 'Add Lot') : undefined
        );
      }

      if (isExplicitAction && context.role === 'COLLECTOR') {
        return reply(
          pick('Opening camera scanner...', 'कैमरा स्कैनर खोल रहा हूँ...', 'कॅमेरा स्कॅनर उघडत आहे...'),
          { type: 'OPEN_CAMERA', route: '/collector/add', label: 'Open Camera' }
        );
      }

      return reply(
        pick(
          'MobileNet AI supports 8 e-waste material classes. Use Add Lot → Camera to scan your scrap.',
          'मोबाइलनेट AI विजन 8 ई-कचरा श्रेणियों को पहचानता है। नया लॉट → कैमरा से अपना स्क्रैप स्कैन करें।',
          'मोबाईलनेट AI 8 ई-कचरा श्रेणी ओळखतो. नवीन लॉट → कॅमेरा वापरून स्कॅन करा.'
        ),
        context.role === 'COLLECTOR' ? action('/collector/add', 'Add Lot') : undefined
      );
    }

    // 6. Language & Theme Quick Switch
    if ((isExplicitAction || has(/bolo|karo|switch|speak|बोल|बदलो|बदला/)) && !isQuestion && has(/hindi|हिंदी|marathi|मराठी|english|अंग्रेजी/)) {
      const targetLang = has(/marathi|मराठी/) ? 'mr' : has(/hindi|हिंदी/) ? 'hi' : 'en';
      return reply(pick('Language updated.', 'भाषा बदल दी गई है।', 'भाषा बदलली आहे.'), { type: 'CHANGE_LANGUAGE', targetLang });
    }

    if (!isQuestion && has(/(light|dark) (mode|theme)|लाइट मोड|डार्क मोड/)) {
      return reply(pick('Theme updated.', 'थीम बदल दी गई है।', 'थीम बदलली आहे.'), { type: 'TOGGLE_THEME', targetTheme: has(/dark|डार्क/) ? 'dark' : 'light' });
    }

    // 7. Material Rates & Calculators (with Multi-turn Context Resolution)
    const materialRules: Array<[keyof CopilotContextData['rates'], RegExp, string]> = [
      ['pcb', /pcb|motherboard|circuit|पीसीबी|सर्किट/, 'PCB'],
      ['battery', /battery|batteries|बैटरी|बॅटरी/, 'Battery'],
      ['cable', /cable|wire|तार|केबल/, 'Cable'],
      ['display', /lcd|led|display|स्क्रीन/, 'LCD Screen'],
      ['motor', /motor|मोटर/, 'Motor'],
      ['appliance', /fridge|washing|refrigerator|प्लास्टिक|उपकरण/, 'Mixed E-Waste']
    ];

    let material = materialRules.find(([, r]) => r.test(q));
    const isFollowup = has(/\b(aur|and|uska|iska|woh|that|it|same|kitna|kitne|kitni)\b|और|उसका|इसका|त्याचे|आणि/) || /^\d/.test(q);

    // Resolve context from conversation history if follow-up
    if (!material && isFollowup) {
      const previous = [...(context.history || [])].reverse().find(m => m.sender === 'user' && materialRules.some(([, r]) => r.test(m.text.toLowerCase())));
      if (previous) {
        material = materialRules.find(([, r]) => r.test(previous.text.toLowerCase()));
      }
    }

    if (material || has(/rate|price|bhav|bhaav|daam|kimat|भाव|कीमत|दर|किलो|\bkg\b/)) {
      const requested = materialRules.filter(([, r]) => r.test(q));
      if (requested.length > 1) {
        return reply(pick(
          'Please specify one material and weight at a time.',
          'एक बार में एक ही सामग्री और उसका वजन पूछें, ताकि हिसाब सटीक रहे।',
          'एका वेळी एकच साहित्य आणि वजन सांगा.'
        ));
      }

      if (!material) {
        return reply(
          pick(
            'Available categories: PCB, Battery, Cable, LCD, Motor, Appliances. Which rate would you like to check?',
            'उपलब्ध श्रेणियां: PCB, बैटरी, केबल, LCD, मोटर, उपकरण। किस सामग्री का भाव देखना चाहते हैं?',
            'उपलब्ध श्रेणी: PCB, बॅटरी, केबल, LCD, मोटर. कोणत्या साहित्याचा दर पाहायचा आहे?'
          ),
          action(root === '/collector' ? '/collector/prices' : root, 'Price Board')
        );
      }

      const rate = context.rates[material[0]];
      if (!Number.isFinite(rate)) {
        return reply(pick(
          `Market rate for ${material[2]} is currently being updated on the price board.`,
          `${material[2]} का नया भाव वर्तमान में अपडेट हो रहा है। कृपया भाव बोर्ड देखें।`,
          `${material[2]} चा नवीन दर अपडेट होत आहे.`
        ), action(root === '/collector' ? '/collector/prices' : root, 'Price Board'));
      }

      const normalized = q.replace(/[०-९]/g, c => String(c.charCodeAt(0) - 2406));
      const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|किलो|किलोग्राम)?/);
      const weight = weightMatch ? Number(weightMatch[1]) : null;

      if (weight !== null && (weight <= 0 || weight > 100000)) {
        return reply(pick('Please enter a valid weight in kg.', 'कृपया सही वजन किलो में दर्ज करें।', 'कृपया योग्य वजन किलोमध्ये सांगा.'));
      }

      const total = weight === null ? null : Math.round(weight * rate * 100) / 100;
      return reply(pick(
        `${material[2]} rate: ₹${rate}/kg.${total !== null ? ` ${weight} kg ≈ ₹${total}.` : ''} (Official CPCB regional Mandi benchmark)`,
        `${material[2]} भाव: ₹${rate}/किलो।${total !== null ? ` ${weight} किलो का अनुमानित मूल्य ≈ ₹${total}।` : ''} (सीपीसीबी क्षेत्रीय मंडी बेंचमार्क)`,
        `${material[2]} दर: ₹${rate}/किलो.${total !== null ? ` ${weight} किलो चे अंदाजे मूल्य ≈ ₹${total}.` : ''} (सीपीसीबी प्रादेशिक मंडी बेंचमार्क)`
      ));
    }

    // 8. Earnings & Ledger Queries (Strict Real Data from DB/Context)
    if (has(/earning|kamai|ledger|balance|payment|paisa|paise|कमाई|पैसे|भुगतान|हिसाब/)) {
      const isLastPaymentQuery = has(/last|latest|today|yesterday|pending|kab|when|पिछल|आज|कल|कब|कधी|शेवट/);
      const colData = context.collectorData;

      if (context.role === 'COLLECTOR') {
        if (isLastPaymentQuery) {
          if (colData && Number.isFinite(colData.lastPaymentAmount) && colData.lastPaymentAmount! > 0) {
            return reply(
              pick(
                `Your last recorded payment was ₹${colData.lastPaymentAmount}${colData.lastPaymentDate ? ` on ${colData.lastPaymentDate}` : ''}.`,
                `आपका पिछला दर्ज भुगतान ₹${colData.lastPaymentAmount} था।`,
                `तुमचे शेवटचे नोंदवलेले पेमेंट ₹${colData.lastPaymentAmount} होते.`
              ),
              action('/collector/ledger', 'View Ledger')
            );
          } else {
            return reply(
              pick(
                'No previous payment transaction is recorded in your account yet.',
                'आपके खाते में अभी कोई पिछला भुगतान लेनदेन दर्ज नहीं है।',
                'तुमच्या खात्यात अद्याप कोणतेही मागील पेमेंट नोंदवलेले नाही.'
              ),
              action('/collector/ledger', 'View Ledger')
            );
          }
        }

        const totalEarn = colData?.totalEarnings;
        if (Number.isFinite(totalEarn) && totalEarn! >= 0) {
          return reply(
            pick(
              `Your verified app ledger records total earnings of ₹${totalEarn}.`,
              `आपके ऐप लेजर में कुल ₹${totalEarn} की कमाई दर्ज है।`,
              `तुमच्या ॲप लेजरमध्ये एकूण ₹${totalEarn} ची कमाई नोंदवली आहे.`
            ),
            action('/collector/ledger', 'View Ledger')
          );
        }

        return reply(unavailable, action('/collector/ledger', 'View Ledger'));
      }

      if (context.role === 'RECYCLER') {
        const totalDisbursed = context.recyclerData?.totalDisbursed;
        if (Number.isFinite(totalDisbursed) && totalDisbursed! >= 0) {
          return reply(
            pick(
              `Total payouts disbursed from your facility ledger: ₹${totalDisbursed}.`,
              `आपकी सुविधा से कुल ₹${totalDisbursed} का भुगतान किया गया है।`,
              `तुमच्या केंद्रातून एकूण ₹${totalDisbursed} चे पेमेंट वितरित केले गेले आहे.`
            ),
            action('/recycler/payments', 'View Disbursements')
          );
        }
      }
    }

    // 9. Pickup & Logistics Status
    if (has(/pickup|track|gaadi|driver|status|पिकअप|गाड़ी|स्थिति|कुठे/)) {
      if (context.role === 'RECYCLER') {
        const pendingCount = context.recyclerData?.pendingPickupsCount;
        if (Number.isFinite(pendingCount)) {
          return reply(
            pick(
              `You have ${pendingCount} pending pickup assignment(s).`,
              `आपके पास वर्तमान में ${pendingCount} पेंडिंग पिकअप कार्य हैं।`,
              `तुमच्याकडे सध्या ${pendingCount} प्रलंबित पिकअप आहेत.`
            ),
            action('/recycler/pickups', 'Pickup Management')
          );
        }
      }

      return reply(
        pick(
          'Check active pickup status and driver details in live tracking.',
          'पिकअप स्थिति और वाहन विवरण लाइव ट्रैकिंग पेज पर देखें।',
          'पिकअप स्थिती आणि ड्रायव्हर माहिती ट्रॅकिंग पेजवर पाहा.'
        ),
        action(root === '/collector' ? '/collector/tracking' : root === '/recycler' ? '/recycler/pickups' : root, 'Track Pickups')
      );
    }

    // 10. Offline Sync & IndexedDB Knowledge
    if (has(/offline|internet|sync|ऑफ़लाइन|इंटरनेट|सिंक/)) {
      return reply(pick(
        'Offline drafts are saved locally in IndexedDB. They auto-sync securely once network connection is restored.',
        'ऑफलाइन ड्राफ्ट IndexedDB में सुरक्षित रहते हैं। इंटरनेट आते ही वे स्वतः सर्वर से सिंक हो जाएंगे।',
        'ऑफलाइन मसुदे IndexedDB मध्ये सुरक्षित असतात. नेटवर्क येताच ते आपोआप सिंक होतील.'
      ));
    }

    // 11. Selling & Lot Creation Flow
    if (has(/sell|bech|lot|बेच|विक|लॉट/)) {
      return reply(
        pick(
          'To sell e-waste: Add Photo → Confirm Category → Enter Weight → Review Estimated Price → Submit Lot.',
          'ई-कचरा बेचने की प्रक्रिया: फोटो जोड़ें → श्रेणी चुनें → वजन भरें → अनुमानित मूल्य देखें → लॉट सबमिट करें।',
          'ई-कचरा विक्री प्रक्रिया: फोटो जोडा → श्रेणी निवडा → वजन भरा → अंदाज पाहा → लॉट सादर करा.'
        ),
        context.role === 'COLLECTOR' ? action('/collector/add', 'Create Lot') : undefined
      );
    }

    // 12. Recycler Inventory & Admin Metrics
    if (has(/inventory|stock|स्टॉक|इन्वेंटरी/)) {
      if (context.role === 'RECYCLER') {
        const stockKg = context.recyclerData?.totalStockKg;
        if (Number.isFinite(stockKg) && stockKg! >= 0) {
          return reply(
            pick(
              `Current facility inventory stock: ${stockKg} kg.`,
              `आपकी रिसाइक्लिंग केंद्र में वर्तमान कुल स्टॉक: ${stockKg} किग्रा है।`,
              `तुमच्या केंद्रातील सध्याचा एकूण साठा: ${stockKg} किग्रॅ आहे.`
            ),
            action('/recycler/inventory', 'View Inventory')
          );
        }
      }
    }

    if (has(/admin|metric|anomaly|fraud|dispute|शिकायत|धोखा|विसंगति/)) {
      if (context.role === 'ADMIN') {
        const anomalies = context.adminData?.openAnomalies;
        return reply(
          pick(
            `CPCB Dashboard: ${Number.isFinite(anomalies) ? anomalies : 0} open integrity anomaly flags recorded.`,
            `सीपीसीबी डैशबोर्ड: ${Number.isFinite(anomalies) ? anomalies : 0} खुली विसंगति फ्लैग दर्ज हैं।`,
            `CPCB डॅशबोर्ड: ${Number.isFinite(anomalies) ? anomalies : 0} उघड्या विसंगती नोंदी आहेत.`
          ),
          action('/admin/anomalies', 'Anomaly Monitor')
        );
      }
    }

    // 13. General Greetings
    if (/^(hi|hello|hey|namaste|नमस्ते|नमस्कार)[!. ]*$/.test(q)) {
      return reply(pick(
        `Hello ${context.userName || 'Dost'}! Ask about Mandi rates, selling e-waste, earnings, or camera scanner.`,
        `नमस्ते ${context.userName || 'दोस्त'}! आप मंडी भाव, ई-कचरा बेचने, कमाई, या कैमरा स्कैनर के बारे में पूछ सकते हैं।`,
        `नमस्कार ${context.userName || 'मित्र'}! मंडी दर, विक्री, किंवा कॅमेरा स्कॅनरबद्दल विचारा.`
      ));
    }

    // 14. Intelligent Fallback (Clear, Honest Guidance)
    return reply(pick(
      'I am Kabaad Saathi. Ask me about Mandi rates (e.g. "10kg PCB price"), camera scanner, active earnings, or selling e-waste.',
      'मैं कबाड़ साथी हूँ। मुझसे मंडी भाव (जैसे "10 किलो PCB का भाव"), कैमरा स्कैनर, कमाई, या ई-कचरा बेचने के बारे में पूछें।',
      'मी कबाडी साथी आहे. दर, कॅमेरा स्कॅनर, किंवा विक्रीबद्दल विचारा.'
    ));
  }
}
