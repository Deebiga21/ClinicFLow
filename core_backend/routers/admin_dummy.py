from fastapi import APIRouter

router = APIRouter(prefix="/api/admin", tags=["admin_dummy"])

@router.get("/patient-flow/summary")
def patient_flow_summary():
    return {"data": None}

@router.get("/patient-flow/chart")
def patient_flow_chart():
    return {"data": []}

@router.get("/ml-models")
def ml_models():
    return {"data": []}

@router.get("/predictions")
def predictions():
    return {"data": []}

@router.get("/workload/summary")
def workload_summary():
    return {"data": None}

@router.get("/workload/doctors")
def workload_doctors():
    return {"data": []}

@router.get("/workload/chart")
def workload_chart():
    return {"data": []}

@router.get("/congestion/summary")
def congestion_summary():
    return {"data": None}

@router.get("/congestion/chart")
def congestion_chart():
    return {"data": []}

@router.get("/explainability/{modelId}")
def explainability(modelId: str):
    return {"data": None}

@router.get("/model-performance/{modelId}")
def model_performance(modelId: str):
    return {"data": None}

@router.get("/prediction-feedback")
def prediction_feedback():
    return {"data": None}

@router.get("/anomalies")
def anomalies():
    return {"data": []}

@router.get("/digital-twin/current-state")
def digital_twin_current():
    return {"data": None}

@router.post("/digital-twin/simulate")
def digital_twin_simulate():
    return {"data": None}
