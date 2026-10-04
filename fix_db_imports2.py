import re

def fix_imports2(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    content = content.replace("from services.orchestration import orchestrator", "from services.orchestration import OrchestrationService\norchestrator = OrchestrationService()")
    
    with open(filepath, "w") as f:
        f.write(content)

fix_imports2(r"d:\ClinicFLow\core_backend\routers\auth.py")
fix_imports2(r"d:\ClinicFLow\core_backend\routers\payments.py")

print("Fixed OrchestrationService instantiation in auth.py and payments.py")
