import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Activity, Search, Filter, Clock, AlertCircle, 
  CheckCircle2, DollarSign, Calculator, ChevronRight, ShieldCheck, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';

const FALLBACK_TREATMENTS = [
  {
    _id: '1',
    idKey: 'mri-brain',
    name: 'MRI Brain (3.0 Tesla High-Res)',
    category: 'Imaging & Scans',
    cost: 4500,
    currency: '₹',
    turnaround: 'Same Day (4 Hours)',
    prep: 'No metal items/pacemakers. Fasting for 3 hours prior.',
    description: 'High-resolution neuroimaging for severe headaches, seizure, memory evaluation, and cranial vessel scans.',
    popular: true
  },
  {
    _id: '2',
    idKey: 'ct-chest',
    name: 'CT Chest HRCT (High Resolution)',
    category: 'Imaging & Scans',
    cost: 3200,
    currency: '₹',
    turnaround: '2-3 Hours',
    prep: '4 hours fasting if contrast dye is required.',
    description: 'Detailed 3D imaging of pulmonary structures, airway assessment, and parenchymal infection screening.',
    popular: true
  },
  {
    _id: '3',
    idKey: 'usg-abdomen',
    name: 'Ultrasound Whole Abdomen & Pelvis',
    category: 'Imaging & Scans',
    cost: 1200,
    currency: '₹',
    turnaround: 'Instant / 30 Mins',
    prep: 'Full bladder required (drink 1L water 1 hr before scan).',
    description: 'Comprehensive sonogram for liver, gallbladder, kidneys, pancreas, spleen, and pelvic organs.',
    popular: true
  },
  {
    _id: '4',
    idKey: 'cbc-esr',
    name: 'Complete Blood Count (CBC) + ESR',
    category: 'Pathology & Labs',
    cost: 400,
    currency: '₹',
    turnaround: '4 Hours',
    prep: 'Overnight fasting (8-10 hours) recommended.',
    description: 'Measures Hb, WBC differential, platelet count, RBC indices, and systemic inflammation marker.',
    popular: true
  },
  {
    _id: '5',
    idKey: 'ecg-cardiac',
    name: '12-Lead Digital ECG',
    category: 'Cardiology',
    cost: 350,
    currency: '₹',
    turnaround: 'Immediate',
    prep: 'Avoid heavy exercise right before test.',
    description: 'Non-invasive electrical activity monitoring of heart rhythm, arrhythmia, and ischemia detection.',
    popular: true
  },
  {
    _id: '6',
    idKey: 'iv-drip-hydration',
    name: 'Emergency IV Hydration & Electrolyte Infusion',
    category: 'Treatments & Procedures',
    cost: 1500,
    currency: '₹',
    turnaround: '45-60 Mins',
    prep: 'Administered in clinic day-care lounge.',
    description: 'Rapid rehydration for acute gastroenteritis, severe dehydration, heat stroke, or post-vomiting weakness.',
    popular: true
  }
];

const CATEGORIES = [
  'All',
  'Imaging & Scans',
  'Pathology & Labs',
  'Cardiology',
  'Treatments & Procedures'
];

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/treatments`);
      if (res.ok) {
        const data = await res.json();
        setTreatments(data);
      } else {
        setTreatments(FALLBACK_TREATMENTS);
      }
    } catch (err) {
      console.warn('Backend fetch failed, using fallback dataset:', err);
      setTreatments(FALLBACK_TREATMENTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = treatments.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleSelectItem = (item) => {
    const itemId = item._id || item.idKey;
    if (selectedItems.some(i => (i._id || i.idKey) === itemId)) {
      setSelectedItems(selectedItems.filter(i => (i._id || i.idKey) !== itemId));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const totalEstimate = selectedItems.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">
        {/* Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center' }}
              >
                <Activity size={22} />
              </motion.div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Treatments, Scans & Pricing
              </h1>
            </div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, margin: 0 }}>
              Transparent hospital pricing, diagnostic scan turnaround times, and pre-procedure guidelines fetched live from database.
            </p>
          </div>

          {/* Estimate summary button */}
          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowEstimateModal(true)}
            className="btn btn--primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontSize: 14 }}
          >
            <Calculator size={18} />
            <span>Estimate Package ({selectedItems.length})</span>
            {totalEstimate > 0 && (
              <motion.span 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}
              >
                ₹{totalEstimate.toLocaleString()}
              </motion.span>
            )}
          </motion.button>
        </motion.div>

        {/* Search & Category Filter bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search scans, tests, MRI, ultrasound, CBC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 42, width: '100%', height: 42, borderRadius: 10, fontSize: 14 }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                  background: activeCategory === cat ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  color: activeCategory === cat ? 'var(--color-primary-dark)' : 'var(--color-ink-soft)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background .15s ease, border-color .15s ease'
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14 }}>Fetching hospital treatment rates from backend database...</p>
          </div>
        ) : (
          /* Treatments Grid with AnimatePresence */
          <motion.div 
            className="treatments-grid"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06 }
              }
            }}
          >
            {filteredData.map((item) => {
              const itemId = item._id || item.idKey;
              const isSelected = selectedItems.some(i => (i._id || i.idKey) === itemId);
              return (
                <motion.div 
                  key={itemId} 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)' }}
                  transition={{ duration: 0.25 }}
                  className="treatment-card"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary)' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px var(--color-primary-soft)' : undefined
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span className="treatment-card__badge">{item.category}</span>
                      {item.popular && (
                        <motion.span 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5 }}
                          style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 12 }}
                        >
                          ★ Most Requested
                        </motion.span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                      {item.name}
                    </h3>

                    <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                      {item.description}
                    </p>

                    <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--color-primary)" />
                        <span><strong>Turnaround:</strong> {item.turnaround}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <AlertCircle size={14} color="var(--color-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span><strong>Prep:</strong> {item.prep}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="treatment-card__unit">Hospital Amount</span>
                      <div className="treatment-card__price">
                        <span>{item.currency}{item.cost.toLocaleString()}</span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSelectItem(item)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color: isSelected ? 'white' : 'var(--color-ink)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'background .15s ease, border-color .15s ease'
                      }}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <span>+ Select</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!loading && filteredData.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}
          >
            <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-ink)' }}>No matching treatments or scans found</h3>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>Try searching with a different term like "MRI", "blood", or "X-ray"</p>
          </motion.div>
        )}

        {/* Animated Modal / Drawer for Cost Estimate */}
        <AnimatePresence>
          {showEstimateModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEstimateModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: 20 }}
            >
              <motion.div 
                initial={{ scale: 0.88, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'var(--color-surface)', width: '100%', maxWidth: 480, borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calculator size={20} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}>Hospital Cost Breakdown</h3>
                  </div>
                  <button 
                    onClick={() => setShowEstimateModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <p style={{ color: 'var(--color-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                    No scans or treatments selected yet. Select items from the list to estimate your hospital bill.
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                      {selectedItems.map((item) => {
                        const itemId = item._id || item.idKey;
                        return (
                          <motion.div 
                            key={itemId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 8 }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-ink)' }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.category}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-primary)' }}>₹{item.cost.toLocaleString()}</span>
                              <button 
                                onClick={() => toggleSelectItem(item)} 
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 13 }}
                              >
                                ✕
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div style={{ background: 'var(--color-primary-soft)', padding: 14, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-dark)' }}>Estimated Hospital Total</div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Includes lab report & digital delivery</div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        ₹{totalEstimate.toLocaleString()}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEstimateModal(false)}
                    style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontWeight: 600, fontSize: 13 }}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
