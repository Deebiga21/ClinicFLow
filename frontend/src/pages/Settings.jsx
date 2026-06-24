import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { isSoundEnabled, setSoundEnabled, playChime } from '../utils/sound';
import {
  Sun, Moon, LogOut, User as UserIcon, Mail, Phone, Briefcase,
  Volume2, VolumeX, MessageSquareText, Save, KeyRound, CheckCircle2,
  Bell, BellOff, Sparkles, Monitor, Eye, EyeOff, Clock, Languages
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PREFS_KEY = 'cqm.prefs';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const nav = useNavigate();

  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    department: user?.department || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileErr, setProfileErr] = useState('');

  const [sound, setSound] = useState(isSoundEnabled());

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Extended preferences (stored in localStorage)
  const [prefs, setPrefs] = useState(() => ({
    notifyOnCall: true,
    notifyOnChat: true,
    aiAssistant: true,
    compactQueue: false,
    showEstimates: true,
    timeFormat: '12h',
    language: 'en',
    ...loadPrefs()
  }));

  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  function setPref(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    savePrefs(next);
  }

  function handleSoundToggle() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playChime();
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true); setProfileErr(''); setProfileSaved(false);
    try {
      await updateProfile(profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) { setProfileErr(err.message); }
    finally { setSavingProfile(false); }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwErr(''); setPwSaved(false);
    if (pwForm.next !== pwForm.confirm) { setPwErr('New passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) { setPwErr(err.message); }
    finally { setPwSaving(false); }
  }

  const ToggleRow = ({ icon, label, sub, checked, onChange }) => (
    <button type="button" className="settings__toggle-row" onClick={() => onChange(!checked)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: checked ? 'var(--color-primary)' : 'var(--color-muted)' }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{sub}</div>}
        </div>
      </div>
      <div className={`switch ${checked ? 'is-on' : ''}`}><div className="switch__knob" /></div>
    </button>
  );

  return (
    <AppShell>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__sub">Personalize your ClinicFlow experience</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

        {/* Profile */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserIcon size={18} /> Profile
          </div>
          <form onSubmit={handleProfileSave}>
            <div className="settings__field">
              <label className="auth__label">Display name</label>
              <input className="input" value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
            </div>
            <div className="settings__field">
              <label className="auth__label"><Mail size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="settings__field">
              <label className="auth__label"><Phone size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Phone</label>
              <input className="input" type="tel" placeholder="+91 98765 43210" value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            {isStaff && (
              <div className="settings__field">
                <label className="auth__label"><Briefcase size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Department / title</label>
                <input className="input" placeholder="e.g. Front Desk, Triage Nurse" value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
              </div>
            )}
            <div className="settings__field">
              <label className="auth__label"><MessageSquareText size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Short bio</label>
              <textarea className="input" rows={3} maxLength={280} placeholder="A line about yourself…"
                value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            {profileErr && <div className="auth__error" style={{ marginBottom: 10 }}>{profileErr}</div>}
            <button className="btn btn--primary" style={{ width: '100%' }} disabled={savingProfile}>
              {profileSaved ? <><CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Saved</>
                : <><Save size={16} style={{ marginRight: 6, verticalAlign: -3 }} />{savingProfile ? 'Saving…' : 'Save profile'}</>}
            </button>
          </form>
        </motion.div>

        {/* Appearance & Sound */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
          <div className="card__title"><Monitor size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Appearance</div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 8 }}>Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button type="button" className={`auth__role-btn ${theme === 'light' ? 'is-active' : ''}`} onClick={() => setTheme('light')}>
                <Sun size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Light
              </button>
              <button type="button" className={`auth__role-btn ${theme === 'dark' ? 'is-active' : ''}`} onClick={() => setTheme('dark')}>
                <Moon size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Dark
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 8 }}>Time format</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['12h','24h'].map(f => (
                <button key={f} type="button" className={`auth__role-btn ${prefs.timeFormat === f ? 'is-active' : ''}`}
                  onClick={() => setPref('timeFormat', f)}>
                  <Clock size={14} style={{ marginRight: 5, verticalAlign: -2 }} />{f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ToggleRow
              icon={sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              label={sound ? 'Sound on' : 'Sound off'}
              sub="Plays a chime for calls and new chat messages"
              checked={sound}
              onChange={handleSoundToggle}
            />
            <ToggleRow
              icon={<Eye size={18} />}
              label="Show wait estimates"
              sub="Display estimated minutes on the queue"
              checked={prefs.showEstimates}
              onChange={(v) => setPref('showEstimates', v)}
            />
            <ToggleRow
              icon={<Monitor size={18} />}
              label="Compact queue view"
              sub="Smaller rows — fit more patients on screen"
              checked={prefs.compactQueue}
              onChange={(v) => setPref('compactQueue', v)}
            />
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
          <div className="card__title"><Bell size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ToggleRow
              icon={<Bell size={18} />}
              label="Token call alerts"
              sub="Get notified when your number is called"
              checked={prefs.notifyOnCall}
              onChange={(v) => setPref('notifyOnCall', v)}
            />
            <ToggleRow
              icon={prefs.notifyOnChat ? <MessageSquareText size={18} /> : <BellOff size={18} />}
              label="Chat message alerts"
              sub="Notify when staff send you a message"
              checked={prefs.notifyOnChat}
              onChange={(v) => setPref('notifyOnChat', v)}
            />
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <div className="card__title"><Sparkles size={16} style={{ marginRight: 6, verticalAlign: -3 }} />AI Assistant</div>
            <ToggleRow
              icon={<Sparkles size={18} />}
              label="Enable AI Assistant"
              sub="Uses Claude AI for real-time smart answers"
              checked={prefs.aiAssistant}
              onChange={(v) => setPref('aiAssistant', v)}
            />
            {!prefs.aiAssistant && (
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>
                Assistant will fall back to offline FAQ mode.
              </p>
            )}
          </div>
        </motion.div>

        {/* Account + Password */}
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
          <div className="card__title">Account</div>
          <div className="settings__info-grid">
            <div><span className="settings__info-label">Username</span><span>{user?.username}</span></div>
            <div><span className="settings__info-label">Role</span><span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
            <div><span className="settings__info-label">Member since</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
            {user?.role === 'patient' && (
              <div><span className="settings__info-label">Linked token</span><span>{user?.linkedTokenNumber ? `#${user.linkedTokenNumber}` : 'None'}</span></div>
            )}
          </div>

          <form onSubmit={handlePasswordSave} style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--color-border)' }}>
            <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <KeyRound size={16} /> Change password
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="Current password"
                value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required />
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="New password (min. 6 characters)"
                value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} required minLength={6} />
            </div>
            <div className="settings__field">
              <input className="input" type="password" placeholder="Confirm new password"
                value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required minLength={6} />
            </div>
            {pwErr && <div className="auth__error" style={{ marginBottom: 10 }}>{pwErr}</div>}
            <button className="btn btn--ghost" style={{ width: '100%' }} disabled={pwSaving}>
              {pwSaved ? 'Password updated ✓' : (pwSaving ? 'Updating…' : 'Update password')}
            </button>
          </form>

          <button className="btn btn--ghost" style={{ width: '100%', marginTop: 14 }} onClick={() => { logout(); nav('/login'); }}>
            <LogOut size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Sign out
          </button>
        </motion.div>

      </div>
    </AppShell>
  );
}
