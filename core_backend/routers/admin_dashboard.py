from fastapi import APIRouter, Body
from services.admin_service import AdminService

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin_service = AdminService()

@router.get("/dashboard")
def get_dashboard():
    return {"data": admin_service.get_analytics()}

@router.get("/patient-flow/summary")
def get_patient_flow_summary():
    return {"data": admin_service.get_patient_flow_summary()}

@router.get("/patient-flow/chart")
def get_patient_flow_chart():
    return {"data": admin_service.get_patient_flow_chart()}

@router.get("/workload/summary")
def get_workload_summary():
    return {"data": admin_service.get_workload_summary()}

@router.get("/workload/doctors")
def get_workload_doctors():
    return {"data": admin_service.get_workload_doctors()}

@router.get("/workload/chart")
def get_workload_chart():
    # Adding a simple chart for workload
    return {"data": []}

@router.get("/congestion/summary")
def get_congestion_summary():
    return {"data": admin_service.get_congestion_summary()}

@router.get("/congestion/chart")
def get_congestion_chart():
    return {"data": admin_service.get_congestion_chart()}

@router.get("/ml-models")
def get_ml_models():
    return {"data": admin_service.get_ml_models()}

@router.get("/explainability/{modelId}")
def get_explainability(modelId: str):
    return {"data": admin_service.get_explainability_data(modelId)}

@router.get("/model-performance/{modelId}")
def get_model_performance(modelId: str):
    return {"data": admin_service.get_model_performance(modelId)}

@router.get("/prediction-feedback")
def get_prediction_feedback():
    return {"data": admin_service.get_prediction_feedback()}

@router.get("/predictions")
def get_predictions():
    return {"data": admin_service.get_predictions()}

@router.get("/anomalies")
def get_anomalies():
    return {"data": admin_service.get_anomalies()}

@router.get("/digital-twin/current-state")
def get_digital_twin_current_state():
    return {"data": admin_service.get_digital_twin_state()}

@router.post("/digital-twin/simulate")
def simulate_digital_twin(config: dict = Body(...)):
    return {"data": admin_service.run_digital_twin_simulation(config)}
