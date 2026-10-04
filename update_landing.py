import re

with open(r"d:\ClinicFLow\frontend\src\pages\Landing.jsx", "r") as f:
    content = f.read()

# Replace the two buttons with Patient Login and Nurse Dashboard
old_buttons = """<Link to="/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0284c7', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: '2px solid #0284c7' }}>
                Patient Dashboard
              </Link>
              <Link to="/nurse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
                Nurse Dashboard <ArrowRight size={20} />
              </Link>"""

new_buttons = """<Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0284c7', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', border: '2px solid #0284c7' }}>
                Patient Login
              </Link>
              <Link to="/nurse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0284c7', color: '#fff', padding: '16px 36px', borderRadius: 40, fontSize: 18, fontWeight: 600, textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)' }}>
                Nurse Dashboard <ArrowRight size={20} />
              </Link>"""

content = content.replace(old_buttons, new_buttons)

with open(r"d:\ClinicFLow\frontend\src\pages\Landing.jsx", "w") as f:
    f.write(content)
print("Updated Landing.jsx")
