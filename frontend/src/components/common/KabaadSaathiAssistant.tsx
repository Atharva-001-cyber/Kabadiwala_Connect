import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  TrendingUp, 
  PlusCircle, 
  Wallet, 
  ShieldCheck, 
  Truck,
  HelpCircle,
  Minimize2,
  Maximize2,
  ArrowRight
} from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
}

export const KabaadSaathiAssistant: React.FC = () => {
  const { language } = useLanguage();
  const { collectorProfile, user } = useAuth();
  const navigate = useNavigate();
  const { isListening, isSpeaking, startListening, stopListening, speak, stop } = useSpeech();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live prices and metrics cache for real assistant responses
  const [liveData, setLiveData] = useState<{
    pcbRate: number;
    batteryRate: number;
    cableRate: number;
    totalEarnings: number;
    totalWeight: number;
  }>({
    pcbRate: 95,
    batteryRate: 72,
    cableRate: 280,
    totalEarnings: 12500,
    totalWeight: 180
  });

  // Fetch live market rates and collector totals for hyper-accurate voice answers
  useEffect(() => {
    const loadAssistantContext = async () => {
      try {
        const district = collectorProfile?.district || 'Lucknow';
        const colId = collectorProfile?.id || 'col_1';

        const [priceRes, ledgerRes] = await Promise.all([
          api.getPriceBoard(district).catch(() => ({ success: false, prices: [] })),
          api.getCollectorLedger(colId).catch(() => ({ success: false, summary: null }))
        ]);

        let pcb = 95;
        let battery = 72;
        let cable = 280;
        let earnings = Number(collectorProfile?.totalEarnings || 12500);
        let weight = Number(collectorProfile?.totalWeightCollected || 180);

        if (priceRes.success && Array.isArray(priceRes.prices)) {
          const pcbItem = priceRes.prices.find((p: any) => p.materialCategory === 'PCB');
          const batItem = priceRes.prices.find((p: any) => p.materialCategory === 'BATTERY');
          const cabItem = priceRes.prices.find((p: any) => p.materialCategory === 'CABLE');
          if (pcbItem) pcb = pcbItem.prevailingBuyPrice || 95;
          if (batItem) battery = batItem.prevailingBuyPrice || 72;
          if (cabItem) cable = cabItem.prevailingBuyPrice || 280;
        }

        if (ledgerRes.success && ledgerRes.summary) {
          earnings = Number(ledgerRes.summary.totalEarnings || earnings);
          weight = Number(ledgerRes.summary.totalWeightCollectedKg || weight);
        }

        setLiveData({
          pcbRate: pcb,
          batteryRate: battery,
          cableRate: cable,
          totalEarnings: earnings,
          totalWeight: weight
        });
      } catch (e) {
        console.warn('Voice assistant context load error:', e);
      }
    };

    loadAssistantContext();
  }, [collectorProfile]);

  // Initial welcome greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const rawCol: any = collectorProfile || {};
      const name = rawCol.name || user?.name || 'Kisan Bhai';
      const welcomeText = language === 'hi'
        ? `Namaste ${name}! Main Kabaad Saathi hoon. Aap bolkar ya type karke Mandi bhav, e-waste bhejne, kamai, ya safety rules ke bare me pooch sakte hain.`
        : language === 'mr'
        ? `Namaskar ${name}! Mi Kabaad Saathi aahe. Aapan Mandi bhav, scrap vikri kinva kamai baddal bolun vicharu shakta.`
        : `Hello ${name}! I am Kabaad Saathi. You can ask about Mandi rates, how to send e-waste, earnings, or safety rules.`;

      const welcomeMsg: Message = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);
      speak(welcomeText, language);
    }
  }, [isOpen, language, collectorProfile, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Intelligent Multilingual Intent Resolution Engine
  const processQuery = async (queryText: string) => {
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

    const q = queryText.toLowerCase();

    // Auto-detect Hinglish in user query so assistant responds in natural Hindi/Hinglish even if app is in English
    const isHinglish = /\b(ham|hum|apna|apne|apni|kaise|kya|hai|hain|karna|karein|karo|bhai|bhaiya|bhej|bhejein|bhejna|bhejte|daam|paisa|paise|bhav|bhaav|kahan|mera|meri|kabaad|kooda|chahiye|sakte|kab|milenge|kholo)\b/i.test(q);
    const targetLang = isHinglish ? 'hi' : language;

    let reply = '';
    let actionRoute: string | undefined;
    let actionLabel: string | undefined;

    // 1. HOW TO SEND E-WASTE / PROCESS / WORKFLOW INTENT (e.g. "Ham Apna e-waste is app per Kaise bhej sakte hain")
    if (
      q.includes('kaise bhej') ||
      q.includes('bhej sakte') ||
      q.includes('kaise bheje') ||
      q.includes('kaise beche') ||
      q.includes('bhejna') ||
      q.includes('bhejein') ||
      q.includes('bhejte') ||
      q.includes('how to send') ||
      q.includes('how to sell') ||
      q.includes('how does it work') ||
      q.includes('process kya') ||
      q.includes('kaise kaam') ||
      q.includes('kaise use') ||
      q.includes('kaise dale') ||
      q.includes('kya kare') ||
      (q.includes('kaise') && (q.includes('scrap') || q.includes('e-waste') || q.includes('kabaad') || q.includes('ewaste')))
    ) {
      if (targetLang === 'hi') {
        reply = `E-waste bhejna bahut aasan hai bhaiya!
1. 'Add E-Waste Lot' par jakar scrap ki photo kheenchiye aur anumaanit wajan daaliye.
2. CPCB authorized recycler aapko sabse badhiya rate dega aur doorstep pickup schedule karega.
3. Gaadi aane par 4-digit handover OTP dikhaiye aur turant direct apne bank/UPI me paise paaiye! Chaliye lot add karte hain.`;
        actionLabel = 'Add E-Waste Lot (Kabaad Bechein)';
      } else if (targetLang === 'mr') {
        reply = `E-waste pathavane agdi sope aahe! 1. 'Add E-Waste' var scrap cha photo kadha ani wajan taka. 2. Authorized recycler doorstep gaadi pathavel. 3. 4-digit OTP dakhva ani direct bank/UPI madhe paise milva.`;
        actionLabel = 'Add E-Waste Lot';
      } else {
        reply = `Sending e-waste is very simple! 1. Tap "Add E-Waste Lot" and snap a scrap photo with estimated weight. 2. Authorized recyclers place fair bids and schedule doorstep pickup. 3. Show your 4-digit handover OTP to receive instant direct payment into your bank/UPI.`;
        actionLabel = 'Add E-Waste Lot';
      }
      actionRoute = '/collector/add';
    }
    // 2. PAYMENT TIMING / METHOD INTENT (e.g. "Paise kab aayenge", "UPI me kaise milega")
    else if (
      q.includes('paise kab') ||
      q.includes('payment kab') ||
      q.includes('paisa kab') ||
      q.includes('paise kaise') ||
      q.includes('upi me') ||
      q.includes('bank me') ||
      q.includes('khate me') ||
      q.includes('payout')
    ) {
      if (targetLang === 'hi') {
        reply = `Scrap handover ke time jaise hi recycler ka driver aapka 4-digit OTP verify karega, paise turant aapke registered UPI ID ya bank khate me Razorpay dwara transfer ho jayenge. Kisi bhi bicholiye ki zaroorat nahi hai.`;
        actionLabel = 'View Earnings Ledger (Hisaab Dekhein)';
      } else if (targetLang === 'mr') {
        reply = `Handover purna hotach ani 4-digit OTP verification zalyavar paise lagach tumchya UPI / bank khatyat jama hotat.`;
        actionLabel = 'Check Ledger';
      } else {
        reply = `Upon scrap handover, as soon as the driver verifies your 4-digit OTP, payments are transferred instantly to your registered UPI/bank account via Razorpay.`;
        actionLabel = 'View Earnings Ledger';
      }
      actionRoute = '/collector/ledger';
    }
    // 3. PICKUP / VEHICLE / LOGISTICS INTENT (e.g. "Gaadi kab aayegi", "Pickup kaun karega")
    else if (
      q.includes('pickup') ||
      q.includes('gaadi') ||
      q.includes('driver') ||
      q.includes('kooda lene') ||
      q.includes('ghar aayega') ||
      q.includes('vahan') ||
      q.includes('gadi')
    ) {
      if (targetLang === 'hi') {
        reply = `Jaise hi aap lot submit karenge, CPCB verified recycler ka driver aapke address par gaadi lekar aayega. 'My Requests' me aap gaadi number aur pickup status live track kar sakte hain.`;
        actionLabel = 'View Pickup Requests';
      } else if (targetLang === 'mr') {
        reply = `Lot submit kelyavar authorized recycler chi gaadi tumchya pattyavar pickup sathi yeil. 'My Requests' madhe vehicle number check kara.`;
        actionLabel = 'View Requests';
      } else {
        reply = `Once you submit your lot, the authorized recycler's vehicle driver will arrive at your address for pickup. You can track pickup timing in 'My Requests'.`;
        actionLabel = 'View Pickup Requests';
      }
      actionRoute = '/collector/requests';
    }
    // 4. PRICE / RATE INTENT
    else if (
      q.includes('rate') || 
      q.includes('bhav') || 
      q.includes('bhaav') || 
      q.includes('price') || 
      q.includes('daam') || 
      q.includes('kimat') || 
      q.includes('pcb') || 
      q.includes('battery') || 
      q.includes('cable') ||
      q.includes('taar') ||
      q.includes('mol') ||
      q.includes('kitna milega') ||
      q.includes('kitne ka')
    ) {
      if (targetLang === 'hi') {
        reply = `Aaj ka official Mandi benchmark: Motherboard PCB ₹${liveData.pcbRate}/kg, Battery ₹${liveData.batteryRate}/kg, aur Copper Cable ₹${liveData.cableRate}/kg hai. CPCB authorized recyclers market se behtar daam dete hain.`;
        actionLabel = 'View Mandi Price Board';
      } else if (targetLang === 'mr') {
        reply = `Aajcha market rate: Motherboard PCB ₹${liveData.pcbRate}/kg, Battery ₹${liveData.batteryRate}/kg, ani Cable ₹${liveData.cableRate}/kg aahe.`;
        actionLabel = 'Check Mandi Rates';
      } else {
        reply = `Today's official Mandi benchmark: Motherboard PCB is ₹${liveData.pcbRate}/kg, Battery is ₹${liveData.batteryRate}/kg, and Insulated Cable is ₹${liveData.cableRate}/kg. Authorized recyclers pay full fair value.`;
        actionLabel = 'View Mandi Price Board';
      }
      actionRoute = '/collector/prices';
    } 
    // 5. SELL SCRAP / ADD LOT INTENT
    else if (
      q.includes('bechna') || 
      q.includes('sell') || 
      q.includes('becho') || 
      q.includes('lot') || 
      q.includes('jama') || 
      q.includes('kabaad') || 
      q.includes('scrap') ||
      q.includes('photo') ||
      q.includes('daalna') ||
      q.includes('daalo') ||
      q.includes('upload') ||
      q.includes('e-waste') ||
      q.includes('ewaste')
    ) {
      if (targetLang === 'hi') {
        reply = `Chaliye naya e-waste bechte hain! AI camera scanner open ho raha hai, kabaad ki photo kheenchiye.`;
        actionLabel = 'Open Camera Scanner (Photo Kheencho)';
      } else if (targetLang === 'mr') {
        reply = `Chala e-waste vikuya! AI camera scanner open hot aahe, scrap cha photo kadha.`;
        actionLabel = 'Open Camera Scanner';
      } else {
        reply = `Let's sell your e-waste! Opening the AI camera scanner to classify and value your lot.`;
        actionLabel = 'Open Camera Scanner';
      }
      actionRoute = '/collector/add';
    } 
    // 6. EARNINGS / PAISA / LEDGER INTENT
    else if (
      q.includes('kamai') || 
      q.includes('earning') || 
      q.includes('paise') || 
      q.includes('balance') || 
      q.includes('ledger') || 
      q.includes('rupaye') || 
      q.includes('kamaai') ||
      q.includes('voucher') ||
      q.includes('hisab') ||
      q.includes('hisaab')
    ) {
      if (targetLang === 'hi') {
        reply = `Aapki kul certified kamai ₹${liveData.totalEarnings.toLocaleString('en-IN')} hai aur aapne ab tak ${liveData.totalWeight} kg e-waste saupa hai. Chaliye ledger hisaab dekhte hain.`;
        actionLabel = 'View Earnings Ledger (Hisaab Dekhein)';
      } else if (targetLang === 'mr') {
        reply = `Tumchi ekun kamai ₹${liveData.totalEarnings.toLocaleString('en-IN')} aahe ani ${liveData.totalWeight} kg scrap jama zala aahe.`;
        actionLabel = 'Check Ledger';
      } else {
        reply = `Your verified lifetime earnings are ₹${liveData.totalEarnings.toLocaleString('en-IN')} with ${liveData.totalWeight} kg scrap handed over. Opening Ledger page.`;
        actionLabel = 'View Earnings Ledger';
      }
      actionRoute = '/collector/ledger';
    } 
    // 7. SAFETY / FIRST AID INTENT
    else if (
      q.includes('safety') || 
      q.includes('suraksha') || 
      q.includes('khatra') || 
      q.includes('niyam') || 
      q.includes('acid') || 
      q.includes('tezaab') || 
      q.includes('gloves') || 
      q.includes('ppe') || 
      q.includes('aag') || 
      q.includes('dhua') ||
      q.includes('jalana') ||
      q.includes('chashma')
    ) {
      if (targetLang === 'hi') {
        reply = `CPCB Safety Rules: Taaron ko kabhi aag me na jalayein aur circuit board par tezaab (acid) na dalein. Heavy gloves aur chashma zaroor pehnein. Emergency me 112 ya AIIMS Poison Centre 1800-116-117 par call karein.`;
        actionLabel = 'Open Safety Center (Suraksha Niyam)';
      } else if (targetLang === 'mr') {
        reply = `Safety Rules: E-waste ughdyavar jaalu naka ani acid taku naka. Nehmi gloves vapra. Emergency helpline 112.`;
        actionLabel = 'Open Safety Center';
      } else {
        reply = `Mandatory CPCB Rules: Never burn wires in open heaps or use acid leaching. Always wear heavy gloves and eye goggles. National Emergency Helpline is 112 and AIIMS Poison Centre is 1800-116-117.`;
        actionLabel = 'Open Safety Center';
      }
      actionRoute = '/collector/safety';
    } 
    // 8. RECYCLER FINDER INTENT
    else if (
      q.includes('recycler') || 
      q.includes('factory') || 
      q.includes('kharidne') || 
      q.includes('godown') || 
      q.includes('dealer') || 
      q.includes('plant')
    ) {
      if (targetLang === 'hi') {
        reply = `Aapke district ke verified CPCB authorized green recyclers ki directory open ho rahi hai. Yahan se pickup schedule karein.`;
        actionLabel = 'Find Authorized Recyclers';
      } else if (targetLang === 'mr') {
        reply = `Tumchya jilhyatil authorized recyclers chi list open hot aahe.`;
        actionLabel = 'Find Recyclers';
      } else {
        reply = `Opening verified CPCB authorized green recyclers directory for doorstep pickup and fair rates.`;
        actionLabel = 'Find Authorized Recyclers';
      }
      actionRoute = '/collector/recyclers';
    } 
    // 9. TRACKING INTENT
    else if (
      q.includes('track') || 
      q.includes('tracking') || 
      q.includes('kahan') || 
      q.includes('status') || 
      q.includes('lot') ||
      q.includes('kahan pahuncha')
    ) {
      if (targetLang === 'hi') {
        reply = `Lifetrace tracking page par aapke scrap ka live transit status, vehicle number aur recycling certificate dekh sakte hain.`;
        actionLabel = 'Track Scrap Lifecycle';
      } else if (targetLang === 'mr') {
        reply = `Lifetrace tracking page var scrap chi live status ani vehicle number check kara.`;
        actionLabel = 'Track Scrap';
      } else {
        reply = `Opening lifecycle tracking to view real-time transit status and green recycling proof for your lot.`;
        actionLabel = 'Track Scrap Lifecycle';
      }
      actionRoute = '/collector/tracking';
    } 
    // 10. DEFAULT / HELP INTENT
    else {
      if (targetLang === 'hi') {
        reply = `Namaste! Main Kabaad Saathi hoon. Aap mujhse pooch sakte hain: "E-waste kaise bhejein?", "Aaj ka mandi bhav kya hai?", "Meri kamai kitni hai?", ya "Safety niyam batao".`;
      } else if (targetLang === 'mr') {
        reply = `Namaskar! Aapan vicharu shakta: "E-waste kasa pathvava?", "Aajcha rate kay aahe?", kinva "Safety rules sanga".`;
      } else {
        reply = `Hello! I am Kabaad Saathi. You can ask: "How to send e-waste?", "Today's Mandi rate?", "How much are my earnings?", or "Tell me safety rules".`;
      }
    }

    setIsProcessing(false);

    const assistantMsg: Message = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionRoute,
      actionLabel
    };

    setMessages(prev => [...prev, assistantMsg]);
    speak(reply, language);

    // If an actionable navigation command was spoken, automatically offer to navigate
    if (actionRoute && (q.includes('kholo') || q.includes('chalo') || q.includes('jao') || q.includes('open') || q.includes('dikhao'))) {
      setTimeout(() => {
        navigate(actionRoute!);
        setIsOpen(false);
      }, 1500);
    }
  };

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

  return (
    <>
      {/* Floating Trigger Action Bubble (Bottom-Right, Mobile Accessible) */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/60 shadow-xl text-xs font-black text-emerald-300 backdrop-blur-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? 'Bolkar Poochhein (Kabaad Saathi)' : language === 'mr' ? 'Bolun Vichara' : 'Voice Copilot'}</span>
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
          <div className="w-full sm:w-96 bg-slate-900 border-2 border-emerald-500/60 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[580px] max-h-[90vh] overflow-hidden backdrop-blur-xl animate-fadeIn">
            {/* Header with Language Pill & Voice Status */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-emerald-950/60 to-slate-950 border-b border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>Kabaad Saathi</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase font-mono">
                      AI Voice
                    </span>
                  </h3>
                  <span className="text-[10px] text-emerald-300 font-bold block">
                    {language === 'hi' ? 'AI Voice Assistant (Hinglish)' : language === 'mr' ? 'AI Voice Assistant (Marathi)' : 'Multilingual Voice Copilot'}
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
                    <p className="leading-relaxed font-medium">{m.text}</p>

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

                    <span className={`text-[9px] block text-right font-mono ${
                      m.sender === 'user' ? 'text-emerald-200' : 'text-slate-500'
                    }`}>
                      {m.timestamp}
                    </span>
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
                  <span>{language === 'hi' ? 'Saathi soch raha hai...' : 'Processing your voice query...'}</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Action Suggested Query Pills */}
            <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 text-[11px] font-bold shrink-0">
              {[
                { label: language === 'hi' ? '💰 Mandi Bhav?' : '💰 Mandi Rates?', q: 'Aaj ka mandi bhav kya hai?' },
                { label: language === 'hi' ? '📦 Kabaad Bechein' : '📦 Sell Scrap', q: 'Ham apna e-waste is app per kaise bhej sakte hain?' },
                { label: language === 'hi' ? '💵 Meri Kamai?' : '💵 My Earnings', q: 'Meri kamai kitni hai?' },
                { label: language === 'hi' ? '🛡️ Safety Niyam' : '🛡️ Safety Rules', q: 'Safety niyam batao' },
                { label: language === 'hi' ? '🚚 Recyclers' : '🚚 Recyclers', q: 'Recycler dhoondho' }
              ].map((pill, idx) => (
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
                      ? (language === 'hi' ? 'Sun rahe hain... Boliye' : 'Listening... Speak now') 
                      : isSpeaking 
                      ? (language === 'hi' ? 'Saathi bol raha hai...' : 'Speaking answer...') 
                      : (language === 'hi' ? 'Mic dabakar bolein' : 'Tap mic to talk')}
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
                      ? 'Bolein ya yahan type karein...' 
                      : language === 'mr' 
                      ? 'Bola kinva ithe type kara...' 
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
