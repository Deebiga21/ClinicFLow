import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import {
  Stethoscope, Plus, X, ChevronDown, ChevronUp, CheckCircle2,
  Clock, Users, UserCheck, ToggleLeft, ToggleRight, Edit2, Trash2,
  Building2, DoorOpen, AlertCircle, RefreshCw, Search, Loader2
} from 'lucide-react';

const DEPTS = ['General','Cardiology','Neurology','Pediatrics','Orthopedics','Dermatology','ENT','Ophthalmology','Gynecology','Psychiatry','Emergency'];

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

function useDoctorQueue(token, doctorId, enabled) {
  const [queue, setQueue] = useState(null);
  useEffect(() => {
    if (!doctorId || !enabled) return;
    let cancelled = false;
    fetch(`${API_BASE}/queue?doctorId=${doctorId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (!cancelled) setQueue(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [doctorId, enabled]);
  return queue;
}

function StatPill({ icon: Icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
      borderRadius: 999, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 12 }}>
      <Icon size={12} style={{ color }} /><span style={{ color: 'var(--color-muted)' }}>{label}</span><strong style={{ color }}>{value}</strong>
    </div>
  );
}

function AddModal({ token, onAdded, onClose }) {
  const [form, setForm] = useState({ name: '', department: 'General', specialization: '', roomNumber: '', avgConsultationTime: 10 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Doctor name is required.'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch(`${API_BASE}/doctors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onAdded(d); onClose();
    } catch (e) { setErr(e.message); setSaving(false); }
  }

  return (
    <motion.div onClick={e => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 100,
        display: 'grid', placeItems: 'center', padding: 20 }}>
      <motion.div className="card" initial={{ scale: .95, y: 10 }} animate={{ scale: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 500, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: 'var(--color-ink)' }}>Add New Doctor</h2>
          <button className="btn btn--ghost" style={{ padding: '6px 10px' }} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="auth__label">Full Name *</label>
              <input className="input" placeholder="e.g. Priya Sharma" value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus />
            </div>
            <div>
              <label className="auth__label">Department *</label>
              <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="auth__label">Specialization</label>
              <input className="input" placeholder="e.g. Cardiologist" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} />
            </div>
            <div>
              <label className="auth__label">Room / Cabin</label>
              <input className="input" placeholder="e.g. 204" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} />
            </div>
            <div>
              <label className="auth__label">Avg Consult (min)</label>
              <input className="input" type="number" min={1} max={120} value={form.avgConsultationTime} onChange={e => setForm({...form, avgConsultationTime: Number(e.target.value)})} />
            </div>
          </div>
          {err && <div className="auth__error" style={{ display: 'flex', gap: 8 }}><AlertCircle size={13} />{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn--primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Adding…</> : 'Add Doctor'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DoctorCard({ doctor, token, onUpdated, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...doctor });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const queue = useDoctorQueue(token, doctor._id, open);

  async function saveEdit() {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/doctors/${doctor._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUpdated(d); setEditing(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function toggle() {
    setToggling(true);
    try {
      const r = await fetch(`${API_BASE}/doctors/${doctor._id}/toggle-availability`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json(); if (!r.ok) throw new Error(d.error); onUpdated(d);
    } catch (e) { alert(e.message); }
    finally { setToggling(false); }
  }

  async function del() {
    if (!window.confirm(`Remove Dr. ${doctor.name}?`)) return;
    try { await fetch(`${API_BASE}/doctors/${doctor._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); onDeleted(doctor._id); }
    catch (e) { alert(e.message); }
  }

  const avail = doctor.isAvailable;

  return (
    <motion.div className="card" layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center',
          background: avail ? 'var(--color-primary)' : 'var(--color-surface-2)',
          color: avail ? 'white' : 'var(--color-muted)' }}>
          <Stethoscope size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Dr. {doctor.name}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{doctor.department}</span>
            {doctor.roomNumber && <span style={{ fontSize: 13, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><DoorOpen size={12} />Room {doctor.roomNumber}</span>}
            <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: avail ? 'var(--color-primary-soft)' : 'var(--color-surface-2)',
              color: avail ? 'var(--color-primary)' : 'var(--color-muted)' }}>
              {avail ? '● Available' : '○ Unavailable'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn--ghost" style={{ padding: '7px 10px' }} onClick={toggle} disabled={toggling}>
            {avail ? <ToggleRight size={18} style={{ color: 'var(--color-primary)' }} /> : <ToggleLeft size={18} />}
          </button>
          <button className="btn btn--ghost" style={{ padding: '7px 10px' }} onClick={() => { setEditing(true); setOpen(true); }}><Edit2 size={14} /></button>
          <button className="btn btn--ghost" style={{ padding: '7px 10px', color: 'var(--color-danger)' }} onClick={del}><Trash2 size={14} /></button>
          <button className="btn btn--ghost" style={{ padding: '7px 10px' }} onClick={() => setOpen(v => !v)}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '4px 20px 20px', borderTop: '1px solid var(--color-border)' }}>
              {editing ? (
                <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label className="auth__label">Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className="auth__label">Department</label>
                      <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
                    <div><label className="auth__label">Specialization</label><input className="input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} /></div>
                    <div><label className="auth__label">Room</label><input className="input" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} /></div>
                    <div><label className="auth__label">Avg Consult (min)</label><input className="input" type="number" min={1} value={form.avgConsultationTime} onChange={e => setForm({...form, avgConsultationTime: Number(e.target.value)})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--primary" onClick={saveEdit} disabled={saving}>
                      {saving ? 'Saving…' : <><CheckCircle2 size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Save</>}
                    </button>
                    <button className="btn btn--ghost" onClick={() => { setEditing(false); setForm({ ...doctor }); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: 14 }}>
                  {doctor.specialization && <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-ink-soft)' }}>Specialization: <strong>{doctor.specialization}</strong></p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <StatPill icon={Clock} label="Avg" value={`${doctor.avgConsultationTime}m`} />
                    {queue && <><StatPill icon={Users} label="Waiting" value={queue.totalWaiting} color="var(--color-accent)" /><StatPill icon={UserCheck} label="Served" value={queue.totalServedToday} color="#2ecc71" /></>}
                  </div>
                  {queue && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Live Queue</div>
                      {!queue.currentToken && queue.totalWaiting === 0 && <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>No patients right now.</div>}
                      {queue.currentToken && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                          background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary)', marginBottom: 6, fontSize: 13 }}>
                          <strong style={{ color: 'var(--color-primary)' }}>#{queue.currentToken.tokenNumber}</strong>
                          <span>{queue.currentToken.patientName}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>IN CONSULT</span>
                        </div>
                      )}
                      {(queue.waitingQueue || []).slice(0, 5).map((t, i) => (
                        <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                          borderRadius: 8, background: 'var(--color-surface-2)', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: 'var(--color-muted)', width: 16 }}>{i + 1}</span>
                          <strong>#{t.tokenNumber}</strong>
                          <span style={{ flex: 1 }}>{t.patientName}</span>
                          <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>~{t.estimatedWaitMinutes}m</span>
                        </div>
                      ))}
                      {queue.totalWaiting > 5 && <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: 4 }}>+{queue.totalWaiting - 5} more</div>}
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

export default function DoctorConsult() {
  const { token } = useAuth();
  const { doctors, setDoctors, loading, err, reload } = useDoctors(token);
  const [showAdd, setShowAdd] = useState(false);
  const [dept, setDept] = useState('All');
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('all');

  const deptList = ['All', ...new Set(doctors.map(d => d.department))].filter(Boolean);
  const filtered = doctors.filter(d => {
    if (dept !== 'All' && d.department !== dept) return false;
    if (availFilter === 'available' && !d.isAvailable) return false;
    if (availFilter === 'unavailable' && d.isAvailable) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.specialization?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avCount = doctors.filter(d => d.isAvailable).length;

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stethoscope size={26} style={{ color: 'var(--color-primary)' }} />Doctor Consultation
          </h1>
          <p className="page-header__sub">Manage doctors, departments, and per-doctor queues</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost" title="Refresh List" onClick={reload} style={{ padding: '10px 14px' }}><RefreshCw size={15} /></button>
          <button className="btn btn--ghost" title="Seed 11 Sample Doctors" onClick={async () => {
            try {
              const r = await fetch(`${API_BASE}/doctors/seed`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              reload();
            } catch (e) { alert(e.message); }
          }} style={{ padding: '10px 14px', fontSize: 13 }}>
            🌱 Seed Doctors
          </button>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}><Plus size={15} style={{ marginRight: 6, verticalAlign: -2 }} />Add Doctor</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: doctors.length, icon: Stethoscope, color: 'var(--color-primary)' },
          { label: 'Available', value: avCount, icon: CheckCircle2, color: '#2ecc71' },
          { label: 'Unavailable', value: doctors.length - avCount, icon: AlertCircle, color: 'var(--color-muted)' },
          { label: 'Departments', value: new Set(doctors.map(d => d.department)).size, icon: Building2, color: 'var(--color-accent)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'grid', placeItems: 'center' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div><div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div><div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</div></div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
          <input className="input" placeholder="Search name or specialization…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        {['all', 'available', 'unavailable'].map(v => (
          <button key={v} type="button" className={`auth__role-btn ${availFilter === v ? 'is-active' : ''}`}
            style={{ padding: '8px 14px', fontSize: 12, textTransform: 'capitalize' }}
            onClick={() => setAvailFilter(v)}>{v}</button>
        ))}
      </div>

      {deptList.length > 2 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {deptList.map(d => (
            <button key={d} type="button" className={`auth__role-btn ${dept === d ? 'is-active' : ''}`}
              style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setDept(d)}>{d}</button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} /><p style={{ margin: 0 }}>Loading doctors…</p>
        </div>
      )}
      {err && <div className="auth__error" style={{ display: 'flex', gap: 8, marginBottom: 14 }}><AlertCircle size={14} />{err} — is the backend running?</div>}
      {!loading && !err && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 52, color: 'var(--color-muted)' }}>
          <Stethoscope size={40} style={{ opacity: .25, marginBottom: 14 }} />
          <p style={{ margin: '0 0 16px' }}>{search ? `No doctors matching "${search}"` : 'No doctors yet.'}</p>
          {!search && <button className="btn btn--primary" onClick={() => setShowAdd(true)}><Plus size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Add First Doctor</button>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(doc => (
          <DoctorCard key={doc._id} doctor={doc} token={token}
            onUpdated={d => setDoctors(prev => prev.map(x => x._id === d._id ? d : x))}
            onDeleted={id => setDoctors(prev => prev.filter(x => x._id !== id))} />
        ))}
      </div>

      <AnimatePresence>
        {showAdd && <AddModal token={token} onAdded={d => setDoctors(prev => [d, ...prev])} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
