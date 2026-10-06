with open('core_backend/routers/medicines.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\\\n', '')
content = content.replace('\\n', '')

with open('core_backend/routers/medicines.py', 'w', encoding='utf-8') as f:
    f.write(content)
