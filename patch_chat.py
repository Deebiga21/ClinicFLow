import sys
with open('core_backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

import_str = "from routers.auth import router as auth_router\nfrom routers.chat import router as chat_router"
include_str = "app.include_router(auth_router)\napp.include_router(chat_router)"

content = content.replace("from routers.auth import router as auth_router", import_str)
content = content.replace("app.include_router(auth_router)", include_str)

with open('core_backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
