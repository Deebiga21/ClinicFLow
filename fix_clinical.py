with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "r") as f:
    content = f.read()

content = content.replace("from fastapi import APIRouter", "from fastapi import APIRouter, Depends")
if "from database.config import get_db" not in content:
    content = content.replace("from sqlalchemy.orm import Session", "from sqlalchemy.orm import Session\nfrom database.config import get_db")

with open(r"d:\ClinicFLow\core_backend\routers\clinical.py", "w") as f:
    f.write(content)
