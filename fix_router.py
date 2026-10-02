import re

with open("core_backend/routers/admin_dashboard.py", "r") as f:
    code = f.read()

code = re.sub(
    r'return {"data": {"labels": \["Cardiology".*?}}',
    r'return {"data": []}',
    code,
    flags=re.DOTALL
)

with open("core_backend/routers/admin_dashboard.py", "w") as f:
    f.write(code)
