const fs = require('fs');
const path = require('path');

const adminPages = ['AdminCommandCenter.jsx', 'AdminPatientFlow.jsx', 'AdminDoctorWorkload.jsx', 'AdminCongestion.jsx', 'AdminMLModels.jsx', 'AdminPredictions.jsx', 'AdminExplainability.jsx', 'AdminModelPerformance.jsx', 'AdminPredictionFeedback.jsx', 'AdminAnomalies.jsx', 'AdminDigitalTwin.jsx', 'AdminMedicine.jsx', 'AdminReports.jsx', 'AdminNotifications.jsx', 'AdminSettings.jsx'];

const patientPages = ['PatientHome.jsx', 'PatientVisit.jsx', 'PatientJourney.jsx', 'PatientAppointments.jsx', 'PatientPrescriptions.jsx', 'PatientMedications.jsx', 'PatientNotifications.jsx', 'PatientProfile.jsx'];

const sharedComponents = ['Sidebar.jsx', 'Header.jsx', 'MetricCard.jsx', 'StatusBadge.jsx', 'ChartCard.jsx', 'PredictionCard.jsx', 'Timeline.jsx', 'EmptyState.jsx', 'LoadingState.jsx', 'ErrorState.jsx'];

const makeFiles = (dir, files) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  files.forEach(f => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) {
      const name = f.replace('.jsx', '');
      const content = `import React from 'react';\n\nexport default function ${name}() {\n  return (\n    <div className="p-8">\n      <h1>${name}</h1>\n    </div>\n  );\n}\n`;
      fs.writeFileSync(p, content);
    }
  });
};

makeFiles('src/pages/admin', adminPages);
makeFiles('src/pages/patient', patientPages);
makeFiles('src/components/shared', sharedComponents);
console.log('Scaffolding complete.');
