import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Factory, 
  Scale, 
  Truck, 
  Sparkles, 
  FileSpreadsheet, 
  IndianRupee 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({ isOpen, onClose }) => {
  const { switchDemoRole, role } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleStepAction = async (targetRole: UserRole, targetRoute: string) => {
    await switchDemoRole(targetRole);
    navigate(targetRoute);
    onClose();
  };

  const getSteps = () => {
    if (language === 'hi') {
      return [
        {
          step: 1,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/prices',
          title: 'पारदर्शी भाव व नया लॉट निर्माण',
          description: 'दैनिक मंडी भाव देखें (ऑडियो सहित), कैमरे से ई-कचरे व कांटे का फोटो खींचें, GPS स्थान व अनुमानित मूल्य प्राप्त करें।',
          buttonText: 'कलेक्टर होम पर जाएं',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 2,
          actor: '🏭 अधिकृत रीसाइक्लर',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/requests',
          title: 'पारदर्शी बोली व लॉजिस्टिक्स शेड्यूलिंग',
          description: 'आए हुए लॉट की सामग्री व वजन जांचें, CPCB लाइसेंस के तहत औपचारिक बोली लगाएं और मुफ्त डोरस्टेप वाहन भेजें।',
          buttonText: 'रीसाइक्लर पोर्टल पर जाएं',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 3,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/requests',
          title: 'ऑफर तुलना व 1-टैप स्वीकृति',
          description: 'विभिन्न खरीदारों के भावों की तुलना करें (बेस्ट प्राइस बैज), ₹0 परिवहन कटौती की पुष्टि करें और 1-टैप में डील लॉक करें।',
          buttonText: 'ऑफर तुलना देखें',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 4,
          actor: '🏭 अधिकृत रीसाइक्लर',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/pickups',
          title: 'इलेक्ट्रॉनिक कांटा सत्यापन व OTP',
          description: 'कलेक्टर से 4-अंकों का हैंडओवर OTP लें, डिजिटल कांटे का वास्तविक वजन दर्ज करें और तत्काल लेजर वाउचर जारी करें।',
          buttonText: 'कांटा सत्यापन करें',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 5,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/ledger',
          title: 'खाता पासबुक व बिचौलिए से +72.4% अधिक आय',
          description: 'सत्यापित डिजिटल रसीद देखें, दैनिक/मासिक आय का ब्योरा और पारंपरिक बिचौलिए के मुकाबले +72.4% अतिरिक्त मुनाफा जांचें।',
          buttonText: 'कमाई पासबुक देखें',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 6,
          actor: '🏛️ CPCB राष्ट्रीय एडमिन',
          role: 'ADMIN' as UserRole,
          route: '/admin',
          title: 'SHA-256 ट्रैसेबिलिटी व राष्ट्रीय EPR डेटासेट एक्सपोर्ट',
          description: 'अपरिवर्तनीय हैश-चेन ऑडिट, ई-वेस्ट GIS मैप, Z-Score विसंगति जांच और CPCB हेतु CSV/YOLO डेटासेट डाउनलोड करें।',
          buttonText: 'CPCB एडमिन हब देखें',
          color: 'border-purple-500/60 bg-purple-950/20 text-purple-400'
        }
      ];
    } else if (language === 'mr') {
      return [
        {
          step: 1,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/prices',
          title: 'पारदर्शक दर व नवीन लॉट निर्मिती',
          description: 'दैनिक बाजारभाव तपासा (ऑडिओसह), कॅमेऱ्याने ई-कचरा व काट्याचा फोटो काढा, GPS स्थान व अंदाजे मूल्य मिळवा.',
          buttonText: 'कलेक्टर होमवर जा',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 2,
          actor: '🏭 अधिकृत रीसायकलर',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/requests',
          title: 'पारदर्शक बोली व लॉजिस्टिक्स नियोजन',
          description: 'आलेल्या लॉटचे साहित्य व वजन तपासा, CPCB परवान्याअंतर्गत अधिकृत बोली लावा व विनामूल्य वाहन पाठवा.',
          buttonText: 'रीसायकलर पोर्टलवर जा',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 3,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/requests',
          title: 'ऑफर तुलना व 1-टॅप स्वीकृती',
          description: 'विविध खरेदीदारांच्या दरांची तुलना करा, शून्य वाहतूक कपातीची पुष्टी करा व 1-टॅपमध्ये करार पूर्ण करा.',
          buttonText: 'ऑफर तुलना पहा',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 4,
          actor: '🏭 अधिकृत रीसायकलर',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/pickups',
          title: 'इलेक्ट्रॉनिक काटा पडताळणी व OTP',
          description: 'कलेक्टरकडून 4-अंकी OTP घ्या, डिजिटल काट्यावरील प्रत्यक्ष वजन नोंदवा व त्वरित लेजर पावती जारी करा.',
          buttonText: 'काटा पडताळणी करा',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 5,
          actor: '📦 कलेक्टर',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/ledger',
          title: 'खाते पासबुक व मध्यस्थापेक्षा +72.4% जास्त नफा',
          description: 'प्रमाणित डिजिटल पावती पहा, दैनिक/मासिक उत्पन्नाचा तपशील आणि पारंपारिक दलालापेक्षा +72.4% अतिरिक्त नफा तपासा.',
          buttonText: 'कमाई पासबुक पहा',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 6,
          actor: '🏛️ CPCB राष्ट्रीय प्रशासक',
          role: 'ADMIN' as UserRole,
          route: '/admin',
          title: 'SHA-256 ट्रॅसेबिलिटी व राष्ट्रीय EPR डेटासेट एक्सपोर्ट',
          description: 'अखंडित हॅश-चेन ऑडिट, ई-कचरा GIS नकाशा, विसंगती तपासणी आणि CPCB साठी CSV डेटासेट डाउनलोड करा.',
          buttonText: 'CPCB प्रशासक हब पहा',
          color: 'border-purple-500/60 bg-purple-950/20 text-purple-400'
        }
      ];
    } else {
      return [
        {
          step: 1,
          actor: '📦 Collector',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/prices',
          title: 'Transparent Pricing & Lot Creation',
          description: 'Check daily benchmark rates with voice assistance, capture camera weighbridge proof, and record GPS location.',
          buttonText: 'Go to Collector',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 2,
          actor: '🏭 Authorized Recycler',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/requests',
          title: 'Formal Bidding & Pickup Scheduling',
          description: 'Inspect incoming lot materials and weights, place formal bids under CPCB compliance, and assign doorstep pickup.',
          buttonText: 'Go to Recycler',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 3,
          actor: '📦 Collector',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/requests',
          title: 'Compare & Accept Formal Offers',
          description: 'Compare competing recycler bids (Best Price badge), verify zero deductions, and lock deal in 1 tap.',
          buttonText: 'View Offers',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 4,
          actor: '🏭 Authorized Recycler',
          role: 'RECYCLER' as UserRole,
          route: '/recycler/pickups',
          title: 'Calibrated Scale Weighing & OTP Verification',
          description: 'Validate collector 4-digit handover OTP, log calibrated electronic scale weight, and issue instant ledger voucher.',
          buttonText: 'Verify Weighment',
          color: 'border-blue-500/60 bg-blue-950/20 text-blue-400'
        },
        {
          step: 5,
          actor: '📦 Collector',
          role: 'COLLECTOR' as UserRole,
          route: '/collector/ledger',
          title: 'Passbook Ledger & +72.4% Net Margin Uplift',
          description: 'Review digital settlement vouchers, breakdown of earnings, and confirmed +72.4% net margin gain versus middlemen.',
          buttonText: 'View Passbook',
          color: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-400'
        },
        {
          step: 6,
          actor: '🏛️ CPCB National Admin',
          role: 'ADMIN' as UserRole,
          route: '/admin',
          title: 'SHA-256 Merkle Chain & National EPR Datasets',
          description: 'Inspect tamper-free chain of custody, interactive national GIS map, anomaly detection, and download dynamic CSV datasets.',
          buttonText: 'Go to CPCB Admin',
          color: 'border-purple-500/60 bg-purple-950/20 text-purple-400'
        }
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xl shadow">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {language === 'hi' ? 'एसआईएच 2026 जज प्रदर्शन गाइड' : language === 'mr' ? 'एसआयएच 2026 परीक्षक मार्गदर्शक' : 'SIH 2026 Judge Demonstration Guide'}
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                  {language === 'hi' ? 'पीएस #229' : language === 'mr' ? 'पीएस #229' : 'PS #229'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {language === 'hi'
                  ? 'कलेक्टर → औपचारिक रीसाइक्लिंग चेन: 6 चरणों की पूर्ण यात्रा (5 मिनट वॉकथ्रू)'
                  : language === 'mr'
                  ? 'कलेक्टर → अधिकृत रीसायकलिंग साखळी: 6 टप्प्यांचा संपूर्ण प्रवास (5 मिनिटे)'
                  : 'Collector → Formal Recycling Chain: Complete 6-Stage Journey (5-Minute Walkthrough)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Steps List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-slate-300 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              {language === 'hi' ? '💡 जजों के लिए त्वरित निर्देश:' : language === 'mr' ? '💡 परीक्षकांसाठी सूचना:' : '💡 Instructions for Judges:'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {language === 'hi'
                ? 'नीचे दिए गए चरणों में से किसी भी बटन पर क्लिक करें। सिस्टम स्वचालित रूप से संबंधित भूमिका (कलेक्टर/रीसाइक्लर/एडमिन) में स्विच होकर उस स्क्रीन पर ले जाएगा।'
                : language === 'mr'
                ? 'खालील टप्प्यांपैकी कोणत्याही बटनावर क्लिक करा. सिस्टीम आपोआप संबंधित भूमिकेत (कलेक्टर/रीसायकलर/अॅडमिन) स्विच होऊन त्या स्क्रीनवर घेऊन जाईल.'
                : 'Click any step button below. The system will automatically switch to the designated role (Collector/Recycler/Admin) and navigate directly to that screen.'}
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className={`border-2 ${s.color} rounded-2xl p-4 transition-all hover:border-emerald-400 space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-white">
                    {language === 'hi' ? 'चरण' : language === 'mr' ? 'टप्पा' : 'Step'} {s.step} • {s.actor}
                  </span>
                  {role === s.role && (
                    <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === 'hi' ? 'सक्रिय भूमिका' : language === 'mr' ? 'सक्रिय भूमिका' : 'Active Role'}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black text-white">{s.title}</h3>
                <p className="text-slate-300 text-[11px] leading-relaxed">{s.description}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleStepAction(s.role, s.route)}
                    className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-all"
                  >
                    <span>{s.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>{t.appTitle || 'Kabadiwala Connect'} • {language === 'hi' ? 'स्मार्ट इंडिया हैकथॉन 2026' : language === 'mr' ? 'स्मार्ट इंडिया हॅकाथॉन 2026' : 'Smart India Hackathon 2026'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
          >
            {language === 'hi' ? 'बंद करें' : language === 'mr' ? 'बंद करा' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
