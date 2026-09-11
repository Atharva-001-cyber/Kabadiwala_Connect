import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';
import { useLanguage } from '../../context/LanguageContext';

interface AudioButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ text, label, size = 'md', className = '' }) => {
  const { speak, stop, isSpeaking } = useSpeech();
  const { language, t } = useLanguage();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2.5 text-base font-semibold'
  };

  const defaultIdleLabel = t.voiceListen || (language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen');
  const defaultPlayingLabel = t.voicePlaying || (language === 'hi' ? 'आवाज़ चल रही है...' : language === 'mr' ? 'आवाज सुरू आहे...' : 'Playing voice...');

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all shadow-sm active:scale-95 ${
        isSpeaking
          ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-300'
          : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50'
      } ${sizeClasses[size]} ${className}`}
      title={isSpeaking ? (t.voiceStop || 'Stop') : (label || defaultIdleLabel)}
      aria-label={isSpeaking ? defaultPlayingLabel : (label || defaultIdleLabel)}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-4 h-4 animate-bounce shrink-0" />
          <span>{defaultPlayingLabel}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{label || defaultIdleLabel}</span>
        </>
      )}
    </button>
  );
};
