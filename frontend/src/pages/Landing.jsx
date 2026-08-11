import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, User, ArrowRight, MessageSquare, Bell, Clock, ClipboardCheck, HelpCircle } from 'lucide-react';
import HeroIllustration from '../components/HeroIllustration';
import Logo from '../components/Logo';
import AcidSquares from '../components/AcidSquares';

const features = [
  { icon: MessageSquare, title: 'Staff-to-Patient Chat', desc: 'Real-time messaging per token.' },
  { icon: HelpCircle, title: 'Clinic Assistant', desc: 'Instant answers regarding waits & tokens.' },
  { icon: Bell, title: 'Auto Notifications', desc: 'Patients get notified the moment they are called.' },
  { icon: Clock, title: 'Dynamic Wait Times', desc: 'Live estimates from active queue data.' },
  { icon: ClipboardCheck, title: 'Instant Check-Out', desc: 'One tap completes the consultation visit.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Animation */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <AcidSquares
          color1="#5227FF"
          color2="#A855F7"
          color3="#FFFFFF"
          detail="medium"
          speed={0.7}
          waveDepth={1}
          zoom={1.3}
          density={10.0}
          glow={1.0}
          exposure={2700}
          spread={0.3}
          stepSize={0.002}
          colorShift={0}
          contrast={1}
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          mouseStrength={0.1}
          mouseRadius={0.35}
          blur={0}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 60px', background: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="brand-mark" style={{ padding: '24px 0' }}>
          <Logo size={32} />
          <span className="brand-mark__name">ClinicFlow</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'center' }} className="landing-hero">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
            <span style={{ fontSize: 13, color: 'var(--color-primary-dark)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>Clinic Operations</span>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.1, margin: '12px 0 18px', letterSpacing: '-.02em', fontWeight: 700, color: 'var(--color-ink)' }}>
              Streamlined queue management.<br />
              <span style={{ color: 'var(--color-primary)' }}>Real-time clinic flow.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--color-ink-soft)', maxWidth: 620, lineHeight: 1.6 }}>
              A live digital queue management platform for medical clinics — controlled by front desk staff and doctors, transparent for every patient.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .4, delay: .1 }}
            className="landing-hero__art">
            <HeroIllustration />
          </motion.div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 40 }}>
          {[
            { to: '/login?role=staff', icon: Stethoscope, label: 'Staff Console', title: 'Clinical & Staff Portal', desc: 'Manage tokens, call patients, record consultation notes.' },
            { to: '/login?role=patient', icon: User, label: 'Patient Portal', title: 'Patient Waiting Room', desc: 'View live position, estimated wait, and chat with staff.' },
          ].map((c, i) => (
            <motion.div key={c.to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 + i * .1, duration: .3 }}>
              <Link to={c.to} className="card" style={{ display: 'block', textDecoration: 'none' }}>
                <c.icon size={24} style={{ color: 'var(--color-primary)' }} />
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-muted)', marginTop: 14, fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 600, margin: '6px 0', color: 'var(--color-ink)' }}>{c.title}</div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>{c.desc}</div>
                <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>
                  Sign In <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--color-ink)' }}>Core Clinic Management Capabilities</h2>
          <p style={{ color: 'var(--color-ink-soft)', marginTop: 4, fontSize: 14 }}>Designed for fast-paced outpatient centers.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 20 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 + i * .06 }}>
                <f.icon size={20} style={{ color: 'var(--color-primary)' }} />
                <div style={{ fontWeight: 600, marginTop: 10, color: 'var(--color-ink)' }}>{f.title}</div>
                <div style={{ color: 'var(--color-ink-soft)', fontSize: 13, marginTop: 4 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
