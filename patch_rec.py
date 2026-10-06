import sys
with open('frontend/src/pages/ReceptionistScreen.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "onClick={() => handle('/queue/call-next')}",
    "onClick={() => handle('/queue/call-next', { doctor_id: 'D_001' })}"
)

content = content.replace(
    "onClick={() => handle('/queue/skip')}",
    "onClick={() => handle('/queue/skip', { doctor_id: 'D_001' })}"
)

content = content.replace(
    "async function handle(path) {",
    "async function handle(path, body = null) {"
)

content = content.replace(
    "try { await call(path, { method: 'POST' }); }",
    "try { await call(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }"
)

with open('frontend/src/pages/ReceptionistScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
