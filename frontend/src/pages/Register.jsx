import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Stethoscope, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const initialRole = new URLSearchParams(loc.search).get('role') || 'patient';
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: initialRole });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await register(form);
      const r = data.user.role;
      nav(r === 'staff' || r === 'admin' ? '/desk' : '/waiting-room', { replace: true });
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  const roles = [
    { id: 'patient', label: 'Patient', Icon: User },
    { id: 'staff',   label: 'Staff',   Icon: Stethoscope },
    { id: 'admin',   label: 'Admin',   Icon: ShieldCheck },
  ];

  return (
    <div className="auth">
      <motion.div className="auth__card"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>

        <div className="brand-mark" style={{ marginBottom: 18 }}>
          <Logo size={36} /><span className="brand-mark__name">ClinicFlow</span>
        </div>
        <h1 className="auth__title">Create account</h1>
        <p className="auth__sub">Join ClinicFlow in seconds</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {roles.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              className={`auth__role-btn ${form.role === id ? 'is-active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 6px', fontSize: 12 }}
              onClick={() => setForm({ ...form, role: id })}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>

        {err && (
          <div className="auth__error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertCircle size={14} />{err}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="auth__field">
            <label className="auth__label">Display name</label>
            <input className="input" value={form.displayName}
              onChange={e => setForm({ ...form, displayName: e.target.value })} autoFocus />
          </div>
          <div className="auth__field">
            <label className="auth__label">Username</label>
            <input className="input" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input className="input" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <button className="btn btn--primary"
            style={{ width: '100%', padding: 14, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            disabled={loading}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Creating…</> : 'Create account'}
          </button>
        </form>

        <p className="auth__switch" style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to={`/login?role=${form.role}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
