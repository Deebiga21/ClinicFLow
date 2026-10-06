import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isSoundEnabled, setSoundEnabled, playChime } from '../utils/sound';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import {
  Sun, Moon, LogOut, User as UserIcon, Mail, Phone, Briefcase,
  Volume2, VolumeX, MessageSquareText, Save, KeyRound, CheckCircle2,
  Bell, BellOff, Sparkles, Monitor, Eye, Clock, Palette,
  Zap, Shield, Download, RefreshCw, AlertCircle, Loader2, Settings as SettingsIcon
} from 'lucide-react';

const PREFS_KEY = 'cqm.prefs';
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } }
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

function SectionTitle({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <Icon size={16} style={{ color: 'var(--color-primary)' }} />
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</span>
    </div>
  );
}

function ToggleRow({ icon, label, sub, checked, onChange }) {
  return (
    <button type="button" className="settings__toggle-row" onClick={() => onChange(!checked)}
      style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: checked ? 'var(--color-primary)' : 'var(--color-muted)' }}>{icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <div className={`switch ${checked ? 'is-on' : ''}`}><div className="switch__knob" /></div>
    </button>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const nav = useNavigate();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  const [profile, setProfile] = useState({
    displayName: user?.displayName || '', email: user?.email || '',
    phone: user?.phone || '', bio: user?.bio || '', department: user?.department || ''
  });
  const [savingP, setSavingP] = useState(false);
  const [savedP, setSavedP] = useState(false);
  const [profileErr, setProfileErr] = useState('');

  const [sound, setSound] = useState(isSoundEnabled());
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [savedPw, setSavedPw] = useState(false);

  const [ops, setOps] = useState({ defaultConsultationTime: 15, congestionThreshold: 10 });
  const [savingOps, setSavingOps] = useState(false);
  const [savedOps, setSavedOps] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch(`${API_BASE_URL}/api/admin/settings`)
        .then(res => res.json())
        .then(d => {
           if (d?.data) {
             setOps(d.data);
           }
        }).catch(e => console.error(e));
    }
  }, [user]);

  async function handleOpsSave(e) {
    e.preventDefault();
    setSavingOps(true); setSavedOps(false);
    try {
      await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ops)
      });
      setSavedOps(true); setTimeout(() => setSavedOps(false), 2500);
    } catch(e) {}
    finally { setSavingOps(false); }
  }



  const [prefs, setPrefs] = useState(() => ({
    notifyOnCall: true, notifyOnChat: true, aiAssistant: true,
    compactQueue: false, showEstimates: true, autoRefresh: true,
    timeFormat: '12h', animationsEnabled: true, highContrast: false,
    ...loadPrefs()
  }));

  function setPref(k, v) { const n = { ...prefs, [k]: v }; setPrefs(n); savePrefs(n); }

  function handleSoundToggle() {
    const next = !sound; setSound(next); setSoundEnabled(next);
    if (next) playChime();
  }

  async function handleProfileSave(e) {
    e.preventDefault(); setSavingP(true); setProfileErr(''); setSavedP(false);
    try { await updateProfile(profile); setSavedP(true); setTimeout(() => setSavedP(false), 2500); }
    catch (err) { setProfileErr(err.message); }
    finally { setSavingP(false); }
  }

  async function handlePwSave(e) {
    e.preventDefault(); setPwErr(''); setSavedPw(false);
    if (pw.next !== pw.confirm) { setPwErr('New passwords do not match.'); return; }
    if (pw.next.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try { await changePassword(pw.current, pw.next); setPw({ current: '', next: '', confirm: '' }); setSavedPw(true); setTimeout(() => setSavedPw(false), 2500); }
    catch (err) { setPwErr(err.message); }
    finally { setSavingPw(false); }
  }

  const SaveBtn = ({ saving, saved, label }) => (
    <button className="btn btn--primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
      {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />Saving…</>
        : saved ? <><CheckCircle2 size={15} />Saved!</>
        : <><Save size={15} />{label}</>}
    </button>
  );

  const card = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__sub">Personalise your ClinicFlow experience</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* Profile */}
        <motion.div className="card" {...card} transition={{ delay: 0 }}>
          <SectionTitle icon={UserIcon} title="Profile" />
          <form onSubmit={handleProfileSave}>
            <div className="settings__field">
              <label className="auth__label">Display name</label>
              <input className="input" value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} />
            </div>
            <div className="settings__field">
              <label className="auth__label"><Mail size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="settings__field">
              <label className="auth__label"><Phone size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Phone</label>
              <input className="input" type="tel" placeholder="+91 98765 43210" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            {isStaff && (
              <div className="settings__field">
                <label className="auth__label"><Briefcase size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Department</label>
                <input className="input" placeholder="e.g. Front Desk" value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} />
              </div>
            )}
            <div className="settings__field">
              <label className="auth__label"><MessageSquareText size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Bio</label>
              <textarea className="input" rows={2} maxLength={280} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
              <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'right', marginTop: 2 }}>{profile.bio.length}/280</div>
            </div>
            {profileErr && <div className="auth__error" style={{ marginBottom: 10, display: 'flex', gap: 8 }}><AlertCircle size={13} />{profileErr}</div>}
            <SaveBtn saving={savingP} saved={savedP} label="Save profile" />
          </form>
        </motion.div>

        {/* Appearance */}
        <motion.div className="card" {...card} transition={{ delay: .05 }}>
          <SectionTitle icon={Palette} title="Appearance" />
          <div style={{ marginBottom: 14 }}>
            <div className="auth__label" style={{ marginBottom: 8 }}>Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['light', Sun, 'Light'], ['dark', Moon, 'Dark']].map(([id, Icon, label]) => (
                <button key={id} type="button"
                  className={`auth__role-btn ${theme === id ? 'is-active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => setTheme(id)}><Icon size={16} />{label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="auth__label" style={{ marginBottom: 8 }}><Clock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Time format</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['12h', '24h'].map(f => (
                <button key={f} type="button" className={`auth__role-btn ${prefs.timeFormat === f ? 'is-active' : ''}`}
                  onClick={() => setPref('timeFormat', f)}>{f} hour</button>
              ))}
            </div>
          </div>
          <ToggleRow icon={<Zap size={18} />} label="Animations" sub="Smooth transitions throughout the app" checked={prefs.animationsEnabled} onChange={v => setPref('animationsEnabled', v)} />
          <ToggleRow icon={<Eye size={18} />} label="Show wait estimates" sub="Estimated minutes on each token" checked={prefs.showEstimates} onChange={v => setPref('showEstimates', v)} />
          <ToggleRow icon={<Monitor size={18} />} label="Compact queue" sub="Smaller rows, show more patients" checked={prefs.compactQueue} onChange={v => setPref('compactQueue', v)} />
          <ToggleRow icon={<Shield size={18} />} label="High contrast" sub="Stronger borders and bolder text" checked={prefs.highContrast} onChange={v => setPref('highContrast', v)} />
        </motion.div>

        {/* Notifications & Sound */}
        <motion.div className="card" {...card} transition={{ delay: .08 }}>
          <SectionTitle icon={Bell} title="Notifications & Sound" />
          <ToggleRow icon={sound ? <Volume2 size={18} /> : <VolumeX size={18} />} label={sound ? 'Sound on' : 'Sound muted'} sub="Chime when your number is called" checked={sound} onChange={handleSoundToggle} />
          <ToggleRow icon={<Bell size={18} />} label="Call alerts" sub="Notify when your token is called" checked={prefs.notifyOnCall} onChange={v => setPref('notifyOnCall', v)} />
          <ToggleRow icon={prefs.notifyOnChat ? <MessageSquareText size={18} /> : <BellOff size={18} />} label="Chat notifications" sub="Alert when staff send a message" checked={prefs.notifyOnChat} onChange={v => setPref('notifyOnChat', v)} />
          <ToggleRow icon={<RefreshCw size={18} />} label="Auto-refresh" sub="Queue updates live via WebSocket" checked={prefs.autoRefresh} onChange={v => setPref('autoRefresh', v)} />
          {sound && (
            <button className="btn btn--ghost" style={{ width: '100%', marginTop: 10, fontSize: 13 }} onClick={() => playChime()}>
              <Volume2 size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Test sound
            </button>
          )}
        </motion.div>

        {/* AI Assistant */}
        <motion.div className="card" {...card} transition={{ delay: .1 }}>
          <SectionTitle icon={Sparkles} title="AI Assistant" />
          <ToggleRow icon={<Sparkles size={18} />} label="Enable Claude AI" sub="Real-time smart answers with live queue context" checked={prefs.aiAssistant} onChange={v => setPref('aiAssistant', v)} />
          <div style={{ marginTop: 12, padding: 14, borderRadius: 10,
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.6 }}>
            {prefs.aiAssistant
              ? <><Sparkles size={13} style={{ verticalAlign: -2, marginRight: 4, color: 'var(--color-primary)' }} />Claude AI is <strong style={{ color: 'var(--color-primary)' }}>active</strong>. The assistant knows who's being served, your token, and estimated wait time right now.</>
              : <><BellOff size={13} style={{ verticalAlign: -2, marginRight: 4 }} />AI is <strong>disabled</strong>. Falls back to offline FAQ mode.</>}
          </div>
        </motion.div>

        {/* Account */}
        <motion.div className="card" {...card} transition={{ delay: .12 }}>
          <SectionTitle icon={Shield} title="Account" />
          <div className="settings__info-grid" style={{ marginBottom: 18 }}>
            {[
              ['Username', user?.username],
              ['Role', <span style={{ textTransform: 'capitalize', padding: '2px 10px', borderRadius: 999, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>{user?.role}</span>],
              ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'],
              ...(user?.role === 'patient' ? [['Linked token', user?.linkedTokenNumber ? `#${user.linkedTokenNumber}` : 'None']] : []),
            ].map(([label, val]) => (
              <div key={label}><span className="settings__info-label">{label}</span><span>{val}</span></div>
            ))}
          </div>

          <form onSubmit={handlePwSave}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <KeyRound size={15} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Change password</span>
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="Current password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required />
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="New password (min 6 chars)" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required minLength={6} />
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="Confirm new password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} required />
            </div>
            {pwErr && <div className="auth__error" style={{ marginBottom: 10, display: 'flex', gap: 8 }}><AlertCircle size={13} />{pwErr}</div>}
            <SaveBtn saving={savingPw} saved={savedPw} label="Update password" />
          </form>

          <button className="btn btn--ghost"
            style={{ width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-danger)' }}
            onClick={() => { logout(); nav('/login'); }}>
            <LogOut size={14} />Sign out
          </button>
        </motion.div>

        
        {/* Clinic Operations (Admin Only) */}
        {user?.role === 'admin' && (
          <motion.div className="card" {...card} transition={{ delay: .13 }}>
            <SectionTitle icon={SettingsIcon} title="Clinic Operations (Global)" />
            <form onSubmit={handleOpsSave}>
              <div className="settings__field">
                <label className="auth__label">Default Consultation Time (mins)</label>
                <input className="input" type="number" min="1" value={ops.defaultConsultationTime || 15} onChange={e => setOps({ ...ops, defaultConsultationTime: parseInt(e.target.value) })} />
              </div>
              <div className="settings__field">
                <label className="auth__label">Congestion Threshold (waiting patients)</label>
                <input className="input" type="number" min="1" value={ops.congestionThreshold || 10} onChange={e => setOps({ ...ops, congestionThreshold: parseInt(e.target.value) })} />
              </div>
              <SaveBtn saving={savingOps} saved={savedOps} label="Save Global Settings" />
            </form>
          </motion.div>
        )}

        {/* Data & Privacy */}
        <motion.div className="card" {...card} transition={{ delay: .14 }}>
          <SectionTitle icon={Download} title="Data & Privacy" />
          <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', lineHeight: 1.7, marginBottom: 14 }}>
            Preferences are saved locally on this device. Visit history is on the clinic server and only visible to authorised staff.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn--ghost" style={{ fontSize: 13 }}
              onClick={() => { localStorage.removeItem(PREFS_KEY); window.location.reload(); }}>
              <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Reset all preferences
            </button>
            <button className="btn btn--ghost" style={{ fontSize: 13 }}
              onClick={() => {
                const blob = new Blob([JSON.stringify({ user: { username: user?.username, role: user?.role }, prefs }, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clinicflow-settings.json'; a.click();
              }}>
              <Download size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Export my settings
            </button>
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
