import { API_BASE } from '../config';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchWithHandler(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();
    
    if (data && data.success === false) {
       throw new ApiError(data.message || 'API request failed', response.status);
    }
    
    // FastAPI might return { success: true, data: {...} } or just the data directly.
    return data.data !== undefined ? data.data : data;

  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Generic fallback for subagents that used api.get('/path')
  get: (url, options) => fetchWithHandler(url, options),
  post: (url, data, options = {}) => fetchWithHandler(url, { method: 'POST', body: JSON.stringify(data), ...options }),

  // Admin Dashboard
  getDashboardOverview: () => fetchWithHandler('/admin/dashboard'),
  
  // Patient Portal
  getPatientDashboard: (patientId) => fetchWithHandler(`/patient/dashboard/${patientId}`),
  getPatientAppointments: (patientId) => fetchWithHandler(`/patient/${patientId}/appointments`),
  getPatientPrescriptions: (patientId) => fetchWithHandler(`/patient/${patientId}/prescriptions`),
  getPatientMedications: (patientId) => fetchWithHandler(`/patient/${patientId}/medications`),
  getPatientJourney: (patientId) => fetchWithHandler(`/patient/${patientId}/journey`),
  getPatientNotifications: (patientId) => fetchWithHandler(`/patient/${patientId}/notifications`),
  getPatientProfile: (patientId) => fetchWithHandler(`/patient/${patientId}/profile`),
  getCurrentVisit: (patientId) => fetchWithHandler(`/patient/${patientId}/visit`),
  
  // Nurse / Desk
  getQueueSummary: () => fetchWithHandler('/queue/summary'),
  callNextPatient: (doctorId) => fetchWithHandler('/queue/call-next', { 
    method: 'POST',
    body: JSON.stringify({ doctor_id: doctorId })
  }),
  
  // ML & Digital Twin
  getCongestionForecast: () => fetchWithHandler('/congestion/forecast'),
  getBottlenecks: () => fetchWithHandler('/congestion/bottlenecks'),
  simulateDigitalTwin: (config) => fetchWithHandler('/digital_twin/simulate', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  // Appointments
  getAppointments: () => fetchWithHandler('/appointments/'),
  createAppointment: (data) => fetchWithHandler('/appointments/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  checkInAppointment: (id) => fetchWithHandler(`/appointments/${id}/check-in`, { method: 'POST' }),
  deleteAppointment: (id) => fetchWithHandler(`/appointments/${id}`, { method: 'DELETE' }),
  
  // Medicines
  getMedicineInventory: () => fetchWithHandler('/medicines/inventory'),
  getExpiryRisks: () => fetchWithHandler('/medicines/expiry-risk'),
  
  // Doctors
  getDoctors: () => fetchWithHandler('/doctors/'),
  getDoctorWorkload: () => fetchWithHandler('/doctors/workload'),

  // Medicines (Additional)
  getMedicineDemandForecast: () => fetchWithHandler('/medicines/demand-forecast'),

  // Reports
  getReports: () => fetchWithHandler('/reports'),
  generateReport: (data) => fetchWithHandler('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Notifications (Admin)
  getAdminNotifications: () => fetchWithHandler('/notifications/admin'),
  markNotificationRead: (id) => fetchWithHandler(`/notifications/${id}/read`, { method: 'POST' }),

  // Settings & System
  getSettings: () => fetchWithHandler('/settings'),
  updateSettings: (data) => fetchWithHandler('/settings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSystemStatus: () => fetchWithHandler('/system/status'),

  // New Endpoints for Admin Pages
  getExplainabilityData: (modelId) => fetchWithHandler(`/admin/explainability/${modelId}`),
  getModelPerformanceData: (modelId) => fetchWithHandler(`/admin/model-performance/${modelId}`),
  getPredictionFeedback: () => fetchWithHandler('/admin/prediction-feedback'),
  getOperationalAnomalies: (filters) => {
    const query = new URLSearchParams(filters || {}).toString();
    return fetchWithHandler(`/admin/anomalies?${query}`);
  },
  getCurrentClinicState: () => fetchWithHandler('/admin/digital-twin/current-state'),
  runDigitalTwinSimulation: (config) => fetchWithHandler('/admin/digital-twin/simulate', {
    method: 'POST',
    body: JSON.stringify(config)
  }),
};
