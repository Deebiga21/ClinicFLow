| Feature                                | What it does                                                                           | ML connection                         | Dashboard               |
| -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------- |
| **1. Patient Journey Intelligence**    | Tracks Appointment → Check-in → Nurse → Doctor → Consultation → Medication → Follow-up | Predict next stage                    | Patient + Nurse + Admin |
| **2. Patient Readiness Score**         | Shows whether patient information is complete before doctor visit                      | Predict readiness / operational delay | Patient + Nurse         |
| **3. Next-Patient Preparation**        | Tells nurse which patient is likely to need preparation next                           | Waiting-time + journey prediction     | Nurse                   |
| **4. Bottleneck Detection**            | Finds where patients are accumulating                                                  | Anomaly/congestion models             | Admin                   |
| **5. What Happens Next?**              | Predicts the next operational event                                                    | Prediction/orchestration              | All                     |
| **6. Doctor Workload Forecast**        | Shows current and upcoming workload                                                    | Forecasting                           | Admin + Nurse           |
| **7. No-Show Prediction**              | Predicts appointment attendance risk                                                   | Classification                        | Admin                   |
| **8. Smart Appointment Slot Analysis** | Shows which future slots are likely to become congested                                | Arrival + congestion prediction       | Admin                   |
| **9. Medicine Demand Forecast**        | Predicts medicine requirement from approved prescriptions/appointments                 | Forecasting                           | Admin/Nurse             |
| **10. Medicine Expiry Risk**           | Identifies stock likely to expire before expected usage                                | Demand + inventory analytics          | Admin/Nurse             |
| **11. Prediction vs Actual Lab**       | Shows how predictions performed after real events occur                                | Feedback loop                         | Admin                   |
| **12. What-If Digital Twin**           | Simulates changing doctors, arrival rate, consultation duration                        | Simulation                            | Admin                   |
| **13. Operational Anomaly Center**     | Detects unusual queue growth, long consultations, arrival spikes                       | Isolation Forest                      | Admin                   |
| **14. Patient Burden Index**           | Estimates total operational burden: wait + stages + transitions                        | Derived operational analytics         | Patient/Admin           |
| **15. Clinic Flow Score**              | Overall operational health based on queue, congestion, waiting and workload            | Composite analytics                   | Admin                   |
| **16. Nurse Handoff Intelligence**     | Shows what information needs to move from nurse → doctor                               | Readiness + journey data              | Nurse                   |
| **17. Follow-up Tracker**              | Tracks upcoming follow-up appointments and completion                                  | Optional prediction later             | Patient/Admin           |
| **18. Prediction Explanation**         | "Why is this wait 24 min?"                                                             | SHAP                                  | Patient/Nurse/Admin     |
