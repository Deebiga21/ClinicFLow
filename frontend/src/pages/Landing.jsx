import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';

const PersonFigure = ({ index, sizeScale = 1 }) => {
  const isDoctor = index % 5 === 0;
  const isNurse = index % 5 === 2;
  
  const colors = ['#fca5a5', '#fde047', '#93c5fd', '#c4b5fd', '#86efac', '#e2e8f0'];
  const skinColors = ['#fcd34d', '#fca5a5', '#f8b4cb', '#d4a373', '#e5c158'];
  
  const skinTone = skinColors[index % skinColors.length];
  
  const bodyColor = isDoctor ? '#ffffff' : isNurse ? '#0ea5e9' : colors[index % colors.length];
  
  const walkSpeed = 0.8 + (index % 3) * 0.2;
  
  return (
    <div style={{ minWidth: 60 * sizeScale, height: 80 * sizeScale, position: 'relative' }}>
      {/* Head */}
      <div style={{ 
        width: 24 * sizeScale, height: 24 * sizeScale, borderRadius: '50%', 
        background: skinTone, border: '2px solid #333', 
        margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', paddingTop: 2 * sizeScale, zIndex: 3, position: 'relative'
      }}>
        <div style={{ width: 3 * sizeScale, height: 3 * sizeScale, background: '#333', borderRadius: '50%', margin: `0 ${2 * sizeScale}px` }}></div>
        <div style={{ width: 3 * sizeScale, height: 3 * sizeScale, background: '#333', borderRadius: '50%', margin: `0 ${2 * sizeScale}px` }}></div>
      </div>
      
      {/* Torso */}
      <div style={{ 
        width: 32 * sizeScale, height: 28 * sizeScale, background: bodyColor, 
        border: '2px solid #333', borderRadius: '12px 12px 0 0', 
        margin: '-4px auto 0', position: 'relative', overflow: 'hidden', zIndex: 2
      }}>
        {isDoctor && (
          <>
            <div style={{ position: 'absolute', top: 4 * sizeScale, left: '50%', transform: 'translateX(-50%)', width: 14 * sizeScale, height: 18 * sizeScale, border: '2px solid #475569', borderTop: 'none', borderRadius: '0 0 50% 50%' }}></div>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 10 * sizeScale, height: 6 * sizeScale, background: '#0284c7', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
          </>
        )}
        
        {isNurse && (
          <>
            <div style={{ position: 'absolute', top: 8 * sizeScale, right: 4 * sizeScale, width: 8 * sizeScale, height: 8 * sizeScale, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
              <div style={{ color: '#ef4444', fontSize: 8 * sizeScale, fontWeight: 'bold', lineHeight: 1 }}>+</div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 12 * sizeScale, height: 8 * sizeScale, background: skinTone, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', borderBottom: '1px solid #333' }}></div>
          </>
        )}
      </div>

      {/* Legs Container */}
      <div style={{ 
        position: 'absolute', top: 46 * sizeScale, left: '50%', transform: 'translateX(-50%)', 
        width: 28 * sizeScale, height: 24 * sizeScale, zIndex: 1 
      }}>
        {/* Left Leg */}
        <div style={{ 
          position: 'absolute', left: 2 * sizeScale, top: 0, 
          width: 10 * sizeScale, height: 22 * sizeScale, background: '#334155', 
          border: '2px solid #333', borderRadius: '4px',
          transformOrigin: 'top center', animation: `walkLeg ${walkSpeed}s infinite ease-in-out`
        }}></div>
        {/* Right Leg */}
        <div style={{ 
          position: 'absolute', right: 2 * sizeScale, top: 0, 
          width: 10 * sizeScale, height: 22 * sizeScale, background: '#1e293b', 
          border: '2px solid #333', borderRadius: '4px',
          transformOrigin: 'top center', animation: `walkLeg ${walkSpeed}s infinite ease-in-out -${walkSpeed/2}s`
        }}></div>
      </div>
    </div>
  );
};

const CrowdBackground = () => {
  const people = Array.from({ length: 50 });
  
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
          @keyframes walkLeg {
            0% { transform: rotate(-25deg); }
            50% { transform: rotate(25deg); }
            100% { transform: rotate(-25deg); }
          }
        `}
      </style>
      
      {/* Back row - slow */}
      <div style={{ position: 'absolute', bottom: '60px', width: '100%', opacity: 0.7, transform: 'scale(0.8)' }}>
        <div className="marquee-track marquee-slow">
          {[...people, ...people].map((_, i) => (
            <PersonFigure key={`back-${i}`} index={i} sizeScale={0.8} />
          ))}
        </div>
      </div>

      {/* Middle row - medium */}
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', opacity: 0.9, transform: 'scale(0.95)' }}>
        <div className="marquee-track marquee-med">
          {[...people, ...people].map((_, i) => (
            <PersonFigure key={`mid-${i}`} index={i + 1} sizeScale={1} />
          ))}
        </div>
      </div>

      {/* Front row - fast */}
      <div style={{ position: 'absolute', bottom: '-10px', width: '100%', transform: 'scale(1.15)' }}>
        <div className="marquee-track marquee-fast">
          {[...people, ...people].map((_, i) => (
            <PersonFigure key={`front-${i}`} index={i + 2} sizeScale={1.2} />
          ))}
        </div>
      </div>
    </div>
  );
};

import RoundCarousel from '../components/shared/RoundCarousel';

export default function Landing() {
  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh' }}>
      
      {/* Hero Section (100vh) */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Background Video */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              opacity: 1,
              filter: 'contrast(1.15) saturate(1.1) brightness(1.05)'
            }}
          >
            <source src="/hospital_corridor.mp4" type="video/mp4" />
          </video>
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
            <Link to="/admin" style={{ background: 'rgba(255,255,255,0.8)', color: '#0369a1', padding: '10px 24px', borderRadius: 40, textDecoration: 'none', fontWeight: 600 }}>
              Admin / Nurse Launch
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
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
              <Link to="/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0284c7', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: '2px solid #0284c7' }}>
                Patient Dashboard
              </Link>
              <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
                Admin / Analyst Launch <ArrowRight size={20} />
              </Link>
            </div>

          </motion.div>
        </div>

        {/* Crowd Animation Bottom */}
        <CrowdBackground />
      </div>

      {/* Carousel Section */}
      <div style={{ padding: '100px 0', background: 'linear-gradient(to bottom, #f0f9ff, #ffffff)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>Trusted by Modern Clinics</h2>
          <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '16px auto 0' }}>
            A seamless digital experience for patients and an intelligent operational dashboard for healthcare providers.
          </p>
        </div>
        
        <div style={{ height: '600px', width: '100%', position: 'relative' }}>
          <RoundCarousel />
        </div>
      </div>

    </div>
  );
}
