with open('frontend/src/pages/Landing.jsx', 'r') as f:
    text = f.read()

find = """          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0284c7', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: '2px solid #0284c7' }}>
              Patient Dashboard
            </Link>
            <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
              Admin / Nurse Launch <ArrowRight size={20} />
            </Link>
          </div>"""

replace = """          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px' }}>
            <Link to="/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0284c7', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: '2px solid #0284c7' }}>
              Patient Dashboard
            </Link>
            <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
              Admin / Analyst Launch <ArrowRight size={20} />
            </Link>
          </div>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#334155' }}>Staff & E2E Testing Portals</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <Link to="/reception" style={{ background: '#f8fafc', color: '#475569', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Receptionist</Link>
              <Link to="/queue" style={{ background: '#f8fafc', color: '#475569', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Public TV Queue</Link>
              <Link to="/nurse" style={{ background: '#f8fafc', color: '#475569', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Nurse Console</Link>
              <Link to="/doctor" style={{ background: '#f0f9ff', color: '#0369a1', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bae6fd', textDecoration: 'none', fontWeight: 500 }}>Doctor Consult</Link>
              <Link to="/pharmacy" style={{ background: '#f8fafc', color: '#475569', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', fontWeight: 500 }}>Pharmacy</Link>
              <Link to="/pipeline" style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 500 }}>API Pipeline Tester</Link>
            </div>
          </div>"""

text = text.replace(find, replace)
with open('frontend/src/pages/Landing.jsx', 'w') as f:
    f.write(text)
