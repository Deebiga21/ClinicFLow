with open(r"d:\ClinicFLow\core_backend\main.py", "r") as f:
    content = f.read()

import_statement = """from routers.chat import router as chat_router
from routers.auth import router as auth_router
from routers.payments import router as payments_router"""

include_statement = """app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(payments_router)"""

if "from routers.auth import router as auth_router" not in content:
    content = content.replace("from routers.chat import router as chat_router", import_statement)
    content = content.replace("app.include_router(chat_router)", include_statement)
    
    with open(r"d:\ClinicFLow\core_backend\main.py", "w") as f:
        f.write(content)
print("Updated main.py with auth and payments routers")
