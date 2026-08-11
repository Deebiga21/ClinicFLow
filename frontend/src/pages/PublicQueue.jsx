import { useEffect, useState } from 'react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Clock, Activity, Users } from 'lucide-react';
import Logo from '../components/Logo';

export default function PublicQueue() {
  const { queueState } = useQueueSocket();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = queueState?.currentToken;
  const waiting = queueState?.waitingQueue || [];
  const nextUp = waiting.slice(0, 6); // show up to 6 waiting

  return (
    <div className="tv-queue-container" style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: '"Inter", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* HEADER */}
      <header style={{ 
        padding: '24px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Logo size={40} />
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ClinicFlow Queue
          </h1>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#cbd5e1' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', padding: 40, gap: 40 }}>
        
        {/* LEFT COLUMN: NOW SERVING */}
        <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', 
            borderRadius: 24, 
            border: '1px solid #334155',
            padding: 40,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: 36, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 4, margin: '0 0 20px 0' }}>Now Serving</h2>
            
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div 
                  key={current.tokenNumber}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ 
                    fontSize: 160, 
                    fontWeight: 900, 
                    lineHeight: 1,
                    color: '#38bdf8',
                    textShadow: '0 0 40px rgba(56, 189, 248, 0.4)'
                  }}>
                    {current.tokenNumber}
                  </div>
                  <div style={{ 
                    marginTop: 24, 
                    fontSize: 32, 
                    color: '#e2e8f0',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '12px 32px',
                    borderRadius: 100,
                    display: 'inline-block'
                  }}>
                    Proceed to Room {current.doctorRoom || '1'}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', color: '#64748b' }}
                >
                  <MonitorPlay size={80} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
                  <div style={{ fontSize: 32 }}>Waiting for next patient...</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* STATS ROW */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: 12, borderRadius: 12, color: '#38bdf8', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' }}>Waiting</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{queueState?.totalWaiting || 0}</div>
              </div>
            </div>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: 12, borderRadius: 12, color: '#a78bfa', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' }}>Est. Wait</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>~{queueState?.avgConsultationTime || 10}m</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UP NEXT */}
        <div style={{ flex: '1', background: '#1e293b', borderRadius: 24, border: '1px solid #334155', padding: '32px 32px 0 32px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 24, color: '#f8fafc', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity color="#a78bfa" /> Up Next
          </h3>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence>
              {nextUp.length > 0 ? nextUp.map((token, index) => (
                <motion.div
                  key={token.tokenNumber}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    background: index === 0 ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    borderBottom: '1px solid #334155',
                    borderLeft: index === 0 ? '4px solid #38bdf8' : '4px solid transparent'
                  }}
                >
                  <div style={{ fontSize: 36, fontWeight: 700, color: index === 0 ? '#38bdf8' : '#e2e8f0' }}>
                    #{token.tokenNumber}
                  </div>
                  <div style={{ fontSize: 18, color: '#94a3b8' }}>
                    {token.isEmergencyAlert ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="pulse" style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></span> HIGH PRIORITY
                      </span>
                    ) : 'Waiting'}
                  </div>
                </motion.div>
              )) : (
                <div style={{ color: '#64748b', fontSize: 18, textAlign: 'center', marginTop: 100 }}>
                  No patients waiting in the queue.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* FOOTER TICKER */}
      <footer style={{ background: '#38bdf8', color: '#0f172a', padding: '12px 0', fontSize: 18, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <motion.div 
          animate={{ x: [window.innerWidth, -1500] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          style={{ display: 'inline-block' }}
        >
          Welcome to ClinicFlow! Please ensure you have linked your token on your mobile device. If your token number is on the screen, proceed directly to the doctor's room. Remember to wear a mask if you have flu symptoms.
        </motion.div>
      </footer>
    </div>
  );
}
