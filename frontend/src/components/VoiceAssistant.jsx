import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function VoiceAssistant({ onLinkToken, suggestedToken }) {
  const [phase, setPhase] = useState('idle'); // idle, speaking, listening_token, speaking_reason, listening_reason, processing, success, error
  const [transcript, setTranscript] = useState('');
  const [capturedToken, setCapturedToken] = useState(null);
  
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
    
    // Ensure voices are loaded
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text, onEnd) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen')
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const startListeningToken = () => {
    if (!recognitionRef.current) return alert("Browser does not support Speech Recognition.");
    
    setPhase('speaking');
    setTranscript('');
    setCapturedToken(null);
    
    speak(`Welcome! What is your token number? For example, say Token ${suggestedToken}.`, () => {
      setPhase('listening_token');
      recognitionRef.current.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join('');
        setTranscript(text);
        if (e.results[0].isFinal) {
          // Parse number from text
          const nums = text.match(/\d+/);
          if (nums) {
            const tokenNum = parseInt(nums[0], 10);
            setCapturedToken(tokenNum);
            try { recognitionRef.current.stop(); } catch(e){}
            setTimeout(() => askReason(tokenNum), 300);
          } else {
            try { recognitionRef.current.stop(); } catch(e){}
            setPhase('error');
            speak("I didn't catch a number. Please try again.");
            setTimeout(() => setPhase('idle'), 3000);
          }
        }
      };
      recognitionRef.current.onerror = () => {
        setPhase('error');
        setTimeout(() => setPhase('idle'), 2000);
      };
      
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    });
  };

  const askReason = (tokenNum) => {
    setPhase('speaking_reason');
    setTranscript('');
    speak(`Got it. Token ${tokenNum}. What brings you to the clinic today? Please briefly describe your symptoms.`, () => {
      setPhase('listening_reason');
      recognitionRef.current.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join('');
        setTranscript(text);
        if (e.results[0].isFinal) {
          try { recognitionRef.current.stop(); } catch(e){}
          submitData(tokenNum, text);
        }
      };
      recognitionRef.current.onerror = () => {
        setPhase('error');
        setTimeout(() => setPhase('idle'), 2000);
      };
      try { recognitionRef.current.start(); } catch(e){ console.error(e); }
    });
  };

  const submitData = async (tokenNum, reason) => {
    setPhase('processing');
    try {
      await onLinkToken(tokenNum, reason);
      setPhase('success');
      speak(`All done! Token ${tokenNum} is now linked. Please take a seat in the waiting room.`);
      setTimeout(() => setPhase('idle'), 5000);
    } catch (err) {
      setPhase('error');
      speak("There was a problem linking your token. Please check with the front desk.");
      setTimeout(() => setPhase('idle'), 3000);
    }
  };

  const cancel = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    setPhase('idle');
  };

  return (
    <>
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0, opacity: 0 }}
            onClick={startListeningToken}
            style={{
              position: 'fixed', bottom: 40, right: 40, zIndex: 100,
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4)'
            }}
            title="Use Voice Assistant"
          >
            <Mic size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 40, right: 40, zIndex: 100,
              width: 320, background: 'var(--color-bg-elev)',
              borderRadius: 24, padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: 16,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <button onClick={cancel} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: phase.includes('listening') ? '#ef4444' : (phase === 'success' ? '#10b981' : (phase === 'error' ? '#f59e0b' : 'var(--color-primary-soft)')),
                color: phase.includes('listening') || phase === 'success' || phase === 'error' ? '#fff' : 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {phase.includes('listening') ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Mic size={24} />
                  </motion.div>
                ) : phase === 'success' ? (
                  <CheckCircle2 size={24} />
                ) : phase === 'error' ? (
                  <ShieldAlert size={24} />
                ) : (
                  <Activity size={24} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-ink)' }}>AI Assistant</div>
                <div style={{ fontSize: 12, color: 'var(--color-primary)' }}>
                  {phase === 'speaking' || phase === 'speaking_reason' ? 'Speaking...' :
                   phase === 'listening_token' ? 'Listening for token number...' :
                   phase === 'listening_reason' ? 'Listening for symptoms...' :
                   phase === 'processing' ? 'Linking your token...' :
                   phase === 'success' ? 'Successfully linked!' :
                   phase === 'error' ? 'An error occurred' : ''}
                </div>
              </div>
            </div>

            {(transcript || capturedToken) && (
              <div style={{ background: 'var(--color-surface-2)', padding: 16, borderRadius: 12, fontSize: 14 }}>
                {capturedToken && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>Token: #{capturedToken}</div>}
                {transcript && <div style={{ color: 'var(--color-ink-soft)', fontStyle: 'italic' }}>"{transcript}"</div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
