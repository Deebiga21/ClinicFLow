import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, User, ArrowRight, MessageSquare, Bell, Clock, ClipboardCheck, Sparkles } from 'lucide-react';
import HeroIllustration from '../components/HeroIllustration';
import Logo from '../components/Logo';

const features = [
  { icon: MessageSquare, title: 'Staff-to-Patient Chat', desc: 'Real-time micro-chat per token.' },
  { icon: Sparkles, title: 'AI Assistant', desc: 'Instant answers about waits & tokens.' },
  { icon: Bell, title: 'Auto Notifications', desc: 'Patients get called the moment they\'re up.' },
  { icon: Clock, title: 'Dynamic Wait Times', desc: 'Live estimates from real queue data.' },
  { icon: ClipboardCheck, title: 'Instant Check-Out', desc: 'One tap closes the visit.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, var(--color-bg), var(--color-primary-soft))', padding: '0 24px 60px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="brand-mark" style={{ padding: '28px 0' }}>
          <Logo size={32} />
          <span className="brand-mark__name">ClinicFlow</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center' }} className="landing-hero">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <span style={{ fontSize: 13, color: 'var(--color-primary-dark)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>ClinicFlow</span>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.05, margin: '12px 0 18px', letterSpacing: '-.03em' }}>
              One queue.<br />
              <span className="gradient-text">Two screens. Zero paper.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--color-ink-soft)', maxWidth: 620 }}>
              A live digital queue manager for neighborhood clinics — controlled by reception,
              visible to every patient, updating in real time.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, delay: .1 }}
            className="landing-hero__art">
            <HeroIllustration />
          </motion.div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 40 }}>
          {[
            { to: '/login?role=staff', icon: Stethoscope, label: 'Staff', title: 'Receptionist sign-in', desc: 'Manage tokens, call patients, chat live.' },
            { to: '/login?role=patient', icon: User, label: 'Patient', title: 'Patient sign-in', desc: 'See your token, wait time, and check out.' },
          ].map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 + i * .1, duration: .4 }}>
              <Link to={c.to} className="card" style={{ display: 'block', textDecoration: 'none' }}>
                <c.icon size={24} style={{ color: 'var(--color-primary)' }} />
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--color-muted)', marginTop: 14 }}>{c.label}</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, margin: '6px 0' }}>{c.title}</div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>{c.desc}</div>
                <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>
                  Continue <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, margin: 0, fontWeight: 600 }}>Built for the judging round.</h2>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: 4 }}>Everything live, everything real.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 20 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + i * .08 }}>
                <f.icon size={20} style={{ color: 'var(--color-accent)' }} />
                <div style={{ fontWeight: 600, marginTop: 10 }}>{f.title}</div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 13, marginTop: 4 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
