import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';

const CrowdBackground = () => {
  const people = Array.from({ length: 60 });
  const colors = ['#fde047', '#93c5fd', '#fca5a5', '#c4b5fd', '#86efac', '#e2e8f0'];
  
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
      <style>
        {`
          @keyframes marqueeLeft {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marqueeRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .marquee-track {
            display: flex;
            width: 200%;
          }
          .marquee-fast { animation: marqueeLeft 20s linear infinite; }
          .marquee-med { animation: marqueeRight 35s linear infinite; }
          .marquee-slow { animation: marqueeLeft 50s linear infinite; }
        `}
      </style>
      
      {/* Back row - slow */}
      <div style={{ position: 'absolute', bottom: '60px', width: '100%', opacity: 0.5, transform: 'scale(0.7)' }}>
        <div className="marquee-track marquee-slow">
          {[...people, ...people].map((_, i) => (
            <div key={`back-${i}`} style={{ minWidth: 60, height: 60, position: 'relative' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: colors[i % colors.length], border: '2px solid #333', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%', margin: '0 2px' }}></div>
                <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%', margin: '0 2px' }}></div>
              </div>
              <div style={{ width: 40, height: 30, background: '#fff', border: '2px solid #333', borderRadius: '20px 20px 0 0', margin: '-4px auto 0' }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle row - medium */}
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', opacity: 0.8, transform: 'scale(0.85)' }}>
        <div className="marquee-track marquee-med">
          {[...people, ...people].map((_, i) => (
            <div key={`mid-${i}`} style={{ minWidth: 70, height: 70, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors[(i + 2) % colors.length], border: '2px solid #333', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%', margin: '0 3px' }}></div>
                <div style={{ width: 4, height: 4, background: '#333', borderRadius: '50%', margin: '0 3px' }}></div>
              </div>
              <div style={{ width: 50, height: 40, background: '#fff', border: '2px solid #333', borderRadius: '25px 25px 0 0', margin: '-5px auto 0', position: 'relative' }}>
                {i % 4 === 0 && <div style={{ position: 'absolute', top: 10, left: 20, color: '#ef4444', fontWeight: 'bold', fontSize: 18 }}>+</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Front row - fast */}
      <div style={{ position: 'absolute', bottom: '-10px', width: '100%', transform: 'scale(1)' }}>
        <div className="marquee-track marquee-fast">
          {[...people, ...people].map((_, i) => (
            <div key={`front-${i}`} style={{ minWidth: 80, height: 90, position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: colors[(i + 4) % colors.length], border: '2px solid #333', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
                <div style={{ width: 5, height: 5, background: '#333', borderRadius: '50%', margin: '0 4px' }}></div>
                <div style={{ width: 5, height: 5, background: '#333', borderRadius: '50%', margin: '0 4px' }}></div>
                <div style={{ width: 12, height: 6, borderBottom: '2px solid #333', borderRadius: '0 0 10px 10px', marginTop: 4 }}></div>
              </div>
              <div style={{ width: 60, height: 50, background: '#fff', border: '2px solid #333', borderRadius: '30px 30px 0 0', margin: '-6px auto 0', position: 'relative' }}>
                 {i % 3 === 0 && <div style={{ position: 'absolute', top: 12, left: 25, width: 10, height: 10, background: '#0284c7', borderRadius: '50%' }}></div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#f0f9ff' }}>
      
      {/* CSS Gallery Tunnel Perspective with rolling images */}
      <div style={{ position: 'absolute', inset: 0, perspective: '800px', zIndex: 0 }}>
        <style>
          {`
            @keyframes rollTunnel {
              0% { transform: translateZ(-2000px); }
              100% { transform: translateZ(500px); }
            }
            @keyframes slideGrid {
              0% { background-position: 0 0; }
              100% { background-position: 0 200px; }
            }
            .tunnel-wall {
              position: absolute;
              width: 200vw;
              height: 200vh;
              background-size: 200px 200px;
              background-image: linear-gradient(to right, #38bdf8 2px, transparent 2px), linear-gradient(to bottom, #38bdf8 2px, transparent 2px);
              opacity: 0.2;
              animation: slideGrid 4s linear infinite;
            }
            .tunnel-image {
              position: absolute;
              width: 300px;
              height: 200px;
              background: #fff;
              border: 8px solid #0ea5e9;
              box-shadow: 0 20px 40px rgba(0,0,0,0.2);
              object-fit: cover;
              animation: rollTunnel 15s linear infinite;
            }
          `}
        </style>
        
        {/* Floor */}
        <div className="tunnel-wall" style={{ bottom: '-50vh', left: '-50vw', transform: 'rotateX(75deg)' }} />
        {/* Ceiling */}
        <div className="tunnel-wall" style={{ top: '-50vh', left: '-50vw', transform: 'rotateX(-75deg)' }} />
        {/* Left Wall */}
        <div className="tunnel-wall" style={{ top: '-50vh', left: '-50vw', transform: 'rotateY(75deg)' }} />
        {/* Right Wall */}
        <div className="tunnel-wall" style={{ top: '-50vh', right: '-50vw', transform: 'rotateY(-75deg)' }} />

        {/* Rolling Images in the Tunnel */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transformStyle: 'preserve-3d' }}>
          <div className="tunnel-image" style={{ background: '#0284c7', left: '-600px', top: '-100px', transform: 'translateZ(-800px) rotateY(60deg)', animationDelay: '0s' }}></div>
          <div className="tunnel-image" style={{ background: '#0369a1', left: '300px', top: '-100px', transform: 'translateZ(-1400px) rotateY(-60deg)', animationDelay: '2s' }}></div>
          <div className="tunnel-image" style={{ background: '#38bdf8', left: '-600px', top: '-100px', transform: 'translateZ(-2000px) rotateY(60deg)', animationDelay: '5s' }}></div>
          <div className="tunnel-image" style={{ background: '#0ea5e9', left: '300px', top: '-100px', transform: 'translateZ(-2600px) rotateY(-60deg)', animationDelay: '8s' }}></div>
        </div>
      </div>

      {/* Top Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#0ea5e9' }}>
          <div style={{ background: '#0ea5e9', color: 'white', padding: '6px', borderRadius: '8px' }}>
             <Activity size={20} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#0369a1' }}>ClinicFlow</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, fontWeight: 600, color: '#0284c7' }}>
          <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Platform</Link>
          <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>AI Intelligence</Link>
          <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>How it Works</Link>
          <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Research</Link>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.8 }}>Sign In</Link>
          <Link to="/login" style={{ background: 'rgba(255,255,255,0.8)', color: '#0369a1', padding: '10px 24px', borderRadius: 40, textDecoration: 'none', fontWeight: 600 }}>
            Launch ClinicFlow
          </Link>
        </div>
      </nav>

      {/* Main Content Centered */}
      <div style={{ position: 'relative', zIndex: 10, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: 800 }}
        >
          <h1 style={{ fontSize: '90px', fontWeight: 900, color: '#0f172a', letterSpacing: '-3px', margin: '0 0 20px 0', lineHeight: 1 }}>
            ClinicFlow
          </h1>
          <p style={{ fontSize: '24px', color: '#0369a1', fontWeight: 500, margin: '0 auto 40px', lineHeight: 1.4, maxWidth: 650 }}>
            Predict the flow. Transform real-time clinic operations into predictive intelligence.
          </p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
            Enter Dashboard <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>

      {/* Crowd Animation Bottom */}
      <CrowdBackground />
    </div>
  );
}
