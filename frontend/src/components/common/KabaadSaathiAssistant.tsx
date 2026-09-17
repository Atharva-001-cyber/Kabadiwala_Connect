import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  VolumeX,
  X,
  Sparkles,
  Send,
  Bot,
  ArrowRight,
  Volume2,
  Calculator
} from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  VoiceCopilotEngine,
  CopilotContextData,
  CopilotResponse,
  formatSpeechText,
  playSoundboxChime
} from '../../services/voiceCopilotEngine';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
  source?: 'LOCAL_EDGE_BRAIN' | 'GEMINI_CLOUD_COPILOT';
  showSoundbox?: boolean;
  calculationTotal?: number;
}

export const KabaadSaathiAssistant: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { collectorProfile, recyclerProfile, user, role } = useAuth();
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const { isListening, isSpeaking, startListening, stopListening, speak, stop } = useSpeech();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [soundboxActive, setSoundboxActive] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live context data for the engine
  const [copilotCtx, setCopilotCtx] = useState<CopilotContextData>({
    role: role || 'COLLECTOR',
    language,
    userName: user?.name || '',
    district: collectorProfile?.district || 'Lucknow',
    rates: { pcb: 95, battery: 72, cable: 280, display: 45, appliance: 30, motor: 55 }
  });

  // Build rich context from live data on mount and when auth/role changes
  useEffect(() => {
    const buildContext = async () => {
      try {
        const district = collectorProfile?.district || 'Lucknow';

        // Fetch live prices
        let pcb = 95, battery = 72, cable = 280, display = 45, appliance = 30, motor = 55;
        try {
          const priceRes = await api.getPriceBoard(district);
          if (priceRes.success && Array.isArray(priceRes.prices)) {
            const find = (cat: string) => priceRes.prices.find((p: any) => p.materialCategory === cat);
            const pcbItem = find('PCB');
            const batItem = find('BATTERY');
            const cabItem = find('CABLE');
            const dspItem = find('DISPLAY');
            const appItem = find('APPLIANCE');
            const motItem = find('MOTOR');
            if (pcbItem) pcb = pcbItem.prevailingBuyPrice || 95;
            if (batItem) battery = batItem.prevailingBuyPrice || 72;
            if (cabItem) cable = cabItem.prevailingBuyPrice || 280;
            if (dspItem) display = dspItem.prevailingBuyPrice || 45;
            if (appItem) appliance = appItem.prevailingBuyPrice || 30;
            if (motItem) motor = motItem.prevailingBuyPrice || 55;
          }
        } catch {}

        // Build role-specific data
        let collectorData: CopilotContextData['collectorData'];
        let recyclerData: CopilotContextData['recyclerData'];
        let adminData: CopilotContextData['adminData'];

        if (role === 'COLLECTOR') {
          const colId = collectorProfile?.id || 'col_1';
          let earnings = Number(collectorProfile?.totalEarnings || 12500);
          let weight = Number(collectorProfile?.totalWeightCollected || 180);
          try {
            const ledgerRes = await api.getCollectorLedger(colId);
            if (ledgerRes.success && ledgerRes.summary) {
              earnings = Number(ledgerRes.summary.totalEarnings || earnings);
              weight = Number(ledgerRes.summary.totalWeightCollectedKg || weight);
            }
          } catch {}
          collectorData = {
            totalEarnings: earnings,
            totalWeightKg: weight,
            activeLotsCount: 1
          };
        } else if (role === 'RECYCLER') {
          const recProfile: any = recyclerProfile || {};
          recyclerData = {
            facilityName: recProfile.facilityName || 'CPCB Green Facility',
            pendingPickupsCount: 3,
            totalStockKg: 2450,
            totalDisbursed: 184500
          };
          // Try to fetch live pickup count
          try {
            const pickRes = await api.getPickups({ recyclerId: recProfile.id });
            if (pickRes.success && Array.isArray(pickRes.pickups)) {
              recyclerData.pendingPickupsCount = pickRes.pickups.filter((p: any) => p.status === 'SCHEDULED' || p.status === 'PENDING').length;
            }
          } catch {}
        } else if (role === 'ADMIN') {
          try {
            const kpiRes = await api.getAdminKPIs();
            if (kpiRes.success && kpiRes.kpis) {
              const k = kpiRes.kpis;
              adminData = {
                totalTonsDiverted: Math.round((k.totalWeightRecycledKg || 0) / 1000 * 10) / 10 || 1420.5,
                registeredRecyclers: k.authorizedRecyclers || k.totalRecyclers || 13,
                activeStates: 18,
                openAnomalies: k.openAnomalies || 3
              };
            }
          } catch {}
          if (!adminData) {
            adminData = { totalTonsDiverted: 1420.5, registeredRecyclers: 13, activeStates: 18, openAnomalies: 3 };
          }
        }

        setCopilotCtx({
          role: role || 'COLLECTOR',
          language,
          userName: user?.name || '',
          district,
          rates: { pcb, battery, cable, display, appliance, motor },
          collectorData,
          recyclerData,
          adminData
        });
      } catch (e) {
        console.warn('[KabaadSaathi] Context build error:', e);
      }
    };

    buildContext();
  }, [collectorProfile, recyclerProfile, user, role, language]);

  // Initial welcome greeting on first open — now role-aware
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const rawCol: any = collectorProfile || {};
      const name = rawCol.name || user?.name || 'Dost';

      let welcomeText: string;
      if (role === 'RECYCLER') {
        welcomeText = language === 'hi'
          ? `नमस्ते ${name}! मैं कबाड़ साथी हूँ — आपका रीसाइक्लिंग ऑपरेशन कोपायलट। पिकअप, इन्वेंटरी, हैंडओवर, Form-6 या वित्तीय लेजर के बारे में बोलकर या टाइप करके पूछें।`
          : language === 'mr'
          ? `नमस्कार ${name}! मी कबाडी साथी — तुमचा रीसायकलिंग कोपायलट. पिकअप, इन्व्हेंटरी, हँडओव्हर, Form-6 बद्दल विचारा.`
          : `Hello ${name}! I am Kabaad Saathi — your recycling operations copilot. Ask about pickups, inventory, handovers, Form-6, or financial ledger.`;
      } else if (role === 'ADMIN') {
        welcomeText = language === 'hi'
          ? `नमस्कार अधिकारी ${name}! मैं कबाड़ साथी, आपका CPCB राष्ट्रीय ई-कचरा निगरानी कोपायलट हूँ। मेट्रिक्स, विसंगतियां, रीसाइक्लर रजिस्ट्री के बारे में पूछें।`
          : language === 'mr'
          ? `नमस्कार अधिकारी ${name}! मी कबाडी साथी — CPCB राष्ट्रीय निरीक्षण कोपायलट. मेट्रिक्स, विसंगती, रीसायकलर्स बद्दल विचारा.`
          : `Greetings Officer ${name}! I am Kabaad Saathi — your CPCB national e-waste oversight copilot. Ask about metrics, anomalies, or the recycler registry.`;
      } else {
        welcomeText = language === 'hi'
          ? `नमस्ते ${name}! मैं कबाड़ साथी हूँ। आप बोलकर या टाइप करके मंडी भाव, ई-वेस्ट बेचने, कमाई, या सुरक्षा नियमों के बारे में पूछ सकते हैं।`
          : language === 'mr'
          ? `नमस्कार ${name}! मी कबाडी साथी आहे. मंडी भाव, स्क्रॅप विक्री, कमाई, किंवा सुरक्षा नियमांबद्दल विचारा.`
          : `Hello ${name}! I am Kabaad Saathi. Ask about Mandi rates, e-waste selling, earnings, or safety rules.`;
      }

      const welcomeMsg: Message = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'LOCAL_EDGE_BRAIN'
      };
      setMessages([welcomeMsg]);
      speak(welcomeText, language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, language, role]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  /**
   * Core query processor — delegates to VoiceCopilotEngine and dispatches actions
   */
  const processQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Delegate to the VoiceCopilotEngine
      const response: CopilotResponse = await VoiceCopilotEngine.processUserQuery(
        queryText,
        { ...copilotCtx, language }
      );

      // --- Dispatch Actions ---

      // 1. Theme change
      if (response.action?.type === 'TOGGLE_THEME' && response.action.targetTheme) {
        setTheme(response.action.targetTheme);
      }

      // 2. Language change
      if (response.action?.type === 'CHANGE_LANGUAGE' && response.action.targetLang) {
        setLanguage(response.action.targetLang);
      }

      // 3. Soundbox chime visual feedback
      if (response.soundbox) {
        setSoundboxActive(true);
        setTimeout(() => setSoundboxActive(false), 2500);
      }

      // Build assistant message
      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionRoute: response.action?.type === 'NAVIGATE' ? response.action.route : undefined,
        actionLabel: response.action?.label,
        source: response.source,
        showSoundbox: response.soundbox,
        calculationTotal: response.calculation?.total
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Speak the response
      speak(response.spokenText || response.text, language);

      // Auto-navigate if user explicitly asked to open/go somewhere
      const q = queryText.toLowerCase();
      if (
        response.action?.type === 'NAVIGATE' &&
        response.action.route &&
        (q.includes('kholo') || q.includes('chalo') || q.includes('jao') || q.includes('open') || q.includes('dikhao') || q.includes('le chalo'))
      ) {
        setTimeout(() => {
          navigate(response.action!.route!);
          setIsOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error('[KabaadSaathi] Engine error:', err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: language === 'hi'
          ? 'माफ़ कीजिए, कुछ तकनीकी समस्या हुई। कृपया दोबारा पूछें।'
          : 'Sorry, a technical issue occurred. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'LOCAL_EDGE_BRAIN'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [copilotCtx, language, setTheme, setLanguage, navigate, speak]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      stop(); // Stop any active speech before listening
      startListening({
        lang: language,
        onResult: (text, isFinal) => {
          if (isFinal && text.trim()) {
            processQuery(text);
          }
        },
        onError: (err) => {
          console.warn('Voice assistant recognition error:', err);
        }
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processQuery(inputText);
  };

  // Role-aware quick action pills
  const getQuickPills = () => {
    if (role === 'RECYCLER') {
      return [
        { label: language === 'hi' ? '🚚 पिकअप स्टेटस' : '🚚 Pickup Status', q: 'Pending pickups dikhao' },
        { label: language === 'hi' ? '📦 इन्वेंटरी' : '📦 Inventory', q: 'Inventory stock kitna hai?' },
        { label: language === 'hi' ? '⚖️ हैंडओवर' : '⚖️ Handover', q: 'Handover verification kholo' },
        { label: language === 'hi' ? '📜 Form-6' : '📜 Form-6', q: 'Form-6 certificate rules' },
        { label: language === 'hi' ? '💳 लेजर' : '💳 Ledger', q: 'Payment disbursed kitna hua?' }
      ];
    } else if (role === 'ADMIN') {
      return [
        { label: language === 'hi' ? '📊 राष्ट्रीय मेट्रिक्स' : '📊 National Metrics', q: 'National recycling metric dikhao' },
        { label: language === 'hi' ? '🚨 विसंगतियां' : '🚨 Anomalies', q: 'Fraud anomalies alert dikhao' },
        { label: language === 'hi' ? '🏭 रीसाइक्लर्स' : '🏭 Recyclers', q: 'Registered recyclers kitne hain?' },
        { label: language === 'hi' ? '🌙 Dark Mode' : '🌙 Dark Mode', q: 'Dark mode karo' },
        { label: language === 'hi' ? '🔊 हिंदी बोलो' : '🔊 Speak Hindi', q: 'Hindi me bolo' }
      ];
    }
    // Default: COLLECTOR
    return [
      { label: language === 'hi' ? '💰 मंडी भाव?' : '💰 Mandi Rates?', q: 'Aaj ka mandi bhav kya hai?' },
      { label: language === 'hi' ? '📦 कबाड़ बेचें' : '📦 Sell Scrap', q: 'Ham apna e-waste is app per kaise bhej sakte hain?' },
      { label: language === 'hi' ? '💵 मेरी कमाई?' : '💵 My Earnings', q: 'Meri kamai kitni hai?' },
      { label: language === 'hi' ? '🛡️ Safety नियम' : '🛡️ Safety Rules', q: 'Safety niyam batao' },
      { label: language === 'hi' ? '🧮 10kg PCB भाव' : '🧮 10kg PCB Rate', q: '10 kilo PCB ka kitna banega' }
    ];
  };

  // Copilot label based on role
  const getCopilotLabel = () => {
    if (role === 'RECYCLER') return language === 'hi' ? 'रीसाइक्लर ऑपरेशन कोपायलट' : 'Recycler Operations Copilot';
    if (role === 'ADMIN') return language === 'hi' ? 'CPCB राष्ट्रीय निगरानी कोपायलट' : 'CPCB National Oversight Copilot';
    return language === 'hi' ? 'AI Voice Assistant (Hinglish)' : 'Multilingual Voice Copilot';
  };

  return (
    <>
      {/* Floating Trigger Action Bubble (Bottom-Right, Mobile Accessible) */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3.5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/60 shadow-xl text-xs font-black text-emerald-300 backdrop-blur-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? 'बोलकर पूछें (कबाड़ साथी)' : language === 'mr' ? 'बोलून विचारा' : 'Voice Copilot'}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 relative active:scale-95 ${
            isOpen
              ? 'bg-red-600 hover:bg-red-500 rotate-90'
              : 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:scale-105 border-2 border-emerald-300'
          }`}
          aria-label="Kabaad Saathi Multilingual Voice Assistant"
          title="Kabaad Saathi Voice Assistant"
        >
          {/* Animated Pulsing Ring when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />
          )}

          {isOpen ? <X className="w-6 h-6" /> : <Mic className="w-7 h-7 stroke-[2.5]" />}
        </button>
      </div>

      {/* Interactive Voice Assistant Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0">
          <div className="w-full sm:w-96 bg-slate-900 dark:bg-slate-950 border-2 border-emerald-500/60 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col h-[85vh] h-[85dvh] sm:h-[580px] max-h-[90vh] max-h-[90dvh] overflow-hidden backdrop-blur-xl animate-fadeIn">
            {/* Header with Role Badge & Voice Status */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-emerald-950/60 to-slate-950 border-b border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>Kabaad Saathi</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase font-mono">
                      {role === 'RECYCLER' ? 'Recycler AI' : role === 'ADMIN' ? 'Admin AI' : 'AI Voice'}
                    </span>
                  </h3>
                  <span className="text-[10px] text-emerald-300 font-bold block">
                    {getCopilotLabel()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stop}
                    className="p-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-700 text-xs"
                    title="Stop Speaking"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Soundbox Payment Chime Visual Indicator */}
            {soundboxActive && (
              <div className="px-4 py-2 bg-gradient-to-r from-amber-950 via-amber-900/80 to-amber-950 border-b border-amber-700/60 flex items-center gap-2 animate-pulse">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black text-amber-300">
                  {language === 'hi' ? '🔊 साउंडबॉक्स चाइम — भुगतान राशि' : '🔊 Soundbox Chime — Payment Amount'}
                </span>
                <div className="flex items-center gap-0.5 ml-auto">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '50ms' }} />
                </div>
              </div>
            )}

            {/* Conversation Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 text-[10px] font-bold mt-1">
                      🤖
                    </div>
                  )}

                  <div className={`max-w-[82%] rounded-2xl p-3 shadow-md space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed font-medium whitespace-pre-line">{m.text}</p>

                    {/* Calculation total badge */}
                    {m.calculationTotal != null && m.calculationTotal > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-black text-xs">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>₹{m.calculationTotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {/* Quick Action Navigation Button if generated */}
                    {m.actionRoute && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(m.actionRoute!);
                          setIsOpen(false);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>{m.actionLabel || 'पेज पर जाएं'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Source indicator + timestamp */}
                    <div className="flex items-center justify-between">
                      {m.source === 'GEMINI_CLOUD_COPILOT' && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                          ☁️ Gemini
                        </span>
                      )}
                      <span className={`text-[9px] block text-right font-mono ml-auto ${
                        m.sender === 'user' ? 'text-emerald-200' : 'text-slate-500'
                      }`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-1">
                      👤
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                  <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'साथी सोच रहा है...' : 'Processing your voice query...'}</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Action Suggested Query Pills */}
            <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 text-[11px] font-bold shrink-0">
              {getQuickPills().map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processQuery(pill.q)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 active:scale-95 transition-all text-[10px]"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Visual Waveform & Audio Controls Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              {/* Dynamic Soundwave Visualizer when Listening or Speaking */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    isListening
                      ? 'bg-red-500 animate-ping'
                      : isSpeaking
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span className="text-[11px] font-bold text-slate-300">
                    {isListening
                      ? (language === 'hi' ? 'सुन रहे हैं... बोलिए' : 'Listening... Speak now')
                      : isSpeaking
                      ? (language === 'hi' ? 'साथी बोल रहा है...' : 'Speaking answer...')
                      : (language === 'hi' ? 'Mic दबाकर बोलें' : 'Tap mic to talk')}
                  </span>
                </div>

                {/* Animated Soundwave Bars */}
                {(isListening || isSpeaking) && (
                  <div className="flex items-center gap-1 h-4">
                    <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 bg-teal-400 rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 bg-emerald-300 rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 bg-teal-300 rounded-full animate-bounce h-4" style={{ animationDelay: '75ms' }} />
                    <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" style={{ animationDelay: '200ms' }} />
                  </div>
                )}
              </div>

              {/* Main Input Form with Big Mic Button */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-3 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0 ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse border-2 border-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Tap to Speak'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 stroke-[2.5]" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'बोलें या यहाँ टाइप करें...'
                      : language === 'mr'
                      ? 'बोला किंवा इथे टाइप करा...'
                      : 'Speak or type query...'
                  }
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 disabled:text-slate-600 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
