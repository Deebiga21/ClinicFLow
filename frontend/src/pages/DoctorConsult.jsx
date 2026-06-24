import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import {
  Stethoscope, Plus, X, ChevronDown, ChevronUp, CheckCircle2,
  Clock, Users, UserCheck, ToggleLeft, ToggleRight, Edit2, Trash2,
  Building2, DoorOpen, AlertCircle, RefreshCw
} from 'lucide-react';

const DEPARTMENTS = ['General', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Gynecology', 'Psychiatry'];

function useDoctors(token) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true); setErr('');
    try {
      const r = await fetch(`${API_BASE}/doctors`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDoctors(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  return { doctors, setDoctors, loading, err, reload: load };
}

function useQueuePerDoctor(token, doctorId) {
  const [queue, setQueue] = useState(null);
  useEffect(() => {
    if (!doctorId) return;
    fetch(`${API_BASE}/queue?doctorId=${doctorId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setQueue).catch(() => {});
  }, [doctorId]);
  return queue;
}

function StatBadge({ icon: Icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <Icon size={14} style={{ color }} />
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

function DoctorCard({ doctor, token, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...doctor });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queue = useQueuePerDoctor(token, expanded ? doctor._id : null);

  async function saveEdit() {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/doctors/${doctor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d); setEditing(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function toggleAvail() {
    setToggling(true);
    try {
      const r = await fetch(`${API_BASE}/doctors/${doctor._id}/toggle-availability`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d);
    } catch (e) { alert(e.message); }
    finally { setToggling(false); }
  }

  async function deleteDoc() {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/doctors/${doctor._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      onDeleted(doctor._id);
    } catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  }

  const isAvail = doctor.isAvailable;

  return (
    <motion.div className="card" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: isAvail ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--color-surface-2)',
          display: 'grid', placeItems: 'center', color: isAvail ? 'white' : 'var(--color-muted)'
        }}>
          <Stethoscope size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Dr. {doctor.name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={12} /> {doctor.department}
            </span>
            {doctor.roomNumber && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <DoorOpen size={12} /> Room {doctor.roomNumber}
              </span>
            )}
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: isAvail ? 'var(--color-primary-soft)' : 'var(--color-surface-2)',
              color: isAvail ? 'var(--color-primary)' : 'var(--color-muted)'
            }}>
              {isAvail ? '● Available' : '○ Unavailable'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn--ghost" style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={toggleAvail} disabled={toggling} title="Toggle availability">
            {isAvail ? <ToggleRight size={18} style={{ color: 'var(--color-primary)' }} /> : <ToggleLeft size={18} />}
          </button>
          <button className="btn btn--ghost" style={{ padding: '6px 10px' }}
            onClick={() => { setEditing(true); setExpanded(true); }} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="btn btn--ghost" style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
            onClick={deleteDoc} disabled={deleting} title="Delete">
            <Trash2 size={14} />
          </button>
          <button className="btn btn--ghost" style={{ padding: '6px 10px' }}
            onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>

              {editing ? (
                <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="auth__label">Name</label>
                      <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="auth__label">Department</label>
                      <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="auth__label">Specialization</label>
                      <input className="input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} />
                    </div>
                    <div>
                      <label className="auth__label">Room Number</label>
                      <input className="input" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} />
                    </div>
                    <div>
                      <label className="auth__label">Avg Consult Time (min)</label>
                      <input className="input" type="number" min={1} value={form.avgConsultationTime}
                        onChange={e => setForm({...form, avgConsultationTime: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn btn--primary" onClick={saveEdit} disabled={saving}>
                      {saving ? 'Saving…' : <><CheckCircle2 size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Save changes</>}
                    </button>
                    <button className="btn btn--ghost" onClick={() => { setEditing(false); setForm({...doctor}); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {doctor.specialization && (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-soft)' }}>
                      Specialization: <strong>{doctor.specialization}</strong>
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <StatBadge icon={Clock} label="Avg consult" value={`${doctor.avgConsultationTime} min`} />
                    {queue && <>
                      <StatBadge icon={Users} label="Waiting" value={queue.totalWaiting} />
                      <StatBadge icon={UserCheck} label="Served today" value={queue.totalServedToday} />
                    </>}
                  </div>

                  {queue && queue.waitingQueue?.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>Queue</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {queue.currentToken && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                            background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>#{queue.currentToken.tokenNumber}</span>
                            <span style={{ fontSize: 13 }}>{queue.currentToken.patientName}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>IN CONSULT</span>
                          </div>
                        )}
                        {queue.waitingQueue.slice(0, 5).map((t, i) => (
                          <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                            borderRadius: 8, background: 'var(--color-surface-2)', fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-muted)', width: 16 }}>{i + 1}</span>
                            <span style={{ fontWeight: 700 }}>#{t.tokenNumber}</span>
                            <span>{t.patientName}</span>
                            <span style={{ marginLeft: 'auto', color: 'var(--color-muted)', fontSize: 12 }}>~{t.estimatedWaitMinutes}m</span>
                          </div>
                        ))}
                        {queue.totalWaiting > 5 && (
                          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: 4 }}>
                            +{queue.totalWaiting - 5} more waiting
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddDoctorModal({ token, onAdded, onClose }) {
  const [form, setForm] = useState({ name: '', department: 'General', specialization: '', roomNumber: '', avgConsultationTime: 10 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Doctor name is required.'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onAdded(d); onClose();
    } catch (e) { setErr(e.message); setSaving(false); }
  }

  return (
    <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'grid', placeItems: 'center', padding: 20 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }}
        initial={{ scale: .92, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 22 }}>Add Doctor</h2>
          <button className="btn btn--ghost" style={{ padding: '6px 10px' }} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="auth__label">Full Name *</label>
              <input className="input" placeholder="e.g. Sarah Johnson" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} autoFocus />
            </div>
            <div>
              <label className="auth__label">Department *</label>
              <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="auth__label">Specialization</label>
              <input className="input" placeholder="e.g. Cardiologist" value={form.specialization}
                onChange={e => setForm({...form, specialization: e.target.value})} />
            </div>
            <div>
              <label className="auth__label">Room Number</label>
              <input className="input" placeholder="e.g. 204" value={form.roomNumber}
                onChange={e => setForm({...form, roomNumber: e.target.value})} />
            </div>
            <div>
              <label className="auth__label">Avg Consult Time (min)</label>
              <input className="input" type="number" min={1} max={120} value={form.avgConsultationTime}
                onChange={e => setForm({...form, avgConsultationTime: Number(e.target.value)})} />
            </div>
          </div>
          {err && <div className="auth__error" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={14} />{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn--primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Adding…' : 'Add Doctor'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DoctorConsult() {
  const { token } = useAuth();
  const { doctors, setDoctors, loading, err, reload } = useDoctors(token);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('All');

  const departments = ['All', ...new Set(doctors.map(d => d.department))];
  const filtered = filter === 'All' ? doctors : doctors.filter(d => d.department === filter);
  const available = doctors.filter(d => d.isAvailable).length;

  function handleUpdated(updated) {
    setDoctors(prev => prev.map(d => d._id === updated._id ? updated : d));
  }
  function handleDeleted(id) {
    setDoctors(prev => prev.filter(d => d._id !== id));
  }

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stethoscope size={28} style={{ color: 'var(--color-primary)' }} /> Doctor Consultation
          </h1>
          <p className="page-header__sub">Manage doctors, departments, and per-doctor queues</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--ghost" onClick={reload} style={{ padding: '10px 14px' }}>
            <RefreshCw size={15} />
          </button>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} style={{ marginRight: 6, verticalAlign: -2 }} /> Add Doctor
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Doctors', value: doctors.length, icon: Stethoscope, color: 'var(--color-primary)' },
          { label: 'Available Now', value: available, icon: CheckCircle2, color: '#2ecc71' },
          { label: 'Unavailable', value: doctors.length - available, icon: AlertCircle, color: 'var(--color-muted)' },
          { label: 'Departments', value: new Set(doctors.map(d => d.department)).size, icon: Building2, color: 'var(--color-accent)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'grid', placeItems: 'center' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Department filter */}
      {departments.length > 2 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {departments.map(d => (
            <button key={d} type="button"
              className={`auth__role-btn ${filter === d ? 'is-active' : ''}`}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setFilter(d)}>{d}</button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 10 }}>Loading doctors…</p>
        </div>
      )}

      {err && (
        <div className="auth__error" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <AlertCircle size={15} /> {err} — make sure the backend is running.
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-muted)' }}>
          <Stethoscope size={36} style={{ opacity: .3, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No doctors found. Add one to get started.</p>
          <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Add First Doctor
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(doc => (
          <DoctorCard key={doc._id} doctor={doc} token={token}
            onUpdated={handleUpdated} onDeleted={handleDeleted} />
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddDoctorModal token={token}
            onAdded={d => setDoctors(prev => [d, ...prev])}
            onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}