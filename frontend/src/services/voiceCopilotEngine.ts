import { Language, UserRole } from '../types';
import { getGeminiApiKey } from '../utils/visionClassifier';

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
  role: UserRole;
  language: Language;
  userName: string;
  district: string;
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
  /**
   * Main entrypoint to process query with full domain awareness
   */
  public static async processUserQuery(
    queryText: string,
    context: CopilotContextData
  ): Promise<CopilotResponse> {
    const raw = queryText.trim();
    const q = raw.toLowerCase();
    const { role, language, district, rates, userName } = context;

    // Detect Hinglish / Indic phrases in user voice input
    const isHinglish = /\b(ham|hum|apna|apne|apni|kaise|kya|hai|hain|karna|karein|karo|bhai|bhaiya|bhej|bhejein|bhejna|bhejte|daam|paisa|paise|bhav|bhaav|kahan|mera|meri|kabaad|kooda|chahiye|sakte|kab|milenge|kholo|chalao|badlo|dikhao|batao|kilo|kitna|kitne)\b/i.test(q);
    const targetLang: Language = isHinglish ? 'hi' : language;

    // -------------------------------------------------------------
    // 1. SYSTEM ACTIONS: THEME TOGGLE VIA VOICE
    // -------------------------------------------------------------
    if (
      q.includes('light mode') ||
      q.includes('daylight mode') ||
      q.includes('light theme') ||
      q.includes('light karo') ||
      q.includes('safed karo')
    ) {
      const msg = targetLang === 'hi'
        ? 'जी भैया, Clean National DPI Light Mode सक्रिय कर दिया गया है।'
        : targetLang === 'mr'
        ? 'Clean DPI Light Mode सक्रिय केले आहे.'
        : 'Switched to National Clean DPI Light Mode.';
      return {
        text: msg,
        spokenText: msg,
        action: { type: 'TOGGLE_THEME', targetTheme: 'light' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    if (
      q.includes('dark mode') ||
      q.includes('dark theme') ||
      q.includes('dark karo') ||
      q.includes('kala karo') ||
      q.includes('night mode')
    ) {
      const msg = targetLang === 'hi'
        ? 'Enterprise Slate Dark Mode सक्रिय कर दिया गया है।'
        : targetLang === 'mr'
        ? 'Enterprise Dark Mode सक्रिय केले आहे.'
        : 'Switched to Enterprise Slate Dark Mode.';
      return {
        text: msg,
        spokenText: msg,
        action: { type: 'TOGGLE_THEME', targetTheme: 'dark' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // -------------------------------------------------------------
    // 2. SYSTEM ACTIONS: LANGUAGE SWITCH VIA VOICE
    // -------------------------------------------------------------
    if (
      q.includes('hindi me') ||
      q.includes('hindi karo') ||
      q.includes('hindi bolo') ||
      q.includes('switch to hindi') ||
      q.includes('speak hindi')
    ) {
      const msg = 'नमस्ते! अब ऐप और कबाड़ साथी हिंदी में बात करेंगे।';
      return {
        text: msg,
        spokenText: msg,
        action: { type: 'CHANGE_LANGUAGE', targetLang: 'hi' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    if (
      q.includes('marathi me') ||
      q.includes('marathi madhe') ||
      q.includes('marathi kara') ||
      q.includes('switch to marathi')
    ) {
      const msg = 'नमस्कार! आता ॲप आणि कबाडी साथी मराठीत संवाद साधतील.';
      return {
        text: msg,
        spokenText: msg,
        action: { type: 'CHANGE_LANGUAGE', targetLang: 'mr' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    if (
      q.includes('english me') ||
      q.includes('english karo') ||
      q.includes('switch to english') ||
      q.includes('speak english')
    ) {
      const msg = 'Switched application and voice assistance to English.';
      return {
        text: msg,
        spokenText: msg,
        action: { type: 'CHANGE_LANGUAGE', targetLang: 'en' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // -------------------------------------------------------------
    // 3. DYNAMIC SCRAP VALUATION CALCULATOR (VOICE MATH)
    // E.g. "12 kilo PCB aur 5 kilo battery ka kitna banega"
    // -------------------------------------------------------------
    const calcResult = this.parseCalculationIntent(q, rates, targetLang);
    if (calcResult) {
      return calcResult;
    }

    // -------------------------------------------------------------
    // 4. ROLE-SPECIFIC INTENTS & WORKFLOW DISPATCH
    // -------------------------------------------------------------

    // --- A. RECYCLER OPERATIONAL QUERIES ---
    if (role === 'RECYCLER') {
      const recyclerRes = this.handleRecyclerQuery(q, context, targetLang);
      if (recyclerRes) return recyclerRes;
    }

    // --- B. ADMIN REGULATORY QUERIES ---
    if (role === 'ADMIN') {
      const adminRes = this.handleAdminQuery(q, context, targetLang);
      if (adminRes) return adminRes;
    }

    // --- C. COLLECTOR SCRAP & EARNINGS QUERIES ---
    const collectorRes = this.handleCollectorQuery(q, context, targetLang);
    if (collectorRes) return collectorRes;

    // -------------------------------------------------------------
    // 5. CLOUD GEMINI 1.5 FLASH FALLBACK (IF ONLINE & KEY PRESENT)
    // -------------------------------------------------------------
    const apiKey = getGeminiApiKey();
    if (apiKey && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const geminiReply = await this.queryGeminiFlash(raw, context, targetLang, apiKey);
        if (geminiReply) {
          return {
            text: geminiReply,
            spokenText: formatSpeechText(geminiReply, targetLang),
            source: 'GEMINI_CLOUD_COPILOT'
          };
        }
      } catch (err) {
        console.warn('[VoiceEngine] Gemini 1.5 Flash fallback error, using local brain:', err);
      }
    }

    // -------------------------------------------------------------
    // 6. DEFAULT POLITE OMNISCIENT FALLBACK
    // -------------------------------------------------------------
    let defaultMsg = '';
    if (role === 'RECYCLER') {
      defaultMsg = targetLang === 'hi'
        ? `नमस्ते! रीसाइक्लिंग केंद्र परिचालन में सहायता के लिए पूछें: "पेंडिंग पिकअप दिखाओ", "इन्वेंटरी स्टॉक कितना है?", "Form-6 नियम क्या हैं?", या "हैंडओवर सत्यापित करें"।`
        : targetLang === 'mr'
        ? `नमस्कार! रीसायकलिंग ऑपरेशन्ससाठी विचारा: "पेंडिंग पिकअप दाखवा", "इन्व्हेंटरी स्टॉक किती आहे?", किंवा "Form-6 नियम सांगा".`
        : `Hello! For recycling facility operations, you can ask: "Show pending pickups", "What is current stock?", "Form-6 rules", or "Verify handover".`;
    } else if (role === 'ADMIN') {
      defaultMsg = targetLang === 'hi'
        ? `नमस्ते विनियामक अधिकारी महोदय! CPCB राष्ट्रीय ई-कचरा पोर्टल हेतु पूछें: "राष्ट्रीय रीसाइक्लिंग दर क्या है?", "सक्रिय रीसाइक्लर्स कितने हैं?", या "धोखाधड़ी विसंगतियां दिखाएं"।`
        : targetLang === 'mr'
        ? `नमस्कार नियामक अधिकारी! राष्ट्रीय ई-कचरा देखरेखीसाठी विचारा: "एकूण रीसायकलिंग दर किती?", किंवा "विसंगती अलर्ट दाखवा".`
        : `Greetings Regulatory Officer! You can ask: "National recycling metrics?", "Total registered recyclers?", or "Show fraud anomalies".`;
    } else {
      defaultMsg = targetLang === 'hi'
        ? `नमस्ते ${userName || 'कबाड़ी भाई'}! मैं कबाड़ साथी हूँ। आप पूछ सकते हैं: "10 किलो PCB का भाव कितना है?", "कबाड़ कैसे बेचें?", "मेरी कमाई कितनी है?", या "सुरक्षा नियम बताएं"।`
        : targetLang === 'mr'
        ? `नमस्कार ${userName || 'भाऊ'}! मी कबाडी साथी आहे. आपण विचारू शकता: "10 किलो PCB चे किती पैसे मिळतील?", "कचरा कसा विकावा?", किंवा "सुरक्षा नियम".`
        : `Hello ${userName || 'Friend'}! I am Kabaad Saathi. You can ask: "What is 10kg PCB rate?", "How to sell e-waste?", "My total earnings?", or "Safety rules".`;
    }

    return {
      text: defaultMsg,
      spokenText: formatSpeechText(defaultMsg, targetLang),
      source: 'LOCAL_EDGE_BRAIN'
    };
  }

  /**
   * Voice Math / Scrap Valuation Calculation Parser
   * Parses single or multiple material quantities and computes dynamic total payout with soundbox chime.
   */
  private static parseCalculationIntent(
    q: string,
    rates: CopilotContextData['rates'],
    lang: Language
  ): CopilotResponse | null {
    // Look for patterns like "10 kilo pcb", "5 kg battery", "2.5 kg cable"
    const hasMathKeywords = /(?:kilo|kg|kilos|किलो|gram|ग्राम|का भाव|कितना|पैसे|rupaye|price|worth|value|rate)/i.test(q);
    if (!hasMathKeywords) return null;

    const items: CopilotCalculationItem[] = [];

    // Helper regex to extract weight before or after material
    const parseWeightFor = (keywords: string[]): number => {
      for (const kw of keywords) {
        // pattern 1: "15 kg pcb" or "15 kilo pcb" or "15 pcb"
        const p1 = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:kilo|kg|kilos|किलो)?\\s*(?:ka|ki|ke)?\\s*${kw}`, 'i');
        const m1 = q.match(p1);
        if (m1 && m1[1]) return parseFloat(m1[1]);

        // pattern 2: "pcb 15 kg" or "pcb 15 kilo"
        const p2 = new RegExp(`${kw}\\s*(?:ka|ki|ke)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:kilo|kg|kilos|किलो)?`, 'i');
        const m2 = q.match(p2);
        if (m2 && m2[1]) return parseFloat(m2[1]);
      }
      return 0;
    };

    const pcbKg = parseWeightFor(['pcb', 'motherboard', 'circuit board', 'मदरबोर्ड']);
    if (pcbKg > 0) {
      items.push({
        category: 'PCB',
        weightKg: pcbKg,
        ratePerKg: rates.pcb,
        subtotal: Math.round(pcbKg * rates.pcb),
        label: { hi: 'मदरबोर्ड PCB', mr: 'मदरबोर्ड PCB', en: 'Motherboard PCB' }
      });
    }

    const batKg = parseWeightFor(['battery', 'batteries', 'li-ion', 'बैटरी']);
    if (batKg > 0) {
      items.push({
        category: 'BATTERY',
        weightKg: batKg,
        ratePerKg: rates.battery,
        subtotal: Math.round(batKg * rates.battery),
        label: { hi: 'लिथियम बैटरी', mr: 'लिथियम बॅटरी', en: 'Lithium Battery' }
      });
    }

    const cableKg = parseWeightFor(['cable', 'cables', 'wire', 'wires', 'taar', 'तांबे का तार', 'वायर', 'केबल']);
    if (cableKg > 0) {
      items.push({
        category: 'CABLE',
        weightKg: cableKg,
        ratePerKg: rates.cable,
        subtotal: Math.round(cableKg * rates.cable),
        label: { hi: 'तांबा केबल / तार', mr: 'तांबे वायर / केबल', en: 'Copper Cable' }
      });
    }

    const displayKg = parseWeightFor(['display', 'screen', 'lcd', 'crt', 'मॉनिटर', 'डिस्प्ले', 'स्क्रीन']);
    if (displayKg > 0) {
      items.push({
        category: 'DISPLAY',
        weightKg: displayKg,
        ratePerKg: rates.display,
        subtotal: Math.round(displayKg * rates.display),
        label: { hi: 'डिस्प्ले / स्क्रीन', mr: 'डिस्प्ले / स्क्रीन', en: 'Display Screen' }
      });
    }

    const motorKg = parseWeightFor(['motor', 'compressor', 'मोटर', 'कंप्रेसर']);
    if (motorKg > 0) {
      items.push({
        category: 'MOTOR',
        weightKg: motorKg,
        ratePerKg: rates.motor,
        subtotal: Math.round(motorKg * rates.motor),
        label: { hi: 'इलेक्ट्रिक मोटर', mr: 'इलेक्ट्रिक मोटर', en: 'Electric Motor' }
      });
    }

    if (items.length === 0) return null;

    const grandTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

    // Trigger physical audio soundbox chime
    playSoundboxChime();

    let replyText = '';
    let spoken = '';

    if (lang === 'hi') {
      const breakdown = items.map(i => `${i.weightKg} kg ${i.label.hi} (₹${i.ratePerKg}/kg = ₹${i.subtotal})`).join(', ');
      replyText = `📊 लाइव मंडी मूल्यांकन गणना:\n${breakdown}\n\n💰 कुल अनुमानित राशि: ₹${grandTotal.toLocaleString('en-IN')}\n(CPCB अधिकृत रीसाइक्लर द्वारा डोरस्टेप पिकअप पर पूरा भुगतान मिलेगा)।`;
      spoken = `लाइव मंडी दर के अनुसार ${items.map(i => `${i.weightKg} किलो ${i.label.hi}`).join(' और ')} का कुल अनुमानित भाव ${grandTotal} रुपये बनता है।`;
    } else if (lang === 'mr') {
      const breakdown = items.map(i => `${i.weightKg} kg ${i.label.mr} (₹${i.ratePerKg}/kg = ₹${i.subtotal})`).join(', ');
      replyText = `📊 थेट बाजार भाव गणना:\n${breakdown}\n\n💰 एकूण अंदाजे रक्कम: ₹${grandTotal.toLocaleString('en-IN')}`;
      spoken = `बाजार दरानुसार एकूण अंदाजे रक्कम ${grandTotal} रुपये बनते.`;
    } else {
      const breakdown = items.map(i => `${i.weightKg} kg ${i.label.en} (@ ₹${i.ratePerKg}/kg = ₹${i.subtotal})`).join(', ');
      replyText = `📊 Real-Time Mandi Valuation Breakdown:\n${breakdown}\n\n💰 Total Guaranteed Payout: ₹${grandTotal.toLocaleString('en-IN')}\n(Certified digital scale weighment with doorstep pickup).`;
      spoken = `Based on live Mandi benchmark rates, total estimated payout is ₹${grandTotal} rupees.`;
    }

    return {
      text: replyText,
      spokenText: formatSpeechText(spoken, lang),
      calculation: { items, total: grandTotal },
      soundbox: true,
      action: {
        type: 'NAVIGATE',
        route: '/collector/add',
        label: lang === 'hi' ? 'कबाड़ बेचें (Lot बनाएं)' : lang === 'mr' ? 'कचरा विका (Lot बनवा)' : 'Sell Now (Create Lot)'
      },
      source: 'LOCAL_EDGE_BRAIN'
    };
  }

  /**
   * Recycler Operations Q&A and Action Router
   */
  private static handleRecyclerQuery(
    q: string,
    context: CopilotContextData,
    lang: Language
  ): CopilotResponse | null {
    const recData = context.recyclerData || {
      facilityName: 'CPCB Green Facility',
      pendingPickupsCount: 3,
      totalStockKg: 2450,
      totalDisbursed: 184500
    };

    // 1. Pending Pickups / Logistics Fleet
    if (q.includes('pickup') || q.includes('gaadi') || q.includes('fleet') || q.includes('driver') || q.includes('vahan')) {
      const msg = lang === 'hi'
        ? `वर्तमान में ${recData.pendingPickupsCount} पिकअप शेड्यूल हैं। लॉजिस्टिक्स वैन रूट और ड्राइवर विवरण देखने के लिए पिकअप प्रबंधन पेज खोलें।`
        : lang === 'mr'
        ? `सध्या ${recData.pendingPickupsCount} पिकअप शेड्यूल आहेत. वाहन व ड्रायव्हर तपशील पाहण्यासाठी पिकअप मॅनेजमेंट उघडा.`
        : `You currently have ${recData.pendingPickupsCount} pickups scheduled. Navigating to Pickup Management for fleet tracking.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/recycler/pickups', label: 'Open Pickup Management' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 2. Inventory / Stock Levels
    if (q.includes('stock') || q.includes('inventory') || q.includes('kitna kabaad') || q.includes('mal') || q.includes('godown')) {
      const msg = lang === 'hi'
        ? `आपके प्लांट में कुल प्रमाणित इन्वेंटरी स्टॉक ${recData.totalStockKg.toLocaleString('en-IN')} kg है। 5-स्टेज रीसाइक्लिंग स्टेज प्रोसेस देखने के लिए इन्वेंटरी पेज खोलें।`
        : lang === 'mr'
        ? `तुमच्या प्लांटमध्ये एकूण इन्व्हेंटरी साठा ${recData.totalStockKg.toLocaleString('en-IN')} kg आहे.`
        : `Your registered facility holds ${recData.totalStockKg.toLocaleString('en-IN')} kg in current inventory stock. Opening inventory stages.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/recycler/inventory', label: 'View Inventory & Stages' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 3. Digital Handover & Scale Verification
    if (q.includes('handover') || q.includes('taul') || q.includes('wajan') || q.includes('scale') || q.includes('verify lot') || q.includes('kanta')) {
      const msg = lang === 'hi'
        ? `डिजिटल कांटा तौल और 4-अंकीय OTP सत्यापन हेतु हैंडओवर वेरिफिकेशन विंडो उपलब्ध है। चलिए सत्यापन शुरू करते हैं।`
        : lang === 'mr'
        ? `काटा वजन व 4-अंकी OTP पडताळणीसाठी हँडओव्हर पेज उघडा.`
        : `Opening Digital Scale Handover verification window for certified weighment, 4-digit OTP, and instant payout release.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/recycler/handover', label: 'Open Scale Handover' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 4. Form-6 & EPR Certificate Compliance
    if (q.includes('form 6') || q.includes('form-6') || q.includes('epr') || q.includes('certificate') || q.includes('praman') || q.includes('cpcb niyam')) {
      const msg = lang === 'hi'
        ? `CPCB ई-कचरा नियम 2022 के अनुसार, रीसाइक्लिंग पूर्ण होने पर SHA-256 ब्लॉकचेन हैश वाला डिजिटल Form-6 ग्रीन सर्टिफिकेट स्वतः जारी हो जाता है, जो CPCB पोर्टल पर मान्य है।`
        : lang === 'mr'
        ? `CPCB नियमानुसार रीसायकलिंग पूर्ण झाल्यावर कायदेशीर Form-6 ग्रीन सर्टिफिकेट जारी केले जाते.`
        : `Under CPCB E-Waste Rules 2022, statutory Form-6 Green Certificates with SHA-256 Merkle hashes are automatically generated upon recycling completion.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/recycler/inventory', label: 'Generate Form-6 Certificate' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 5. Financial Disbursals / Settlements
    if (q.includes('paisa') || q.includes('payment') || q.includes('ledger') || q.includes('hisab') || q.includes('disbursed')) {
      const msg = lang === 'hi'
        ? `कबाड़ियों को अब तक कुल ₹${recData.totalDisbursed.toLocaleString('en-IN')} का भुगतान सीधे बैंक/UPI से वितरित किया गया है। लेनदेन रसीदें वित्तीय लेजर में उपलब्ध हैं।`
        : lang === 'mr'
        ? `एकूण ₹${recData.totalDisbursed.toLocaleString('en-IN')} थेट बँक/UPI द्वारे वाटप केले गेले आहे.`
        : `Total settled disbursements to date stand at ₹${recData.totalDisbursed.toLocaleString('en-IN')}. Opening transaction ledger.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/recycler/transactions', label: 'View Financial Ledger' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    return null;
  }

  /**
   * Admin Regulatory Oversight Q&A and Action Router
   */
  private static handleAdminQuery(
    q: string,
    context: CopilotContextData,
    lang: Language
  ): CopilotResponse | null {
    const adminData = context.adminData || {
      totalTonsDiverted: 1420.5,
      registeredRecyclers: 13,
      activeStates: 18,
      openAnomalies: 3
    };

    // 1. National Metric / Progress
    if (q.includes('national') || q.includes('metric') || q.includes('desh') || q.includes('total scrap') || q.includes('recycled') || q.includes('kul kachra')) {
      const msg = lang === 'hi'
        ? `राष्ट्रीय ई-कचरा डैशबोर्ड: देश भर में ${adminData.totalTonsDiverted.toLocaleString('en-IN')} मीट्रिक टन ई-कचरा लैंडफिल से बचाकर अधिकृत रीसाइक्लिंग में भेजा गया है। ${adminData.activeStates} सक्रिय राज्य जुड़े हैं।`
        : lang === 'mr'
        ? `राष्ट्रीय प्रगती: देशभरात ${adminData.totalTonsDiverted.toLocaleString('en-IN')} मेट्रिक टन ई-कचरा अधिकृत रीसायकलिंगमध्ये वळवला गेला आहे.`
        : `National Telemetry: ${adminData.totalTonsDiverted.toLocaleString('en-IN')} MT e-waste diverted from landfills across ${adminData.activeStates} active states under MoEFCC oversight.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/admin/dashboard', label: 'View National Telemetry' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 2. Fraud Anomalies / Price Spikes
    if (q.includes('anomaly') || q.includes('fraud') || q.includes('dhookha') || q.includes('visangati') || q.includes('alert') || q.includes('gadbad')) {
      const msg = lang === 'hi'
        ? `वर्तमान में AI टेलीमेट्री द्वारा ${adminData.openAnomalies} मूल्य और वजन विसंगतियां (Anomalies) ध्वजांकित हैं। त्वरित विनियामक ऑडिट हेतु विसंगति पृष्ठ खोलें।`
        : lang === 'mr'
        ? `AI प्रणालीद्वारे ${adminData.openAnomalies} विसंगती सतर्कता नोंदवण्यात आल्या आहेत. ऑडिट पृष्ठ उघडा.`
        : `There are currently ${adminData.openAnomalies} active algorithmic anomaly alerts detected. Navigating to CPCB Anomaly & Audit Center.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/admin/anomalies', label: 'Review Anomaly Audits' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 3. Registered Recyclers Directory & Gazette Compliance
    if (q.includes('recycler') || q.includes('facility') || q.includes('adhikrit') || q.includes('plant') || q.includes('registered')) {
      const msg = lang === 'hi'
        ? `CPCB गैजेट रजिस्टर में कुल ${adminData.registeredRecyclers} रीसाइक्लिंग प्लांट अधिकृत हैं। आप उनकी क्षमता, जीआईएस लोकेशन और अनुपालन स्थिति देख सकते हैं।`
        : lang === 'mr'
        ? `CPCB रजिस्टरमध्ये ${adminData.registeredRecyclers} अधिकृत रीसायकलर्स नोंदणीकृत आहेत.`
        : `Total of ${adminData.registeredRecyclers} CPCB authorized recycling facilities are indexed with verified State PCB clearances. Opening registry.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/admin/recyclers', label: 'Open Facility Registry' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    return null;
  }

  /**
   * Collector Q&A and Action Router
   */
  private static handleCollectorQuery(
    q: string,
    context: CopilotContextData,
    lang: Language
  ): CopilotResponse | null {
    const { district, rates } = context;
    const colData = context.collectorData || {
      totalEarnings: 12500,
      totalWeightKg: 180,
      activeLotsCount: 1
    };

    // 1. HOW TO SEND / PROCESS WORKFLOW
    if (
      q.includes('kaise bhej') ||
      q.includes('bhej sakte') ||
      q.includes('kaise bheje') ||
      q.includes('kaise beche') ||
      q.includes('bhejna') ||
      q.includes('how to send') ||
      q.includes('how to sell') ||
      q.includes('how does it work') ||
      q.includes('kaise kaam')
    ) {
      const msg = lang === 'hi'
        ? `ई-कचरा बेचना बहुत आसान है भैया! 1. 'Add E-Waste Lot' दबाकर कबाड़ की फोटो खींचें और वजन डालें। 2. CPCB अधिकृत रीसाइक्लर सबसे बढ़िया भाव देगा और गाड़ी भेजेगा। 3. गाड़ी आने पर 4-अंकीय OTP दिखाएं और सीधे बैंक/UPI में तुरंत पैसा पाएं!`
        : lang === 'mr'
        ? `ई-कचरा विकणे सोपे आहे! 1. फोटो काढून वजन टाका. 2. अधिकृत रीसायकलर गाडी पाठवेल. 3. 4-अंकी OTP दाखवा आणि थेट खात्यात पैसे मिळवा.`
        : `Selling e-waste is simple: 1. Snap a scrap photo & enter estimated weight. 2. Authorized recycler provides top benchmark rates & doorstep vehicle. 3. Show 4-digit handover OTP for instant UPI/Bank payment.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/collector/add', label: 'Add E-Waste Lot (कबाड़ बेचें)' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 2. MANDI PRICES & RATES
    if (
      q.includes('rate') ||
      q.includes('bhav') ||
      q.includes('bhaav') ||
      q.includes('price') ||
      q.includes('daam') ||
      q.includes('kimat')
    ) {
      const msg = lang === 'hi'
        ? `${district} का आज का आधिकारिक मंडी भाव: मदरबोर्ड PCB ₹${rates.pcb}/kg, लिथियम बैटरी ₹${rates.battery}/kg, और तांबा केबल ₹${rates.cable}/kg है। कोई बिचौलिया कटौती नहीं होगी।`
        : lang === 'mr'
        ? `${district} चा आजचा बाजार भाव: मदरबोर्ड PCB ₹${rates.pcb}/kg, बॅटरी ₹${rates.battery}/kg, आणि तांबे केबल ₹${rates.cable}/kg आहे.`
        : `Today's official Mandi benchmark in ${district}: Motherboard PCB is ₹${rates.pcb}/kg, Battery is ₹${rates.battery}/kg, and Copper Wire is ₹${rates.cable}/kg with zero middleman cuts.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/collector/prices', label: 'View Mandi Price Board' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 3. EARNINGS / PASSBOOK / KAMAI
    if (
      q.includes('kamai') ||
      q.includes('earning') ||
      q.includes('paise') ||
      q.includes('balance') ||
      q.includes('ledger') ||
      q.includes('rupaye') ||
      q.includes('hisaab')
    ) {
      playSoundboxChime();
      const msg = lang === 'hi'
        ? `आपकी कुल प्रमाणित कमाई ₹${colData.totalEarnings.toLocaleString('en-IN')} है और आपने अब तक ${colData.totalWeightKg} kg ई-कचरा सौंपा है। पासबुक लेजर देखने के लिए नीचे बटन दबाएं।`
        : lang === 'mr'
        ? `तुमची एकूण प्रमाणित कमाई ₹${colData.totalEarnings.toLocaleString('en-IN')} आहे आणि ${colData.totalWeightKg} kg स्क्रॅप जमा केले आहे.`
        : `Your verified lifetime earnings are ₹${colData.totalEarnings.toLocaleString('en-IN')} across ${colData.totalWeightKg} kg scrap handed over. Opening passbook.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        soundbox: true,
        action: { type: 'NAVIGATE', route: '/collector/ledger', label: 'View Passbook (खाता बही)' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 4. VEHICLE / PICKUP TRACKING
    if (
      q.includes('gaadi') ||
      q.includes('pickup') ||
      q.includes('driver') ||
      q.includes('track') ||
      q.includes('kahan pahuncha') ||
      q.includes('status')
    ) {
      const msg = lang === 'hi'
        ? `लाइफट्रेस ट्रैकिंग पेज पर आपके लॉट का ट्रांजिट स्टेटस, गाड़ी नंबर और ड्राइवर का फोन नंबर लाइव देखा जा सकता है।`
        : lang === 'mr'
        ? `ट्रॅकिंग पेजवर गाडी नंबर व चालक संपर्क थेट तपासा.`
        : `Opening live consignment tracking to view vehicle number, driver contact, and GPS transit progress.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/collector/tracking', label: 'Track Vehicle & Lot' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 5. SAFETY / HAZARD RULES
    if (
      q.includes('safety') ||
      q.includes('suraksha') ||
      q.includes('acid') ||
      q.includes('tezaab') ||
      q.includes('aag') ||
      q.includes('jalana') ||
      q.includes('gloves') ||
      q.includes('khatra')
    ) {
      const msg = lang === 'hi'
        ? `CPCB सुरक्षा चेतावनी: तारों को कभी खुली आग में न जलाएं और सर्किट बोर्ड पर तेजाब (एसिड) न डालें। यह कानूनन अपराध और जानलेवा है। भारी दस्ताने पहनें। आपातकाल में 112 या AIIMS Poison Centre 1800-116-117 पर कॉल करें।`
        : lang === 'mr'
        ? `सुरक्षा नियम: ई-कचरा उघड्यावर जाळू नका व ॲसिड वापरू नका. आपत्कालीन मदत 112 वर संपर्क करा.`
        : `Mandatory CPCB Safety: Open burning of wires and acid leaching are toxic and strictly prohibited. Emergency Helpline is 112 and AIIMS Poison Centre is 1800-116-117.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/collector/safety', label: 'Open Safety Center' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    // 6. SELL SCRAP / ADD LOT
    if (
      q.includes('bechna') ||
      q.includes('sell') ||
      q.includes('becho') ||
      q.includes('photo') ||
      q.includes('kabaad bechein') ||
      q.includes('naya lot')
    ) {
      const msg = lang === 'hi'
        ? `चलिए नया ई-कचरा बेचते हैं! कैमरा स्कैनर ओपन हो रहा है, कबाड़ की साफ फोटो खींचें।`
        : lang === 'mr'
        ? `चला ई-कचरा विकूया! कॅमेरा स्कॅनर उघडत आहे, फोटो काढा.`
        : `Let's sell your scrap! Launching the AI camera scanner to classify and value your items.`;
      return {
        text: msg,
        spokenText: formatSpeechText(msg, lang),
        action: { type: 'NAVIGATE', route: '/collector/add', label: 'Open Camera Scanner' },
        source: 'LOCAL_EDGE_BRAIN'
      };
    }

    return null;
  }

  /**
   * Cloud Gemini 1.5 Flash query execution with domain grounding
   */
  private static async queryGeminiFlash(
    userPrompt: string,
    context: CopilotContextData,
    lang: Language,
    apiKey: string
  ): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `You are "Kabaad Saathi", an expert Indian E-Waste Recycling & Smart India Hackathon 2026 AI Copilot for the Kabadiwala Connect national platform (MoEFCC & CPCB compliant).
User role: ${context.role}.
District: ${context.district}.
Benchmark rates: Motherboard PCB ₹${context.rates.pcb}/kg, Battery ₹${context.rates.battery}/kg, Cable ₹${context.rates.cable}/kg.
Target language: ${lang === 'hi' ? 'Natural Hindi / Hinglish' : lang === 'mr' ? 'Marathi' : 'English'}.
Strict instructions:
1. Provide accurate, professional, encouraging Indian recycling guidance.
2. Keep response concise (maximum 2 to 3 sentences).
3. Emphasize formalization, transparent digital weighment, zero acid leaching, and direct bank/UPI payments without middlemen.`;

    const body = {
      contents: [
        {
          parts: [
            { text: `${systemInstruction}\n\nUser Question: ${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 180,
        temperature: 0.3
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) return null;
    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? candidateText.trim() : null;
  }
}
