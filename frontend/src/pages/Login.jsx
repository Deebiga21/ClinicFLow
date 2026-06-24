import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, User, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

function roleRedirect(role) {
  if (role === 'staff' || role === 'admin') return '/desk';
  return '/waiting-room';
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('patient');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!username.trim()) { setErr('Please enter your username.'); return; }
    if (!password) { setErr('Please enter your password.'); return; }
    setErr(''); setLoading(true);
    try {
      const data = await login(username.trim(), password);
      nav(roleRedirect(data.user.role), { replace: true });
    } catch (e) {
      setErr(e.message || 'Sign-in failed. Check your username and password.');
      setLoading(false);
    }
  }

  const roles = [
    { id: 'patient', label: 'Patient',      Icon: User },
    { id: 'staff',   label: 'Nurse / Staff', Icon: Stethoscope },
    { id: 'admin',   label: 'Admin',         Icon: ShieldCheck },
  ];

  return (
    <div className="auth">
      <motion.div className="auth__card"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>

        <div className="brand-mark" style={{ marginBottom: 20 }}>
          <Logo size={36} />
          <span className="brand-mark__name">ClinicFlow</span>
        </div>

        <h1 className="auth__title gradient-text">Welcome back</h1>
        <p className="auth__sub">Sign in to continue</p>

        {/* Role selector */}
        <div className="auth__role" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {roles.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              className={`auth__role-btn ${role === id ? 'is-active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', fontSize: 12 }}
              onClick={() => setRole(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {err && (
            <motion.div className="auth__error"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {err}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} noValidate>
          <div className="auth__field">
            <label className="auth__label">Username</label>
            <input className="input" autoComplete="username" autoFocus
              value={username} onChange={(e) => { setUsername(e.target.value); setErr(''); }} />
          </div>
          <div className="auth__field" style={{ position: 'relative' }}>
            <label className="auth__label">Password</label>
            <input className="input" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              style={{ paddingRight: 44 }}
              value={password} onChange={(e) => { setPassword(e.target.value); setErr(''); }} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: 38, background: 'none', border: 'none',
                       color: 'var(--color-muted)', padding: 4 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <motion.button className="btn btn--primary"
            style={{ width: '100%', padding: 14, marginTop: 10, fontSize: 15 }}
            disabled={loading}
            whileTap={{ scale: 0.97 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" /> Signing in…
                </span>
              : 'Sign in'}
          </motion.button>
        </form>

        <div className="auth__switch" style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          New here? <Link to={`/register?role=${role}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create an account</Link>
        </div>
      </motion.div>
    </div>
  );
}