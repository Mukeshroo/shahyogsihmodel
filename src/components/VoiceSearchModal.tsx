import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Mic, MicOff, X, Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: string, query: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectService
}) => {
  const { language, speak } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<{ id: string; name: string } | null>(null);

  // Suggested voice samples in Hindi & English
  const samplePrompts = [
    { text: 'मुझे तुरंत इलेक्ट्रीशियन चाहिए, एमसीबी ट्रिप हो रही है', catId: 'cat-electrician', name: 'Electrician' },
    { text: 'नल में लीकेज है, तुरंत प्लंबर भेजो', catId: 'cat-plumber', name: 'Plumbing' },
    { text: 'घर की गहरी सफाई करवानी है', catId: 'cat-cleaner', name: 'Deep Cleaning' },
    { text: 'Need RO and Geyser repair technician in Kalyanpur', catId: 'cat-appliance', name: 'Appliance Repair' },
    { text: 'दरवाजे का लॉक और कब्जा ठीक कराना है', catId: 'cat-carpenter', name: 'Carpentry' }
  ];

  // Natural language intent parser
  const parseIntent = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('नल') || lower.includes('प्लंबर') || lower.includes('लीकेज') || lower.includes('plumber') || lower.includes('pipe') || lower.includes('पानी')) {
      return { id: 'cat-plumber', name: 'Plumbing & Pipe Repair (प्लंबर)' };
    }
    if (lower.includes('बिजली') || lower.includes('इलेक्ट्रीशियन') || lower.includes('electric') || lower.includes('mcb') || lower.includes('वायरिंग') || lower.includes('वायर')) {
      return { id: 'cat-electrician', name: 'Electrician Services (इलेक्ट्रीशियन)' };
    }
    if (lower.includes('सफाई') || lower.includes('clean') || lower.includes('झाड़ू') || lower.includes('धुलाई')) {
      return { id: 'cat-cleaner', name: 'Deep Cleaning & Sanitization (सफाई)' };
    }
    if (lower.includes('उपकरण') || lower.includes('गीजर') || lower.includes('फ्रिज') || lower.includes('ro') || lower.includes('appliance') || lower.includes('वाशिंग')) {
      return { id: 'cat-appliance', name: 'Home Appliance Repair (उपकरण मरम्मत)' };
    }
    if (lower.includes('बढ़ई') || lower.includes('लकड़ी') || lower.includes('ताला') || lower.includes('carpenter') || lower.includes('दरवाजा')) {
      return { id: 'cat-carpenter', name: 'Carpentry & Woodwork (बढ़ई)' };
    }
    if (lower.includes('पेंट') || lower.includes('पुताई') || lower.includes('सीलन') || lower.includes('paint')) {
      return { id: 'cat-painter', name: 'Painting & Waterproofing (पेंटिंग)' };
    }
    return null;
  };

  const handleTextChange = (text: string) => {
    setTranscript(text);
    const cat = parseIntent(text);
    setDetectedCategory(cat);
  };

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setDetectedCategory(null);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          handleTextChange(text);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        setIsListening(false);
      }
    } else {
      // Browser fallback simulator
      setTimeout(() => {
        const sample = samplePrompts[0];
        handleTextChange(sample.text);
        setIsListening(false);
      }, 1500);
    }
  };

  const confirmSearch = () => {
    if (detectedCategory) {
      const msg = language === 'hi'
        ? `हमने आपके लिए कानपुर में उपलब्ध सहकारी ${detectedCategory.name} कारीगर खोज लिए हैं।`
        : `Found verified cooperative technicians for ${detectedCategory.name} in Kanpur.`;
      speak(msg);
      onSelectService(detectedCategory.id, transcript);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#087F5B] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bhashini Voice AI · भारतीय भाषा समर्थन</span>
          </div>
          <h3 className="text-lg font-bold text-[#12304A]">
            {language === 'hi' ? 'बोलकर मिस्त्री या सेवा बुक करें' : 'Voice-to-Service Booking'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'हिंदी या अंग्रेजी में अपनी आवश्यकता बोलें, जैसे "मुझे इलेक्ट्रीशियन चाहिए"'
              : 'Speak in Hindi or English, e.g. "I need an electrician for wiring repair"'}
          </p>
        </div>

        {/* Central Pulsating Mic Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={isListening ? () => setIsListening(false) : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white ring-8 ring-rose-100 scale-110 animate-pulse'
                : 'bg-[#087F5B] hover:bg-[#066347] text-white ring-4 ring-emerald-50'
            }`}
          >
            {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs font-medium text-slate-500 mt-3">
            {isListening
              ? (language === 'hi' ? 'सुन रहे हैं... बोलिए' : 'Listening... Speak now')
              : (language === 'hi' ? 'माइक पर टैप करके बोलें' : 'Tap mic to speak')}
          </span>
        </div>

        {/* Transcript / Result Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-4 min-h-[70px] flex flex-col justify-center">
          {transcript ? (
            <p className="text-sm font-semibold text-slate-800 italic">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              {language === 'hi' ? 'आपकी आवाज यहां दिखाई देगी...' : 'Your speech transcription will appear here...'}
            </p>
          )}

          {detectedCategory && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>पहचानी गई सेवा: {detectedCategory.name}</span>
              </div>
              <button
                onClick={confirmSearch}
                className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <span>मिस्त्री देखें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Voice Demo Phrases */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {language === 'hi' ? 'या इन उदाहरणों पर टैप करें:' : 'Or tap a sample phrase:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleTextChange(p.text);
                }}
                className="text-left text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                "{p.text}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
