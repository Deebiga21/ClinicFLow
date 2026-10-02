import re

with open("core_backend/main.py", "r") as f:
    code = f.read()

code = code.replace(r"from routers.medications import router as medications_router\nfrom routers.admin_dummy import router as admin_dummy_router", "from routers.medications import router as medications_router\nfrom routers.admin_dummy import router as admin_dummy_router")

code = code.replace(r"app.include_router(medications_router)\napp.include_router(admin_dummy_router)", "app.include_router(medications_router)\napp.include_router(admin_dummy_router)")

with open("core_backend/main.py", "w") as f:
    f.write(code)
