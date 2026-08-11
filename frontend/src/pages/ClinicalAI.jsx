import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Brain, Sparkles, Search, Thermometer, Flame, Pill, 
  AlertTriangle, CheckCircle2, HeartPulse, ChevronRight, HelpCircle, Volume2, Loader2, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const FALLBACK_FLASHCARDS = [
  {
    _id: '1',
    idKey: 'fever',
    title: 'Fever (Pyrexia)',
    subtitle: 'Body temp > 99.5°F (37.5°C)',
    tagClass: 'flashcard__tag--fever',
    category: 'General & Viral Infections',
    symptoms: ['Elevated body temperature', 'Chills & shivering', 'Sweating', 'Body aches', 'Fatigue'],
    homeCare: [
      'Lukewarm water sponge bathing (avoid cold water shocks).',
      'Maintain continuous fluid intake (ORSL, coconut water, soups).',
      'Wear lightweight, breathable clothing.',
      'Ensure adequate rest in a well-ventilated room.'
    ],
    otcMedications: [
      'Paracetamol / Acetaminophen (500mg - 650mg every 4-6 hrs as needed, max 4g/day).',
      'Ibuprofen (if advised by doctor, avoid in suspected Dengue).'
    ],
    redFlags: [
      'Temperature > 103°F (39.4°C) lasting over 3 days.',
      'Stiff neck, severe photophobia, or confusion.',
      'Breathing difficulty or severe chest pain.'
    ],
    medicalTip: 'Avoid aspirin in children under 16 due to risk of Reye\'s Syndrome.'
  },
  {
    _id: '2',
    idKey: 'flu',
    title: 'Flu & Common Cold',
    subtitle: 'Influenza & Upper Respiratory Infection',
    tagClass: 'flashcard__tag--flu',
    category: 'Respiratory',
    symptoms: ['Runny or congested nose', 'Sore throat & cough', 'Sneezing', 'Low-grade fever', 'Mild headache'],
    homeCare: [
      'Steam inhalation with eucalyptus or saline drops twice daily.',
      'Warm salt-water gargles (3-4 times a day).',
      'Honey and ginger tea for throat soothing.',
      'Hydrate with warm fluids and broth.'
    ],
    otcMedications: [
      'Antihistamines (Cetirizine / Levocetirizine for nasal congestion).',
      'Decongestant sprays (Oxymetazoline - max 3-5 consecutive days).',
      'Throat lozenges (Amylmetacresol / Dichlorobenzyl alcohol).'
    ],
    redFlags: [
      'Shortness of breath, wheezing, or bluish lips.',
      'Persistent high fever returning after initial fever drop.',
      'Inability to swallow liquids.'
    ],
    medicalTip: 'Antibiotics do not work against viral flu or cold infections.'
  },
  {
    _id: '3',
    idKey: 'constipation',
    title: 'Constipation',
    subtitle: 'Infrequent or painful bowel movements',
    tagClass: 'flashcard__tag--constipation',
    category: 'Gastrointestinal',
    symptoms: ['Fewer than 3 bowel movements per week', 'Hard, dry, or lumpy stools', 'Straining during defecation', 'Abdominal bloating'],
    homeCare: [
      'Increase dietary fiber intake (prunes, oatmeal, psyllium husk / Isabgol).',
      'Drink at least 2.5 to 3 Liters of water daily.',
      'Engage in 20-30 mins of light walking to stimulate intestinal peristalsis.',
      'Establish a regular bowel schedule.'
    ],
    otcMedications: [
      'Bulk-forming laxatives (Psyllium Husk / Isabgol with full glass of water).',
      'Osmotic laxatives (Lactulose / Polyethylene Glycol syrup).',
      'Stool softeners (Docusate Sodium).'
    ],
    redFlags: [
      'Severe abdominal pain with vomiting and inability to pass gas.',
      'Blood in stool or rectal bleeding.',
      'Unexplained weight loss or sudden onset constipation in adults > 50.'
    ],
    medicalTip: 'Do not rely on stimulant laxatives (e.g. Senna) for long-term daily use.'
  },
  {
    _id: '4',
    idKey: 'loose-motion',
    title: 'Loose Motion (Diarrhea)',
    subtitle: 'Frequent watery bowel movements',
    tagClass: 'flashcard__tag--loose-motion',
    category: 'Gastrointestinal',
    symptoms: ['Watery stools (> 3 times/day)', 'Abdominal cramps', 'Nausea', 'Urgency to evacuate', 'Dehydration signs'],
    homeCare: [
      'Immediate Oral Rehydration Solution (ORS) after every loose stool.',
      'BRAT Diet (Bananas, Rice, Applesauce, Toast).',
      'Probiotic-rich yogurt / buttermilk (curd with cumin).',
      'Avoid dairy, spicy foods, caffeine, and artificial sugars.'
    ],
    otcMedications: [
      'ORS Packets (WHO recommended formula).',
      'Probiotic capsules (Saccharomyces boulardii / Bacillus clausii).',
      'Loperamide (ONLY for acute non-infectious diarrhea without blood/fever).'
    ],
    redFlags: [
      'Blood or mucus in stool (Dysentery signs).',
      'High fever (> 101.5°F) accompanying diarrhea.',
      'Severe dehydration (sunken eyes, extreme thirst, dry mouth, no urine in 6 hrs).'
    ],
    medicalTip: 'Primary goal is fluid and electrolyte replacement, not stopping bowel movements.'
  },
  {
    _id: '5',
    idKey: 'vomiting',
    title: 'Vomiting & Nausea',
    subtitle: 'Gastric emesis & stomach upset',
    tagClass: 'flashcard__tag--vomiting',
    category: 'Gastrointestinal',
    symptoms: ['Nausea & retching', 'Involuntary stomach emptying', 'Excessive salivation', 'Cold sweats', 'Dizziness'],
    homeCare: [
      'Withhold solid food for 2-3 hours after vomiting.',
      'Sip small quantities of clear fluids (ORS, electrolyte water) every 10-15 mins.',
      'Ginger tea or mint candy to relieve nausea.',
      'Gradually reintroduce bland foods (dry crackers, rice broth).'
    ],
    otcMedications: [
      'Ondansetron 4mg (Orally Disintegrating Tablet - as prescribed/advised).',
      'Domperidone / Metoclopramide (Anti-emetics).'
    ],
    redFlags: [
      'Vomiting blood or coffee-ground like material.',
      'Inability to retain any liquids for more than 12 hours.',
      'Severe headache, neck stiffness, or confusion alongside emesis.'
    ],
    medicalTip: 'Do not drink large amounts of water at once; small frequent sips prevent triggering retching.'
  },
  {
    _id: '6',
    idKey: 'acidity',
    title: 'Acidity & GERD / Heartburn',
    subtitle: 'Acid reflux & substernal burning',
    tagClass: 'flashcard__tag--acidity',
    category: 'Gastrointestinal',
    symptoms: ['Burning chest pain behind breastbone', 'Acid regurgitation', 'Sour taste in throat', 'Bloating & belching'],
    homeCare: [
      'Avoid lying down for 2-3 hours after meals.',
      'Elevate head of bed by 6 inches while sleeping.',
      'Eat smaller, frequent meals instead of heavy dinners.',
      'Avoid trigger foods (citrus, spicy, fried, carbonated drinks, chocolate).'
    ],
    otcMedications: [
      'Antacid Liquids / Chewables (Magnesium & Aluminium Hydroxide with Simethicone).',
      'H2 Blockers (Famotidine 20mg).',
      'Proton Pump Inhibitors (Omeprazole 20mg / Pantoprazole 40mg taken 30 mins before breakfast).'
    ],
    redFlags: [
      'Chest pain radiating to jaw, left arm, or back (may mimic heart attack!).',
      'Difficulty or pain when swallowing food (dysphagia).',
      'Black tarry stools.'
    ],
    medicalTip: 'Sudden severe chest burning in adults over 40 should always be checked to rule out cardiac causes.'
  }
];

export default function ClinicalAI() {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabs, setActiveTabs] = useState({});
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [askingAi, setAskingAi] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  
  // Disease prediction state
  const [predForm, setPredForm] = useState({
    fever: 37.0, fatigue: 0, muscle_pain: 0, headache: 0,
    cough: 0, nausea: 0, diarrhea: 0
  });
  const [predResult, setPredResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [showPredictor, setShowPredictor] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/clinical-ai/flashcards`);
      if (res.ok) {
        const data = await res.json();
        setFlashcards(data);
      } else {
        setFlashcards(FALLBACK_FLASHCARDS);
      }
    } catch (err) {
      console.warn('Backend fetch failed, using fallback dataset:', err);
      setFlashcards(FALLBACK_FLASHCARDS);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    try {
      setAskingAi(true);
      const res = await fetch(`${API_BASE_URL}/api/clinical-ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
      }
    } catch (err) {
      console.error('Ask AI error:', err);
    } finally {
      setAskingAi(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setPredicting(true);
      const res = await fetch(`${API_BASE_URL}/api/ml/predict-disease`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predForm)
      });
      if (res.ok) {
        const data = await res.json();
        setPredResult(data);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setPredicting(false);
    }
  };

  const handleTabChange = (cardId, tab) => {
    setActiveTabs(prev => ({ ...prev, [cardId]: tab }));
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1; // Slightly higher pitch for clarity
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('karen')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredCards = flashcards.filter(card => {
    const q = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(q) ||
           card.category.toLowerCase().includes(q) ||
           (card.symptoms && card.symptoms.some(s => s.toLowerCase().includes(q))) ||
           (card.otcMedications && card.otcMedications.some(m => m.toLowerCase().includes(q)));
  });

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <motion.div 
                whileHover={{ rotate: 18, scale: 1.1 }}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center' }}
              >
                <Brain size={22} />
              </motion.div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Clinica AI Medical Flashcards
              </h1>
              <motion.span 
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ fontSize: 11, fontWeight: 700, background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Sparkles size={12} /> AI Connected
              </motion.span>
            </div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, margin: 0 }}>
              Interactive clinical flashcards with real-time query assistant support.
            </p>
          </div>

          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/assistant')}
            className="btn btn--primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontSize: 14 }}
          >
            <HelpCircle size={18} />
            <span>Ask Clinic AI Assistant</span>
          </motion.button>
        </motion.div>

        {/* AI Quick Query Form */}
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          onSubmit={handleAskAi} 
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}
        >
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--color-ink)' }}>
            🤖 Quick Clinical AI Symptom & Remedy Query
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="input"
              placeholder="Ask Clinical AI e.g. What is the immediate treatment for loose motion or fever?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              style={{ flex: 1, height: 42, borderRadius: 10, fontSize: 14 }}
            />
            <motion.button 
              whileTap={{ scale: 0.95 }}
              type="submit" 
              disabled={askingAi || !aiQuestion.trim()}
              className="btn btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', borderRadius: 10, fontSize: 14 }}
            >
              {askingAi ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              <span>Query AI</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {aiResponse && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 14, padding: 14, background: 'var(--color-surface-2)', borderRadius: 10, borderLeft: '4px solid var(--color-primary)', fontSize: 13, color: 'var(--color-ink)', whiteSpace: 'pre-line' }}
              >
                <strong>AI Advice for "{aiResponse.question}":</strong>
                <div style={{ marginTop: 6 }}>{aiResponse.answer}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Disease Prediction Box */}
        <div style={{ marginBottom: 24 }}>
          <button 
            className="btn btn--outline" 
            onClick={() => setShowPredictor(!showPredictor)}
            style={{ width: '100%', padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartPulse size={18} color="var(--color-primary)" /> 
              Try the New Disease Predictor
            </span>
            <ChevronRight size={18} style={{ transform: showPredictor ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
          </button>
          
          <AnimatePresence>
            {showPredictor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <form 
                  onSubmit={handlePredict}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, marginTop: 12, boxShadow: 'var(--shadow-sm)' }}
                >
                  <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16, marginTop: 0 }}>
                    Enter patient symptoms below to get an AI-powered disease prediction. Scale is 0 (None) to 10 (Severe).
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Fever (°C)</label>
                      <input type="number" step="0.1" className="input" value={predForm.fever} onChange={e => setPredForm({...predForm, fever: parseFloat(e.target.value)})} style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Fatigue (0-10)</label>
                      <input type="number" min="0" max="10" className="input" value={predForm.fatigue} onChange={e => setPredForm({...predForm, fatigue: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Muscle Pain (0-10)</label>
                      <input type="number" min="0" max="10" className="input" value={predForm.muscle_pain} onChange={e => setPredForm({...predForm, muscle_pain: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Headache (0-10)</label>
                      <input type="number" min="0" max="10" className="input" value={predForm.headache} onChange={e => setPredForm({...predForm, headache: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Cough (0=No, 1=Mild, 2=Severe)</label>
                      <input type="number" min="0" max="2" className="input" value={predForm.cough} onChange={e => setPredForm({...predForm, cough: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Nausea (0=No, 1=Yes)</label>
                      <select className="input" value={predForm.nausea} onChange={e => setPredForm({...predForm, nausea: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }}>
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4, display: 'block' }}>Diarrhea (0=No, 1=Yes)</label>
                      <select className="input" value={predForm.diarrhea} onChange={e => setPredForm({...predForm, diarrhea: parseInt(e.target.value)})} style={{ width: '100%', height: 38 }}>
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button type="submit" disabled={predicting} className="btn btn--primary" style={{ padding: '8px 24px', borderRadius: 8 }}>
                      {predicting ? <Loader2 size={16} className="spin" /> : 'Run Prediction Model'}
                    </button>
                    {predicting && <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Running analysis...</span>}
                  </div>

                  <AnimatePresence>
                    {predResult && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ marginTop: 20, padding: 16, background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)', borderRadius: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Brain size={24} color="var(--color-primary-dark)" />
                          <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Prediction: {predResult.disease}</h3>
                        </div>
                        <p style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--color-ink-soft)' }}>
                          Confidence Score: <strong>{predResult.confidence}%</strong>
                        </p>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                          <strong>Probabilities:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                            {Object.entries(predResult.probabilities || {}).map(([key, val]) => (
                              <li key={key}>{key}: {(val * 100).toFixed(1)}%</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search symptoms, conditions (e.g. fever, flu, vomiting, constipation, loose motion)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 42, width: '100%', height: 44, borderRadius: 12, fontSize: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14 }}>Loading medical flashcards from backend database...</p>
          </div>
        ) : (
          /* Medical Flashcards Grid with Staggered Entrance */
          <motion.div 
            className="flashcards-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {filteredCards.map((card) => {
              const cardId = card._id || card.idKey;
              const currentTab = activeTabs[cardId] || 'symptoms';

              return (
                <motion.div 
                  key={cardId} 
                  variants={{
                    hidden: { opacity: 0, y: 24, scale: 0.98 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(13, 148, 136, 0.15)' }}
                  transition={{ duration: 0.25 }}
                  className="flashcard"
                >
                  {/* Header */}
                  <div className="flashcard__header">
                    <div>
                      <span className={`flashcard__tag ${card.tagClass}`}>{card.category}</span>
                      <h3 className="flashcard__title" style={{ marginTop: 6, marginBottom: 2 }}>{card.title}</h3>
                      <div className="flashcard__subtitle">{card.subtitle}</div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => speakText(`${card.title}. Symptoms: ${(card.symptoms || []).join(', ')}. First care: ${(card.homeCare || []).join(' ')}`)}
                      title="Listen to summary"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, display: 'grid', placeItems: 'center', color: 'var(--color-ink-soft)', cursor: 'pointer' }}
                    >
                      <Volume2 size={16} />
                    </motion.button>
                  </div>

                  {/* Navigation Tabs for Flashcard */}
                  <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-2)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => handleTabChange(cardId, 'symptoms')}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                        background: currentTab === 'symptoms' ? 'var(--color-surface)' : 'transparent',
                        color: currentTab === 'symptoms' ? 'var(--color-primary-dark)' : 'var(--color-muted)',
                        boxShadow: currentTab === 'symptoms' ? 'var(--shadow-sm)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Symptoms
                    </button>
                    <button
                      onClick={() => handleTabChange(cardId, 'homeCare')}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                        background: currentTab === 'homeCare' ? 'var(--color-surface)' : 'transparent',
                        color: currentTab === 'homeCare' ? 'var(--color-primary-dark)' : 'var(--color-muted)',
                        boxShadow: currentTab === 'homeCare' ? 'var(--shadow-sm)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Home Care
                    </button>
                    <button
                      onClick={() => handleTabChange(cardId, 'otc')}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                        background: currentTab === 'otc' ? 'var(--color-surface)' : 'transparent',
                        color: currentTab === 'otc' ? 'var(--color-primary-dark)' : 'var(--color-muted)',
                        boxShadow: currentTab === 'otc' ? 'var(--shadow-sm)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      OTC Meds
                    </button>
                    <button
                      onClick={() => handleTabChange(cardId, 'redFlags')}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                        background: currentTab === 'redFlags' ? '#FEF2F2' : 'transparent',
                        color: currentTab === 'redFlags' ? '#991B1B' : 'var(--color-muted)',
                        boxShadow: currentTab === 'redFlags' ? 'var(--shadow-sm)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Red Flags
                    </button>
                  </div>

                  {/* Tab Content with Framer Motion transitions */}
                  <div style={{ minHeight: 140 }}>
                    <AnimatePresence mode="wait">
                      {currentTab === 'symptoms' && (
                        <motion.div
                          key="symptoms"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.18 }}
                        >
                          <div className="flashcard__section-title">
                            <Thermometer size={14} color="var(--color-primary)" /> Key Symptoms
                          </div>
                          <div className="flashcard__pill-list">
                            {(card.symptoms || []).map((s, idx) => (
                              <span key={idx} className="flashcard__pill">{s}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {currentTab === 'homeCare' && (
                        <motion.div
                          key="homeCare"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.18 }}
                        >
                          <div className="flashcard__section-title">
                            <CheckCircle2 size={14} color="var(--color-primary)" /> Home Care & First Line Remedies
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-ink-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(card.homeCare || []).map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {currentTab === 'otc' && (
                        <motion.div
                          key="otc"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.18 }}
                        >
                          <div className="flashcard__section-title">
                            <Pill size={14} color="var(--color-primary)" /> Recommended OTC Medicines
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-ink-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(card.otcMedications || []).map((med, idx) => (
                              <li key={idx}>{med}</li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {currentTab === 'redFlags' && (
                        <motion.div
                          key="redFlags"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.18 }}
                          className="flashcard__warning-box"
                        >
                          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong style={{ display: 'block', marginBottom: 4 }}>Emergency Red Flags (Seek Doctor Immediately):</strong>
                            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {(card.redFlags || []).map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Medical Tip / Disclaimer footer */}
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>💡 <em>{card.medicalTip}</em></span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && filteredCards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}
          >
            <Brain size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-ink)' }}>No flashcards found</h3>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>Try searching for "fever", "flu", "loose motion", "constipation", or "vomiting".</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
