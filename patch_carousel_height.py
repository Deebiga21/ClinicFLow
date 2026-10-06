import re

with open('frontend/src/pages/Landing.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("height: '600px'", "height: '700px'")

with open('frontend/src/pages/Landing.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
