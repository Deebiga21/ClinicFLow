const fs = require('fs');

let acc = fs.readFileSync('src/pages/admin/AdminCommandCenter.jsx', 'utf8');

// Replace mock declarations
acc = acc.replace(/const mockForecastData = \[[\s\S]*?\];/m, 'const mockForecastData = [];');
acc = acc.replace(/const mockShapData = \[[\s\S]*?\];/m, 'const mockShapData = [];');
acc = acc.replace(/const mockPredVsActual = \[[\s\S]*?\];/m, 'const mockPredVsActual = [];');

// Add real-time hook
acc = acc.replace(
  'import { api } from \\'../../services/api\\';',
  'import { api } from \\'../../services/api\\';\\nimport { useClinicWebSocket } from \\'../../hooks/useClinicWebSocket\\';'
);

acc = acc.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(true);\\n  const { lastEvent } = useClinicWebSocket();'
);

acc = acc.replace(
  'const interval = setInterval(fetchData, 15000);',
  '// no interval needed with ws'
);
acc = acc.replace(
  'return () => clearInterval(interval);',
  '// cleanup'
);

// Add lastEvent as dependency to useEffect
acc = acc.replace(
  '}, []);',
  '}, [lastEvent]);'
);

fs.writeFileSync('src/pages/admin/AdminCommandCenter.jsx', acc, 'utf8');
