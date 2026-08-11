import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import {
  CalendarDays, Clock, CheckCircle2,
  Stethoscope, Activity, CreditCard, ChevronRight, Check
} from 'lucide-react';

export default function PatientPortal() {
  const { token, user } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking state
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    doctorId: ''
  });
  const [bookingStatus, setBookingStatus] = useState(null);

  const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, dRes] = await Promise.all([
          fetch(`${API_BASE}/treatments`, { headers: authHeader }),
          fetch(`${API_BASE}/doctors`, { headers: authHeader })
        ]);
        if (tRes.ok) setTreatments(await tRes.json());
        if (dRes.ok) {
          const docs = await dRes.json();
          setDoctors(docs);
          if (docs.length > 0) setBookingForm(f => ({ ...f, doctorId: docs[0]._id }));
        }
      } catch (err) {
        console.error('Portal data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleBook() {
    setBookingStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          patientName: user?.displayName || user?.username || 'Guest Patient',
          patientEmail: user?.email || '',
          doctorId: bookingForm.doctorId,
          scheduledDate: bookingForm.date,
          scheduledTime: bookingForm.time,
          reason: `Booked Treatment: ${selectedTreatment.name}`
        })
      });
      if (!res.ok) throw new Error('Booking failed');
      setBookingStatus('success');
    } catch (err) {
      setBookingStatus('error');
    }
  }

  return (
    <AppShell>
      <header className="page-header" style={{ marginBottom: 40 }}>
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={28} style={{ color: 'var(--color-primary)' }} />
            Patient Portal
          </h1>
          <p className="page-header__sub">Browse and book your treatments, scans, and doctor consultations online.</p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>Loading portal...</div>
      ) : (
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          
          {/* Left Column: Treatments List */}
          <div style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: 20, marginBottom: 20, color: 'var(--color-ink)' }}>Available Treatments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {treatments.map((t, i) => (
                <motion.div key={t._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card"
                  style={{
                    padding: 20, cursor: 'pointer',
                    borderColor: selectedTreatment?._id === t._id ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: selectedTreatment?._id === t._id ? '0 0 0 2px var(--color-primary)' : 'var(--shadow-sm)'
                  }}
                  onClick={() => { setSelectedTreatment(t); setBookingStep(2); setBookingStatus(null); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)' }}>{t.category}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>{t.currency}{t.cost}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginTop: 8, minHeight: 40 }}>{t.description}</div>
                  
                  <button className="btn btn--ghost" style={{ width: '100%', marginTop: 16, border: '1px solid var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                    Select Treatment
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Booking Widget */}
          <div style={{ flex: '0 0 380px' }}>
            <div style={{ position: 'sticky', top: 20 }}>
              <AnimatePresence mode="wait">
                {!selectedTreatment ? (
                  <motion.div key="empty" className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
                    <Stethoscope size={40} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                    <p style={{ margin: 0 }}>Select a treatment on the left to start booking.</p>
                  </motion.div>
                ) : (
                  <motion.div key="booking" className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="card__title">Book Appointment</div>
                    
                    {bookingStatus === 'success' ? (
                      <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-bg)', color: '#10b981', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                          <Check size={32} />
                        </div>
                        <h3 style={{ margin: '0 0 10px' }}>Booking Confirmed!</h3>
                        <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>Your appointment for <strong>{selectedTreatment.name}</strong> has been scheduled.</p>
                        <button className="btn btn--primary" style={{ marginTop: 20, width: '100%' }} onClick={() => { setSelectedTreatment(null); setBookingStatus(null); }}>
                          Book Another
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: 16, background: 'var(--color-surface-2)', borderRadius: 12, marginBottom: 20 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedTreatment.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>Time required: ~{selectedTreatment.turnaround}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginTop: 8 }}>{selectedTreatment.currency}{selectedTreatment.cost}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label className="auth__label">Select Doctor</label>
                            <select className="input" value={bookingForm.doctorId} onChange={e => setBookingForm({...bookingForm, doctorId: e.target.value})}>
                              {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} ({d.department})</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label className="auth__label"><CalendarDays size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Date</label>
                              <input type="date" className="input" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                            </div>
                            <div>
                              <label className="auth__label"><Clock size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Time</label>
                              <input type="time" className="input" value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} />
                            </div>
                          </div>
                        </div>

                        <button 
                          className="btn btn--primary" 
                          style={{ width: '100%', marginTop: 24, padding: 14, fontSize: 16 }}
                          onClick={handleBook}
                          disabled={bookingStatus === 'submitting'}
                        >
                          <CreditCard size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                          {bookingStatus === 'submitting' ? 'Confirming...' : 'Confirm Booking'}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
