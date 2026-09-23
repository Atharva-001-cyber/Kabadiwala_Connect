import React, { useState, useEffect } from 'react';
import { RefreshCw, X, ShieldCheck, Sparkles, Cpu, Laptop, Smartphone, Monitor, Keyboard, Battery } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SplashScreenProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

// Ultra-Sleek Eco-Tech Haulage Truck (Scene 7)
const PremiumEcoTruck: React.FC = () => (
  <div className="relative w-88 h-36 flex items-end">
    {/* Headlight laser light beam */}
    <div className="absolute -right-24 bottom-1 w-36 h-24 bg-gradient-to-r from-emerald-400/50 via-teal-300/15 to-transparent clip-triangle pointer-events-none z-10 blur-xs"></div>

    {/* Metallic Truck Chassis & Cargo Container */}
    <div className="relative flex items-end w-full shadow-2xl rounded-2xl overflow-hidden border border-emerald-500/30">
      
      {/* Heavy Cargo Container Box */}
      <div className="relative w-60 h-28 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-3 flex flex-col justify-between overflow-hidden">
        {/* Shimmer Light Reflection Sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-glow pointer-events-none"></div>

        {/* Silver Structural Vertical Ribs */}
        <div className="flex justify-between px-4 w-full opacity-20 border-b border-emerald-400/40 pb-1">
          <div className="w-1 h-14 bg-white rounded"></div>
          <div className="w-1 h-14 bg-white rounded"></div>
          <div className="w-1 h-14 bg-white rounded"></div>
          <div className="w-1 h-14 bg-white rounded"></div>
        </div>

        {/* Custom Eco Recycle Logo Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md p-1 flex items-center justify-center border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <img src="/eco-recycle-logo.png" alt="Eco Recycle Logo" className="w-full h-full object-contain rounded-xl drop-shadow animate-spin" style={{ animationDuration: '3.5s' }} />
          </div>
        </div>

        {/* Metal Decal Badge */}
        <div className="relative z-10 bg-slate-900/90 backdrop-blur px-2.5 py-0.5 rounded border border-emerald-500/40 self-start shadow">
          <span className="text-[9px] font-black text-emerald-300 tracking-widest font-mono uppercase">CPCB ZERO-EMISSION LOGISTICS</span>
        </div>

        {/* Bottom Safety Hazard Stripes */}
        <div className="w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 rounded-b opacity-80"></div>
      </div>

      {/* Aerodynamic Driver Cabin */}
      <div className="relative w-28 h-24 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 p-2 flex flex-col justify-between border-l border-emerald-500/30">
        {/* Windshield Glass */}
        <div className="w-full h-10 bg-gradient-to-b from-cyan-400/40 via-emerald-400/20 to-slate-950 rounded-tr-xl border border-cyan-300/40 relative overflow-hidden shadow-inner">
          <div className="absolute top-1 right-2 w-5 h-5 bg-white/20 rounded-full blur-xs"></div>
        </div>

        {/* Front Grill & Dual Laser Headlights */}
        <div className="flex items-center justify-between mt-1 px-1">
          <div className="w-8 h-4 bg-slate-900 border border-slate-700 rounded flex flex-col justify-around py-0.5 px-1 shadow-inner">
            <div className="w-full h-0.5 bg-emerald-400/60"></div>
            <div className="w-full h-0.5 bg-emerald-400/60"></div>
          </div>
          {/* Glowing Laser Headlight */}
          <div className="w-5 h-5 bg-emerald-300 rounded-full shadow-[0_0_18px_rgba(52,211,153,1)] border-2 border-white animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Alloy Wheels */}
    <div className="absolute -bottom-3.5 inset-x-4 flex justify-between px-2 z-20">
      <div className="w-8 h-8 bg-slate-950 rounded-full border-2 border-emerald-400/80 shadow-2xl flex items-center justify-center animate-wheel-rotate">
        <div className="w-3.5 h-3.5 bg-slate-300 rounded-full border border-slate-900"></div>
      </div>
      <div className="w-8 h-8 bg-slate-950 rounded-full border-2 border-emerald-400/80 shadow-2xl flex items-center justify-center animate-wheel-rotate">
        <div className="w-3.5 h-3.5 bg-slate-300 rounded-full border border-slate-900"></div>
      </div>
      <div className="w-8 h-8 bg-slate-950 rounded-full border-2 border-emerald-400/80 shadow-2xl flex items-center justify-center animate-wheel-rotate ml-auto mr-2">
        <div className="w-3.5 h-3.5 bg-slate-300 rounded-full border border-slate-900"></div>
      </div>
    </div>
  </div>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, autoStart = true }) => {
  const { language } = useLanguage();

  // 8-Scene Timing Timeline (4.2 Seconds Fast Snappy Intro)
  const [scene, setScene] = useState<number>(1);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    if (!autoStart) return;

    const t2 = setTimeout(() => setScene(2), 250);   // Scene 2: Bin Drop
    const t3 = setTimeout(() => setScene(3), 800);   // Scene 3: E-Waste Fill
    const t4 = setTimeout(() => setScene(4), 1600);  // Scene 4: Recycle Spin
    const t5 = setTimeout(() => setScene(5), 2300);  // Scene 5: Bin Shake & Burst
    const t6 = setTimeout(() => setScene(6), 2800);  // Scene 6: Brand Reveal
    const t7 = setTimeout(() => setScene(7), 3500);  // Scene 7: Truck Sweep
    const t8 = setTimeout(() => setScene(8), 5600);  // Scene 8: Bubble Pop Dissolve
    const tEnd = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 6000);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
      clearTimeout(tEnd);
    };
  }, [autoStart, onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden bg-gradient-to-b from-[#f8faf9] via-[#f0f7f4] to-[#e4f2ec] dark:from-[#030b06] dark:via-[#07170e] dark:to-[#020704] text-slate-900 dark:text-white flex flex-col justify-between items-center select-none font-sans">
      
      {/* SCENE 1: ELEGANT BACKGROUND INTRO (Minimal light gray/white with subtle green ambient radial glow) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Soft Ambient Radial Light Aura */}
        <div className="w-[580px] h-[580px] rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-3xl animate-pulse"></div>
        <div className="absolute w-[380px] h-[380px] rounded-full border border-emerald-500/15 dark:border-emerald-400/10 animate-ping"></div>

        {/* Minimal Subtle Motion Leaves & Particles */}
        <div className="absolute top-20 left-16 w-8 h-8 opacity-40 animate-bounce duration-1000 filter drop-shadow">🍃</div>
        <div className="absolute top-1/3 right-16 w-10 h-10 opacity-35 animate-pulse filter drop-shadow">🌿</div>
        <div className="absolute bottom-1/3 left-20 w-8 h-8 opacity-40 animate-bounce duration-700 filter drop-shadow">🍃</div>
      </div>

      {/* TOP HEADER BRAND BADGE & SKIP CONTROL */}
      <div className="relative z-30 w-full p-4 sm:p-6 flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-emerald-300 tracking-wider uppercase font-mono">
            {language === 'hi' ? 'कबाड़ीवाला कनेक्ट' : language === 'mr' ? 'कबाडीवाला कनेक्ट' : 'Kabadiwala Connect'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-700 shadow transition-all active:scale-95 cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {/* MAIN 9:16 VERTICAL SCENE CONTAINER */}
      <div className="relative z-20 w-full max-w-md flex-1 flex flex-col items-center justify-center p-4">
        
        {/* SCENE 6, 7 & 8: BRAND REVEAL & SEAMLESS DISSOLVE */}
        {scene >= 6 && (
          <div className={`relative z-50 text-center transition-all duration-500 ${
            scene === 8 ? 'animate-[bubblePopDissolve_0.5s_ease-in_forwards]' : 'animate-[brandRevealRise_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]'
          }`}>
            <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SIH 2026 OFFICIAL PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight drop-shadow-md">
              <span className="text-slate-900 dark:text-white">Kabadiwala </span>
              <span className="text-[#10b981]">Connect</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 max-w-xs mx-auto leading-relaxed opacity-95">
              {language === 'hi'
                ? 'अनौपचारिक कबाड़ीवालों का सशक्तिकरण • AI व CPCB ट्रेसिबिलिटी'
                : language === 'mr'
                ? 'अनौपचारिक कबाडीवाल्यांचे सबलीकरण • AI व CPCB ट्रेसिबिलिटी'
                : 'Empowering Informal Scrap Pickers with AI & CPCB Traceability'}
            </p>
          </div>
        )}

        {/* 3D / 2.5D DUSTBIN SCENE */}
        <div className="relative w-80 h-[380px] flex flex-col items-center justify-end my-2">

          {/* SCENE 5: E-WASTE STYLISH CONTROLLED BURST SPARKS */}
          {scene === 5 && (
            <div className="absolute top-16 inset-x-0 flex items-center justify-center gap-3 z-40 animate-ping">
              <span className="text-4xl">✨</span>
              <span className="text-3xl">⚡</span>
              <span className="text-4xl">✨</span>
            </div>
          )}

          {/* DUSTBIN BODY CONTAINER */}
          {scene < 7 && (
            <div
              className={`relative w-64 sm:w-72 transition-all duration-500 z-20 ${
                scene === 2
                  ? 'animate-[binDropSmooth_0.55s_cubic-bezier(0.16,1,0.3,1)_forwards]'
                  : scene === 5
                  ? 'animate-[binVibrateRumble_0.35s_infinite]'
                  : ''
              }`}
            >
              {/* PHOTOREALISTIC DUSTBIN LID TOP & PEEKING E-WASTE */}
              <div className="relative z-30 w-full min-h-[95px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-t-3xl border-2 border-emerald-400/50 p-2 flex flex-col items-center justify-end overflow-hidden shadow-2xl">
                
                {scene >= 3 && (
                  /* SCENE 3: Vector 2.5D E-Waste Flying Objects (Laptops, Phones, Keyboard, Circuit Boards) */
                  <div className="relative w-full h-24 flex items-end justify-center">
                    {/* 2.5D Laptop Icon */}
                    <div className="absolute bottom-2 left-3 bg-slate-900 border-2 border-slate-700 rounded-lg p-1.5 shadow-xl transform -rotate-12 animate-[ewasteFlyInLeft_0.45s_ease-out_forwards] flex items-center gap-1">
                      <Laptop className="w-5 h-5 text-emerald-400" />
                      <span className="text-[8px] font-mono text-emerald-300 font-bold">LAPTOP</span>
                    </div>

                    {/* 2.5D Smartphone */}
                    <div className="absolute bottom-3 right-5 bg-slate-950 border-2 border-emerald-500/50 rounded-xl p-1.5 shadow-xl transform rotate-12 animate-[ewasteFlyInRight_0.45s_ease-out_forwards] flex items-center gap-1">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      <span className="text-[8px] font-mono text-cyan-300 font-bold">OLED</span>
                    </div>

                    {/* 2.5D Circuit Board / PCB */}
                    <div className="absolute bottom-1 right-16 bg-emerald-950 border border-emerald-400/60 rounded p-1 shadow transform -rotate-6 animate-[ewasteFlyInRight_0.5s_ease-out_forwards] flex items-center gap-1">
                      <Cpu className="w-4 h-4 text-amber-300" />
                      <span className="text-[7px] font-mono text-amber-200">PCB</span>
                    </div>

                    {/* 2.5D Monitor Part */}
                    <div className="absolute bottom-5 left-16 bg-slate-800 border border-slate-600 rounded p-1 shadow animate-[ewasteFlyInLeft_0.5s_ease-out_forwards] flex items-center gap-1">
                      <Monitor className="w-4 h-4 text-teal-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* DUSTBIN EMERALD GLOSSY BODY */}
              <div className="relative w-full bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] py-6 px-4 rounded-b-3xl border-2 border-t-0 border-emerald-400/60 shadow-[0_25px_60px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center gap-3">
                
                {/* SCENE 4: RECYCLE LOGO EMBLEM */}
                <div className={`w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-2xl border-2 border-emerald-100 ${
                  scene >= 4 ? 'scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''
                }`}>
                  <img src="/eco-recycle-logo.png" alt="Eco Recycle Logo" className="w-full h-full object-contain rounded-xl animate-spin" style={{ animationDuration: '3.5s' }} />
                </div>

                {/* E-WASTE BADGE */}
                <div className="bg-white/95 text-emerald-950 px-5 py-1 rounded-xl font-black text-xs tracking-widest uppercase shadow-md border border-emerald-200">
                  E-WASTE
                </div>
              </div>

              {/* DUSTBIN WHEELS */}
              <div className="flex items-center justify-between px-6 -mt-3 relative z-10">
                <div className="w-6.5 h-6.5 bg-slate-950 rounded-full border-2 border-slate-700 shadow-md"></div>
                <div className="w-6.5 h-6.5 bg-slate-950 rounded-full border-2 border-slate-700 shadow-md"></div>
              </div>
            </div>
          )}

          {/* SCENE 7: SLEEK TRUCK SWEEP (Full Viewport Left to Right) */}
          {scene === 7 && (
            <div className="fixed inset-x-0 top-[62%] -translate-y-1/2 z-50 flex justify-center pointer-events-none animate-truck-sweep">
              <PremiumEcoTruck />
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-30 w-full p-3 text-center border-t border-emerald-500/15 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
          SIH 2026 #229 • Ministry of Mines & JNARDDC
        </p>
      </div>
    </div>
  );
};
