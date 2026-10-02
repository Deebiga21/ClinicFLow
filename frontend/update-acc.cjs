const fs = require('fs');

let acc = fs.readFileSync('src/pages/admin/AdminCommandCenter.jsx', 'utf8');

acc = acc.replace(/const mockForecastData = \[[\s\S]*?\];/, 'const mockForecastData = [];');
acc = acc.replace(/const mockShapData = \[[\s\S]*?\];/, 'const mockShapData = [];');
acc = acc.replace(/const mockPredVsActual = \[[\s\S]*?\];/, 'const mockPredVsActual = [];');

if (!acc.includes('useClinicWebSocket')) {
  acc = acc.replace(
    "import { api } from '../../services/api';",
    "import { api } from '../../services/api';\nimport { useClinicWebSocket } from '../../hooks/useClinicWebSocket';"
  );
}

if (!acc.includes('const { lastEvent }')) {
  acc = acc.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const { lastEvent } = useClinicWebSocket();'
  );
}

acc = acc.replace(
  'const interval = setInterval(fetchData, 15000);',
  '// no interval needed with ws'
);
acc = acc.replace(
  'return () => clearInterval(interval);',
  '// cleanup'
);

acc = acc.replace(
  '}, []);',
  '}, [lastEvent]);'
);

// Show "DATA UNAVAILABLE" if empty
acc = acc.replace(
  '<AreaChart data={mockForecastData}',
  '{mockForecastData.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400 bg-white/50 backdrop-blur-sm z-50">FORECAST UNAVAILABLE</div> : null}\n                   <AreaChart data={mockForecastData}'
);

acc = acc.replace(
  '{mockShapData.map(item => (',
  '{mockShapData.length === 0 ? <div className="text-sm font-bold text-slate-400 text-center py-8">EXPLANATION UNAVAILABLE</div> : mockShapData.map(item => ('
);

acc = acc.replace(
  '<RechartsLineChart data={mockPredVsActual}',
  '{mockPredVsActual.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400 bg-white/50 backdrop-blur-sm z-50">DATA UNAVAILABLE</div> : null}\n                 <RechartsLineChart data={mockPredVsActual}'
);

fs.writeFileSync('src/pages/admin/AdminCommandCenter.jsx', acc, 'utf8');
