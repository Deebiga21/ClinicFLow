import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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
      const r = data.user.role; nav(r === "staff" || r === "admin" ? "/desk" : "/waiting-room");
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  return (
    <div className="auth">
      <motion.div className="auth__card"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
        <div className="brand-mark" style={{ marginBottom: 18 }}>
          <Logo size={36} />
          <span className="brand-mark__name">ClinicFlow</span>
        </div>
        <h1 className="auth__title gradient-text">Create account</h1>
        <p className="auth__sub">Join ClinicFlow in seconds</p>

        <div className="auth__role">
          <button type="button" className={`auth__role-btn ${form.role === 'patient' ? 'is-active' : ''}`} onClick={() => setForm({ ...form, role: 'patient' })}>Patient</button>
          <button type="button" className={`auth__role-btn ${form.role === 'staff' ? 'is-active' : ''}`} onClick={() => setForm({ ...form, role: 'staff' })}>Nurse / Staff</button>
        </div>

        {err && <div className="auth__error">{err}</div>}

        <form onSubmit={submit}>
          <div className="auth__field">
            <label className="auth__label">Display name</label>
            <input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="auth__field">
            <label className="auth__label">Username</label>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="auth__field">
            <label className="auth__label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn--primary" style={{ width: '100%', padding: 14, marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="auth__switch">
          Already have an account? <Link to={`/login?role=${form.role}`}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
