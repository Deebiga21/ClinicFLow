# ClinicFlow AI - Full Application Transformation Plan

## Phase 1: Core Architecture & Realtime Foundation (In Progress)
- [x] Analyze current frontend & backend structure
- [x] Overhaul `App.jsx` routing to match the new sidebar requirements
- [x] Implement the `GlobalLayout` component with the unified sidebar
- [x] Setup global WebSocket context (`WebSocketProvider`) in React to listen for system-wide broadcast events
- [x] Verify FastAPI WebSocket manager is capable of broadcasting standard events

## Phase 2: Clinical Operations Pages
- [x] **Dashboard:** Build the command center with real-time stats, current queue, AI predictions, and doctor workload.
- [x] **Appointments:** Full CRUD for appointments, confirm/check-in/cancel/no-show actions triggering database updates.
- [x] **Live Queue:** Implement real-time token management, "Call Next" functionality, and wait time predictions.
- [x] **Consultation:** Build the doctor interface for starting/completing consultations, logging actual durations vs predictions, and creating prescriptions.

## Phase 3: Clinic Intelligence & Resources
- [x] **Congestion:** Visualize current and forecasted congestion with bottleneck analysis.
- [x] **Doctors:** Display doctor workloads, availability toggles, and performance metrics.
- [x] **Medicine Intel:** Implement inventory tracking, expiry intelligence (FEFO), and waste risk calculations.
- [x] **Med Schedule:** Generate dynamic patient schedules from prescriptions, track medication events (administered/skipped).

## Phase 4: Analytics, Support & Polish
- [ ] **Nurse Chat:** Connect the assistant page to real backend data APIs instead of mocked AI responses.
- [ ] **Reports & Feedback:** Build reporting tools for clinical journeys, medication regularity, and AI prediction feedback loops.
- [ ] **Settings:** Allow modifying core operational parameters (default consultation time, congestion thresholds) and propagate to the backend.
- [ ] **Global Features:** Implement global search and the notification center.

## Phase 5: Demo Mode & Final Validation
- [ ] Create an isolated "Synthetic Demo Data" seeding endpoint.
- [ ] Run through the 8-step Acceptance Test.
