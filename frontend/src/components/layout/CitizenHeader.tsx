import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, ShieldCheck, Sun, Moon, Globe, Volume2, VolumeX, LogIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSpeech } from '../../hooks/useSpeech';
import { Language } from '../../types';

export const CitizenHeader: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { speak, stop, isSpeaking } = useSpeech();

  const handleAudioGuide = () => {
    if (isSpeaking) {
      stop();
    } else {
      const text = language === 'hi'
        ? 'कबाड़ीवाला कनेक्ट नागरिक ई-कचरा पोर्टल में आपका स्वागत है। अपने घर या दुकान के ई-कचरे को आसानी से डिस्पोज़ करें।'
        : language === 'mr'
        ? 'कबाडीवाला कनेक्ट नागरिक ई-कचरा पोर्टलवर आपले स्वागत आहे. घरचा ई-कचरा सहज विकून योग्य मोबदला मिळवा.'
        : 'Welcome to Kabadiwala Connect Citizen E-Waste Portal. Easily request doorstep e-waste pickup with zero deductions.';
      speak(text, language);
    }
  };

  const subtitle = language === 'hi'
    ? 'MoEFCC एवं CPCB अनुपालित • आम नागरिक पोर्टल'
    : language === 'mr'
    ? 'MoEFCC आणि CPCB अनुपालन • नागरिक पोर्टल'
    : 'MoEFCC & CPCB Compliant • Citizen Portal';

  const loginBtnText = language === 'hi'
    ? 'पोर्टल लॉगिन / डैशबोर्ड'
    : language === 'mr'
    ? 'पोर्टल लॉगिन / डॅशबोर्ड'
    : 'Portal Login / Dashboards';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Portal Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  {t.appTitle}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  SIH #229
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 min-w-0 truncate">
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{subtitle}</span>
              </p>
            </div>
          </Link>

          {/* Right: Controls & Portal Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Guidance */}
            <button
              type="button"
              onClick={handleAudioGuide}
              className={`p-2 rounded-xl border transition-all ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border-slate-300 dark:border-slate-700'
              }`}
              title={isSpeaking ? (t.voiceStop || 'Stop Audio') : (t.audioGuidanceBtn || 'Play Audio Guidance')}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 animate-bounce" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95 shrink-0"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-300 dark:border-slate-700">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="hi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">हिंदी (HI)</option>
                <option value="mr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">मराठी (MR)</option>
                <option value="en" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">English (EN)</option>
              </select>
            </div>

            {/* Login / Portal Switch Link */}
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{loginBtnText}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
