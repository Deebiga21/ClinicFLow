import re

with open('frontend/src/pages/Landing.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('imageWidth={250}', 'imageWidth={340}')
content = content.replace('imageHeight={350}', 'imageHeight={480}')

with open('frontend/src/pages/Landing.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
