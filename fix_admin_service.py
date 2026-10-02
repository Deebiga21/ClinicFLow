import re

with open("core_backend/services/admin_service.py", "r") as f:
    code = f.read()

# Fix get_patient_flow_chart
code = re.sub(
    r"def get_patient_flow_chart\(self\):.*?def get_workload_summary",
    "def get_patient_flow_chart(self):\n        return []\n\n    def get_workload_summary",
    code, flags=re.DOTALL
)

# Fix get_congestion_chart
code = re.sub(
    r"def get_congestion_chart\(self\):.*?def get_ml_models",
    "def get_congestion_chart(self):\n        return []\n\n    def get_ml_models",
    code, flags=re.DOTALL
)

# Fix mock metrics
code = code.replace('"metrics": {"R2": "0.85", "MAE": "4.2"}', '"metrics": None')
code = code.replace('"metrics": {"Precision": "0.92"}', '"metrics": None')

# Fix get_model_performance
code = re.sub(
    r"def get_model_performance\(self, model_id\):.*?def get_explainability_data",
    "def get_model_performance(self, model_id):\n        return None\n\n    def get_explainability_data",
    code, flags=re.DOTALL
)

# Fix get_explainability_data
code = re.sub(
    r"def get_explainability_data\(self, model_id\):.*?def get_prediction_feedback",
    "def get_explainability_data(self, model_id):\n        return None\n\n    def get_prediction_feedback",
    code, flags=re.DOTALL
)

# Fix digital twin
code = re.sub(
    r"def get_digital_twin_state\(self\):.*?def run_digital_twin_simulation",
    "def get_digital_twin_state(self):\n        return None\n\n    def run_digital_twin_simulation",
    code, flags=re.DOTALL
)

with open("core_backend/services/admin_service.py", "w") as f:
    f.write(code)
