import re

def fix_imports(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace("from database.config import SessionLocal", "from services.orchestration import orchestrator")
    
    # replace get_db and SessionLocal with orchestrator.Session
    # In auth.py we have:
    # def get_db():
    #     db = SessionLocal()
    # Replace that function body
    content = re.sub(r'def get_db\(\).*?db\.close\(\)', 'def get_db():\n    db = orchestrator.Session()\n    try:\n        yield db\n    finally:\n        db.close()', content, flags=re.DOTALL)
    
    with open(filepath, "w") as f:
        f.write(content)

fix_imports(r"d:\ClinicFLow\core_backend\routers\auth.py")
fix_imports(r"d:\ClinicFLow\core_backend\routers\payments.py")

print("Fixed imports in auth.py and payments.py")
