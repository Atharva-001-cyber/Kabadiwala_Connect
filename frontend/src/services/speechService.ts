import { Language } from '../types';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
}

export interface VoiceResolution {
  voice: SpeechSynthesisVoice;
  isNative: boolean;
  effectiveLocale: string;
  notice?: string;
}

export interface SpeechRecognitionOptions {
  lang: Language;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export type SpeechResult =
  | { success: true; voice?: SpeechSynthesisVoice; isNative: boolean; notice?: string; synthesisMode?: 'native-voice' | 'platform-locale' }
  | { success: false; reason: 'UNSUPPORTED' | 'VOICE_UNAVAILABLE' | 'EMPTY_TEXT' | 'ERROR'; message: string };

const LOCALE_MAP: Record<Language, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

const UNAVAILABLE_MESSAGES: Record<Language, string> = {
  hi: 'हिंदी आवाज़ आपके डिवाइस पर उपलब्ध नहीं है।',
  mr: 'तुमच्या डिव्हाइसवर मराठी आवाज उपलब्ध नाही.',
  en: 'A voice for the selected language is not available on this device.'
};

const DEVANAGARI_FALLBACK_NOTICE = 'मराठीसाठी देवनागरी आवाज वापरला जात आहे (स्थानिक mr-IN आवाज अनुपलब्ध).';

const PLAYING_MESSAGES: Record<Language, string> = {
  hi: 'आवाज़ चल रही है...',
  mr: 'आवाज सुरू आहे...',
  en: 'Playing voice...'
};

class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private listeners: Array<() => void> = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingInternal = false;
  private speakingListeners: Array<(speaking: boolean) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          this.voices = available;
          this.voicesLoaded = true;
          this.notifyListeners();
        }
      } catch (e) {
        console.warn('Voice loading error:', e);
      }
    };

    loadVoices();

    try {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } catch {}
    try {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } catch {}

    if (typeof window !== 'undefined') {
      setTimeout(loadVoices, 100);
      setTimeout(loadVoices, 300);
      setTimeout(loadVoices, 800);
    }
  }

  public onVoicesLoaded(callback: () => void): () => void {
    this.listeners.push(callback);
    if (this.voicesLoaded && this.voices.length > 0) {
      callback();
    }
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.warn('Error in voice listener callback:', e);
      }
    });
  }

  public onSpeakingChange(callback: (speaking: boolean) => void): () => void {
    this.speakingListeners.push(callback);
    callback(this.isSpeakingInternal);
    return () => {
      this.speakingListeners = this.speakingListeners.filter(cb => cb !== callback);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.isSpeakingInternal = speaking;
    this.speakingListeners.forEach(cb => {
      try {
        cb(speaking);
      } catch (e) {
        console.warn('Error in speaking listener callback:', e);
      }
    });
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const live = window.speechSynthesis.getVoices();
      if (live && live.length > 0) {
        this.voices = live;
        this.voicesLoaded = true;
      }
    }
    return this.voices;
  }

  public async waitForVoices(timeoutMs = 500): Promise<SpeechSynthesisVoice[]> {
    if (this.voices.length > 0) return this.voices;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      this.voices = immediate;
      this.voicesLoaded = true;
      return immediate;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) {
            this.voices = v;
            this.voicesLoaded = true;
          }
          resolve(this.voices);
        }
      };

      const timer = setTimeout(done, timeoutMs);
      const unsubscribe = this.onVoicesLoaded(() => {
        clearTimeout(timer);
        done();
      });
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getLanguageLocale(lang: Language): string {
    return LOCALE_MAP[lang] || 'en-IN';
  }

  public getVoiceUnavailableMessage(lang: Language): string {
    return UNAVAILABLE_MESSAGES[lang] || UNAVAILABLE_MESSAGES.en;
  }

  public getVoicePlayingMessage(lang: Language): string {
    return PLAYING_MESSAGES[lang] || PLAYING_MESSAGES.en;
  }

  /**
   * Resolve best voice with complete metadata including native/fallback status.
   * STRICT RULE: Never fall back to English for Hindi or Marathi!
   */
  public resolveVoice(lang: Language, voiceList?: SpeechSynthesisVoice[]): VoiceResolution | null {
    const list = voiceList && voiceList.length > 0 ? voiceList : this.getVoices();
    if (!list || list.length === 0) {
      return null;
    }

    const normalizeTag = (tag: string) => (tag || '').toLowerCase().replace(/_/g, '-');

    if (lang === 'hi') {
      // 1. Exact locale: hi-IN or hin-IN
      const exactIn = list.find(v => {
        const tag = normalizeTag(v.lang);
        return tag === 'hi-in' || tag === 'hin-in';
      });
      if (exactIn) return { voice: exactIn, isNative: true, effectiveLocale: 'hi-IN' };

      // 2. Any hi-* or hin-* locale
      const prefixMatch = list.find(v => {
        const tag = normalizeTag(v.lang);
        return tag.startsWith('hi-') || tag === 'hi' || tag.startsWith('hin-') || tag === 'hin';
      });
      if (prefixMatch) return { voice: prefixMatch, isNative: true, effectiveLocale: prefixMatch.lang || 'hi-IN' };

      // 3. Name match for Hindi
      const nameMatch = list.find(v => {
        const tag = normalizeTag(v.lang);
        if (tag.startsWith('en')) return false; // Strictly prevent English voice matching
        const name = (v.name || '').toLowerCase();
        return name.includes('hindi') || 
               name.includes('हिन्दी') || 
               name.includes('kalpana') || 
               name.includes('hemant') ||
               name.includes('swara') || 
               name.includes('madhur') ||
               name.includes('lekha') ||
               name.includes('google हिन्दी') ||
               name.includes('google hindi');
      });
      if (nameMatch) return { voice: nameMatch, isNative: true, effectiveLocale: 'hi-IN' };

      // Strictly NO fallback to English
      return null;
    }

    if (lang === 'mr') {
      // 1. Exact locale: mr-IN or mar-IN
      const exactIn = list.find(v => {
        const tag = normalizeTag(v.lang);
        return tag === 'mr-in' || tag === 'mar-in';
      });
      if (exactIn) return { voice: exactIn, isNative: true, effectiveLocale: 'mr-IN' };

      // 2. Any mr-* or mar-* locale
      const prefixMatch = list.find(v => {
        const tag = normalizeTag(v.lang);
        return tag.startsWith('mr-') || tag === 'mr' || tag.startsWith('mar-') || tag === 'mar';
      });
      if (prefixMatch) return { voice: prefixMatch, isNative: true, effectiveLocale: prefixMatch.lang || 'mr-IN' };

      // 3. Name match for Marathi
      const nameMatch = list.find(v => {
        const tag = normalizeTag(v.lang);
        if (tag.startsWith('en')) return false; // Strictly prevent English voice matching
        const name = (v.name || '').toLowerCase();
        return name.includes('marathi') || 
               name.includes('मराठी') || 
               name.includes('aarohi') || 
               name.includes('manohar') ||
               name.includes('veena') ||
               name.includes('google मराठी') ||
               name.includes('google marathi');
      });
      if (nameMatch) return { voice: nameMatch, isNative: true, effectiveLocale: 'mr-IN' };

      // 4. Authentic Indic Devanagari fallback:
      // Since Marathi is written in the Devanagari script, if native mr-IN voice is missing on the OS (e.g. Windows OneCore),
      // an Indic Devanagari voice can accurately read and pronounce the 100% Marathi text.
      const devanagariVoice = list.find(v => {
        const tag = normalizeTag(v.lang);
        if (tag.startsWith('en')) return false; // Strictly prevent English voice matching
        const name = (v.name || '').toLowerCase();
        return tag === 'hi-in' || tag.startsWith('hi-') || tag === 'hi' ||
               name.includes('hindi') || name.includes('हिन्दी') || 
               name.includes('kalpana') || name.includes('hemant') ||
               name.includes('swara') || name.includes('madhur');
      });

      if (devanagariVoice) {
        return {
          voice: devanagariVoice,
          isNative: false,
          effectiveLocale: 'hi-IN',
          notice: DEVANAGARI_FALLBACK_NOTICE
        };
      }

      // Strictly NO fallback to English
      return null;
    }

    if (lang === 'en') {
      // 1. Indian English preferred (en-IN)
      const exactIn = list.find(v => normalizeTag(v.lang) === 'en-in');
      if (exactIn) return { voice: exactIn, isNative: true, effectiveLocale: 'en-IN' };

      // 2. British English (en-GB)
      const exactGb = list.find(v => normalizeTag(v.lang) === 'en-gb');
      if (exactGb) return { voice: exactGb, isNative: true, effectiveLocale: 'en-GB' };

      // 3. US English (en-US)
      const exactUs = list.find(v => normalizeTag(v.lang) === 'en-us');
      if (exactUs) return { voice: exactUs, isNative: true, effectiveLocale: 'en-US' };

      // 4. Any English prefix
      const anyEn = list.find(v => normalizeTag(v.lang).startsWith('en-') || normalizeTag(v.lang) === 'en');
      if (anyEn) return { voice: anyEn, isNative: true, effectiveLocale: anyEn.lang || 'en-IN' };

      // 5. Name match
      const nameMatch = list.find(v => (v.name || '').toLowerCase().includes('english'));
      if (nameMatch) return { voice: nameMatch, isNative: true, effectiveLocale: 'en-IN' };

      // 6. Default voice if it's English
      const def = list.find(v => v.default && normalizeTag(v.lang).startsWith('en'));
      if (def) return { voice: def, isNative: true, effectiveLocale: def.lang || 'en-IN' };

      if (list[0]) return { voice: list[0], isNative: true, effectiveLocale: list[0].lang || 'en-IN' };
      return null;
    }

    return null;
  }

  /**
   * Find best voice object. Returns null if no suitable voice exists.
   */
  public findBestVoice(lang: Language, voiceList?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const resolution = this.resolveVoice(lang, voiceList);
    return resolution ? resolution.voice : null;
  }

  /**
   * Checks if speech synthesis is available (either via native named voice or browser platform locale).
   */
  public isVoiceAvailable(lang: Language): boolean {
    return this.isSupported();
  }

  /**
   * Specifically checks if a named native/compatible voice is loaded in getVoices().
   */
  public hasNativeVoice(lang: Language, voiceList?: SpeechSynthesisVoice[]): boolean {
    return this.resolveVoice(lang, voiceList) !== null;
  }

  /**
   * Returns granular voice availability status:
   * - 'native': Named Indic/English voice resolved
   * - 'platform': No named voice, but platform synthesis attempted via target locale
   * - 'unsupported': Speech synthesis completely unavailable in environment
   */
  public getVoiceStatus(lang: Language): 'native' | 'platform' | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return this.hasNativeVoice(lang) ? 'native' : 'platform';
  }

  public stop(): void {
    if (this.isSupported()) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn('Speech cancellation error:', e);
      }
    }
    this.activeUtterance = null;
    try {
      (window as any).__activeSpeechUtterance = null;
    } catch {}
    this.notifySpeaking(false);
  }

  /**
   * Natural language normalization before speech synthesis.
   * Preserves full sentences while expanding currency and units for natural pronunciation.
   */
  public preprocessSpeechText(text: string, lang: Language): string {
    if (!text || text.trim().length === 0) return '';
    let processed = text;
    if (lang === 'hi' || lang === 'mr') {
      // Natural currency pronunciation: ₹500 or ₹ 500 or 500/- or Rs. 500 -> 500 रुपये
      processed = processed.replace(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)/gi, '$1 रुपये');
      processed = processed.replace(/([0-9,]+(?:\.[0-9]+)?)\s*(?:\/-)/g, '$1 रुपये');
      processed = processed.replace(/₹/g, ' रुपये ');

      // Rates: /kg or per kg -> प्रति किलो, /km -> प्रति किलोमीटर
      processed = processed.replace(/\/(?:kg|किलो)\b|(?:\bper\s+kg\b)/gi, ' प्रति किलो ');
      processed = processed.replace(/\/(?:km|किमी)\b|(?:\bper\s+km\b)/gi, ' प्रति किलोमीटर ');

      // Natural unit pronunciation: kg -> किलो, km -> किलोमीटर
      processed = processed.replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, '$1 किलो');
      processed = processed.replace(/\bkg\b/gi, 'किलो');
      processed = processed.replace(/(\d+(?:\.\d+)?)\s*km\b/gi, '$1 किलोमीटर');
      processed = processed.replace(/\bkm\b/gi, 'किलोमीटर');
    } else {
      // English currency pronunciation
      processed = processed.replace(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)/gi, '$1 rupees');
      processed = processed.replace(/([0-9,]+(?:\.[0-9]+)?)\s*(?:\/-)/g, '$1 rupees');
      processed = processed.replace(/₹/g, ' rupees ');

      // Rates: /kg -> per kilogram, /km -> per kilometer
      processed = processed.replace(/\/(?:kg)\b|(?:\bper\s+kg\b)/gi, ' per kilogram ');
      processed = processed.replace(/\/(?:km)\b|(?:\bper\s+km\b)/gi, ' per kilometer ');

      // English unit pronunciation: kg -> kilograms, km -> kilometers
      processed = processed.replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, '$1 kilograms');
      processed = processed.replace(/\bkg\b/gi, 'kilograms');
      processed = processed.replace(/(\d+(?:\.\d+)?)\s*km\b/gi, '$1 kilometers');
      processed = processed.replace(/\bkm\b/gi, 'kilometers');
    }
    return processed.replace(/\s+/g, ' ').trim();
  }

  /**
   * Real development diagnostic required by Section 12.
   * Outputs clean structured diagnostic in development mode only.
   */
  public logDiagnostic(
    lang: Language,
    targetLocale: string,
    speechText: string,
    voice: SpeechSynthesisVoice | null | undefined,
    synthesisMode: 'native-voice' | 'platform-locale' = voice ? 'native-voice' : 'platform-locale'
  ): void {
    const isDev = Boolean((import.meta as any)?.env?.DEV ?? true);
    if (!isDev) {
      return;
    }
    const langNames: Record<Language, string> = {
      hi: 'Hindi',
      mr: 'Marathi',
      en: 'English'
    };
    console.log(
      `[VOICE DIAGNOSTIC]\n` +
      `Selected language:\n${langNames[lang] || lang}\n\n` +
      `Target locale:\n${targetLocale}\n\n` +
      `Speech text:\n${speechText}\n\n` +
      `Resolved voice:\n${voice ? voice.name : 'none (platform synthesis)'}\n\n` +
      `Resolved voice locale:\n${voice ? voice.lang : targetLocale}\n\n` +
      `Synthesis mode:\n${synthesisMode}\n\n` +
      `localService:\n${voice ? String(voice.localService) : 'false'}\n\n` +
      `Synthesis supported:\n${this.isSupported()}\n\n` +
      `Recognition supported:\n${this.isRecognitionSupported()}`
    );
  }

  public async speak(
    text: string,
    lang: Language,
    options: SpeechOptions = {}
  ): Promise<SpeechResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        reason: 'UNSUPPORTED',
        message: 'Speech synthesis is not supported on this browser.'
      };
    }

    const processedText = this.preprocessSpeechText(text, lang);
    if (!processedText) {
      return {
        success: false,
        reason: 'EMPTY_TEXT',
        message: 'No text provided for speech synthesis.'
      };
    }

    // Cancel any ongoing utterance before speaking
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      // Give Chromium audio thread a brief tick to process cancel before queuing
      await new Promise(r => setTimeout(r, 50));
    } catch {}

    // If voices haven't loaded yet, await brief asynchronous discovery
    if (this.voices.length === 0) {
      await this.waitForVoices(600);
    }

    // Query voices to ensure fresh cache
    const currentVoices = this.getVoices();
    const resolution = this.resolveVoice(lang, currentVoices);
    const targetLocale = LOCALE_MAP[lang] || 'en-IN';
    const effectiveLocale = resolution ? resolution.effectiveLocale : targetLocale;
    const selectedVoice = resolution?.voice;
    const synthesisMode: 'native-voice' | 'platform-locale' = selectedVoice ? 'native-voice' : 'platform-locale';

    // Output Section 12 development-only diagnostic
    this.logDiagnostic(lang, effectiveLocale, processedText, selectedVoice, synthesisMode);

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(processedText);
      this.activeUtterance = utterance;
      // Retain on window to prevent V8 garbage collection mid-speech
      try {
        (window as any).__activeSpeechUtterance = utterance;
      } catch {}

      utterance.lang = effectiveLocale;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (lang === 'en' && currentVoices.length > 0) {
        // For English, use first available English voice if resolved voice was not matched
        const enVoice = currentVoices.find(v => (v.lang || '').toLowerCase().startsWith('en')) || currentVoices[0];
        if (enVoice) utterance.voice = enVoice;
      }
      // CRITICAL RULE D: NEVER assign an English voice to Indic languages (hi, mr)!
      // When selectedVoice is null for 'hi' or 'mr', utterance.voice remains undefined.
      // The browser's platform synthesis engine will synthesize using utterance.lang ("hi-IN" or "mr-IN").

      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1.0;

      utterance.onstart = () => {
        if ((import.meta as any)?.env?.DEV) {
          console.log('[VOICE DIAGNOSTIC] synthesis onstart fired: true');
        }
        this.notifySpeaking(true);
        if (options.onStart) options.onStart();
      };
      utterance.onend = () => {
        if ((import.meta as any)?.env?.DEV) {
          console.log('[VOICE DIAGNOSTIC] synthesis onend fired: true');
        }
        this.activeUtterance = null;
        try {
          (window as any).__activeSpeechUtterance = null;
        } catch {}
        this.notifySpeaking(false);
        if (options.onEnd) options.onEnd();
      };
      utterance.onerror = (e) => {
        if ((import.meta as any)?.env?.DEV) {
          console.warn(`[VOICE DIAGNOSTIC] synthesis onerror: ${e.error}`);
        }
        this.activeUtterance = null;
        try {
          (window as any).__activeSpeechUtterance = null;
        } catch {}
        this.notifySpeaking(false);
        if (options.onError) {
          options.onError(e);
        } else {
          console.warn('Speech synthesis error event:', e);
        }
      };

      window.speechSynthesis.speak(utterance);
      return {
        success: true,
        voice: resolution?.voice,
        isNative: resolution ? resolution.isNative : false,
        notice: resolution?.notice,
        synthesisMode
      };
    } catch (err: any) {
      this.activeUtterance = null;
      try {
        (window as any).__activeSpeechUtterance = null;
      } catch {}
      this.notifySpeaking(false);
      console.error('Speech synthesis execution failed:', err);
      return {
        success: false,
        reason: 'ERROR',
        message: err?.message || 'Failed to synthesize speech.'
      };
    }
  }

  // --- Speech Recognition (Speech-to-Text) ---
  private recognitionInstance: any = null;
  private isListeningInternal = false;
  private listeningListeners: Array<(listening: boolean) => void> = [];

  public isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public isListening(): boolean {
    return this.isListeningInternal;
  }

  public onListeningChange(callback: (listening: boolean) => void): () => void {
    this.listeningListeners.push(callback);
    callback(this.isListeningInternal);
    return () => {
      this.listeningListeners = this.listeningListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListening(listening: boolean) {
    this.isListeningInternal = listening;
    this.listeningListeners.forEach(cb => {
      try {
        cb(listening);
      } catch (e) {
        console.warn('Error in listening callback:', e);
      }
    });
  }

  public startListening(options: SpeechRecognitionOptions): boolean {
    if (!this.isRecognitionSupported()) {
      const msg = options.lang === 'hi'
        ? 'इस डिवाइस/ब्राउज़र पर वॉयस रिकग्निशन समर्थित नहीं है।'
        : options.lang === 'mr'
        ? 'या डिव्हाइसवर व्हॉइस रेकग्निशन उपलब्ध नाही.'
        : 'Voice recognition is not supported on this device/browser.';
      if (options.onError) options.onError(msg);
      return false;
    }

    this.stopListening();

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      this.recognitionInstance = recognition;

      const recLocale = LOCALE_MAP[options.lang] || 'en-IN';
      recognition.lang = recLocale;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      console.log(
        `[VOICE DEBUG]\n` +
        `UI language: ${options.lang}\n` +
        `recognition locale: ${recLocale}`
      );

      recognition.onstart = () => {
        console.log('[VOICE DEBUG]\nrecognition started: true');
        this.notifyListening(true);
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        console.log(
          `[VOICE DEBUG]\n` +
          `interim transcript: ${interim || '(none)'}\n` +
          `final transcript: ${final || '(none)'}`
        );
        const text = (final || interim || '').trim();
        const isFinal = Boolean(final && !interim);
        if (options.onResult && text) {
          options.onResult(text, isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn(`[VOICE DEBUG]\nrecognition error: ${event.error}`);
        this.notifyListening(false);
        let errorMsg = 'Voice recognition error';
        if (event.error === 'not-allowed') {
          errorMsg = options.lang === 'hi'
            ? 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।'
            : options.lang === 'mr'
            ? 'मायक्रोफोन परवानगी नाकारली आहे. कृपया ब्राउझर सेटिंग्जमध्ये परवानगी द्या.'
            : 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMsg = options.lang === 'hi'
            ? 'कोई आवाज़ सुनाई नहीं दी।'
            : options.lang === 'mr'
            ? 'कोणताही आवाज ऐकू आला नाही.'
            : 'No voice was detected.';
        } else if (event.error === 'network') {
          errorMsg = options.lang === 'hi'
            ? 'नेटवर्क त्रुटि: वॉयस रिकग्निशन विफल रहा।'
            : options.lang === 'mr'
            ? 'नेटवर्क त्रुटी: व्हॉइस रेकग्निशन अयशस्वी झाले.'
            : 'Network error: Voice recognition failed.';
        } else if (event.error === 'language-not-supported') {
          errorMsg = options.lang === 'hi'
            ? 'इस ब्राउज़र पर हिंदी वॉयस रिकग्निशन समर्थित नहीं है।'
            : options.lang === 'mr'
            ? 'या ब्राउझरवर मराठी व्हॉइस रेकग्निशन उपलब्ध नाही.'
            : 'Voice recognition for this language is not supported on this browser.';
        } else if (event.error === 'audio-capture') {
          errorMsg = options.lang === 'hi'
            ? 'माइक्रोफ़ोन नहीं मिला। कृपया माइक्रोफ़ोन कनेक्शन जांचें।'
            : options.lang === 'mr'
            ? 'मायक्रोफोन सापडला नाही. कृपया मायक्रोफोन तपासा.'
            : 'No microphone was found. Please check your microphone connection.';
        } else if (event.error === 'service-not-allowed') {
          errorMsg = options.lang === 'hi'
            ? 'वॉयस सेवा की अनुमति नहीं है। कृपया ब्राउज़र सेटिंग्स जांचें।'
            : options.lang === 'mr'
            ? 'व्हॉइस सेवेची परवानगी नाही. कृपया ब्राउझर सेटिंग्ज तपासा.'
            : 'Speech service not allowed. Please check browser settings.';
        } else if (event.error === 'aborted') {
          return;
        }
        if (options.onError) options.onError(errorMsg);
      };

      recognition.onend = () => {
        console.log('[VOICE DEBUG]\nrecognition ended: true');
        this.notifyListening(false);
        this.recognitionInstance = null;
        if (options.onEnd) options.onEnd();
      };

      recognition.start();
      return true;
    } catch (e: any) {
      this.notifyListening(false);
      console.warn('Failed to start speech recognition:', e);
      if (options.onError) options.onError(e.message || 'Failed to start microphone');
      return false;
    }
  }

  public getRecognitionLanguage(lang: Language): string {
    return LOCALE_MAP[lang] || 'en-IN';
  }

  public getCurrentRecognition(): any {
    return this.recognitionInstance;
  }

  public stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {
        try {
          this.recognitionInstance.abort();
        } catch {}
      }
      this.recognitionInstance = null;
    }
    this.notifyListening(false);
  }
}

export const speechService = new SpeechService();
