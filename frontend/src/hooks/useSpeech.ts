import { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import { speechService, SpeechOptions } from '../services/speechService';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

// BCP-47 Speech Synthesis Locales: 'hi-IN' (Hindi), 'mr-IN' (Marathi), 'en-IN' (English)
export const SPEECH_LOCALES: Record<Language, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  en: 'en-IN'
};

export interface UseSpeechListeningOptions {
  lang?: Language;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => speechService.getVoices());
  const { language: currentAppLanguage } = useLanguage();
  const { showToast } = useToast();

  const isSpeakingRef = useRef(false);
  isSpeakingRef.current = isSpeaking;
  const warnedLanguagesRef = useRef<Set<string>>(new Set());
  const prevLangRef = useRef<Language>(currentAppLanguage);

  // Sync available voices when loaded asynchronously by the browser
  useEffect(() => {
    const unsubscribeVoices = speechService.onVoicesLoaded(() => {
      setVoices(speechService.getVoices());
    });

    const unsubscribeSpeaking = speechService.onSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });

    const unsubscribeListening = speechService.onListeningChange((listening) => {
      setIsListening(listening);
    });

    // If voices are already present, update local state
    const currentVoices = speechService.getVoices();
    if (currentVoices.length > 0) {
      setVoices(currentVoices);
    }

    return () => {
      unsubscribeVoices();
      unsubscribeSpeaking();
      unsubscribeListening();
    };
  }, []);

  // When the active application language genuinely changes, immediately stop any active utterance and listening
  useEffect(() => {
    if (prevLangRef.current !== currentAppLanguage) {
      prevLangRef.current = currentAppLanguage;
      speechService.stop();
      speechService.stopListening();
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, [currentAppLanguage]);

  const stop = useCallback(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback((
    optionsOrLang?: Language | UseSpeechListeningOptions,
    legacyOnResultCb?: (text: string, isFinal: boolean) => void
  ) => {
    let targetLang: Language = currentAppLanguage;
    let onResultCb: ((text: string, isFinal: boolean) => void) | undefined = legacyOnResultCb;
    let onErrorCb: ((err: string) => void) | undefined;
    let onEndCb: (() => void) | undefined;

    if (typeof optionsOrLang === 'object' && optionsOrLang !== null) {
      targetLang = optionsOrLang.lang || currentAppLanguage;
      onResultCb = optionsOrLang.onResult;
      onErrorCb = optionsOrLang.onError;
      onEndCb = optionsOrLang.onEnd;
    } else if (typeof optionsOrLang === 'string') {
      targetLang = optionsOrLang;
    }

    setTranscript('');
    return speechService.startListening({
      lang: targetLang,
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (onResultCb) onResultCb(text, isFinal);
      },
      onError: (err) => {
        showToast(err, 'warning');
        if (onErrorCb) onErrorCb(err);
      },
      onEnd: () => {
        if (onEndCb) onEndCb();
      }
    });
  }, [currentAppLanguage, showToast]);

  const stopListening = useCallback(() => {
    speechService.stopListening();
  }, []);

  const isVoiceAvailable = useCallback((lang: Language = currentAppLanguage): boolean => {
    return speechService.isVoiceAvailable(lang);
  }, [currentAppLanguage]);

  const hasNativeVoice = useCallback((lang: Language = currentAppLanguage): boolean => {
    return speechService.hasNativeVoice(lang);
  }, [currentAppLanguage]);

  const getVoiceStatus = useCallback((lang: Language = currentAppLanguage) => {
    return speechService.getVoiceStatus(lang);
  }, [currentAppLanguage]);

  const speak = useCallback(async (
    text: string, 
    overrideLang?: Language,
    options?: SpeechOptions
  ) => {
    const targetLang = overrideLang || currentAppLanguage;

    if (!speechService.isSupported()) {
      showToast('Speech synthesis is not supported on this device/browser.', 'warning');
      if (options?.onError) {
        options.onError({ error: 'not-allowed' } as any);
      }
      return;
    }

    const result = await speechService.speak(text, targetLang, {
      rate: options?.rate,
      pitch: options?.pitch,
      onStart: () => {
        setIsSpeaking(true);
        if (options?.onStart) options.onStart();
      },
      onEnd: () => {
        setIsSpeaking(false);
        if (options?.onEnd) options.onEnd();
      },
      onError: (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        if (
          e.error === 'language-unavailable' || 
          e.error === 'voice-unavailable' || 
          e.error === 'synthesis-failed'
        ) {
          showToast(speechService.getVoiceUnavailableMessage(targetLang), 'warning');
        }
        if (options?.onError) {
          options.onError(e);
        }
      }
    });

    if (!result.success) {
      setIsSpeaking(false);
      if (result.reason === 'VOICE_UNAVAILABLE') {
        showToast(result.message, 'warning');
      } else if (result.reason === 'ERROR' || result.reason === 'UNSUPPORTED') {
        showToast(result.message, 'error');
      }
      if (options?.onError) {
        options.onError({ error: result.reason.toLowerCase() } as any);
      }
    } else {
      // If authentic Devanagari fallback was used for Marathi, display notice so user is informed
      if (!result.isNative && result.notice) {
        if (!warnedLanguagesRef.current.has(`notice_${targetLang}`)) {
          warnedLanguagesRef.current.add(`notice_${targetLang}`);
          showToast(result.notice, 'info');
        }
      }
    }
  }, [currentAppLanguage, showToast]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isVoiceAvailable,
    hasNativeVoice,
    getVoiceStatus,
    voices,
    supported: speechService.isSupported(),
    isListening,
    transcript,
    setTranscript,
    resetTranscript,
    startListening,
    stopListening,
    recognitionSupported: speechService.isRecognitionSupported(),
    recognitionLanguage: speechService.getRecognitionLanguage(currentAppLanguage)
  };
};
