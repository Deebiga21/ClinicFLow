const fs = require('fs');
const dir = 'src/pages/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const fixes = [
  'ChartCard', 'MetricCard', 'StatusBadge', 'LoadingState', 'EmptyState', 'ErrorState'
];

for (const file of files) {
  let content = fs.readFileSync(dir + '/' + file, 'utf8');
  let changed = false;
  
  for (const component of fixes) {
    const namedImportPattern = new RegExp(`import \\{\\s*${component}\\s*\\} from`, 'g');
    if (namedImportPattern.test(content)) {
      content = content.replace(namedImportPattern, `import ${component} from`);
      changed = true;
    }
    
    // Some subagents might do import { ComponentA, ComponentB } from '...';
    // This script won't fix that easily, so I'll just do a global replace for { ComponentA }
  }

  // Handle combined imports if necessary, e.g. import { ChartCard, MetricCard }
  // Let's do a naive string replacement
  content = content.replace(/import\s*\{\s*ChartCard\s*\}\s*from/g, 'import ChartCard from');
  content = content.replace(/import\s*\{\s*MetricCard\s*\}\s*from/g, 'import MetricCard from');
  content = content.replace(/import\s*\{\s*StatusBadge\s*\}\s*from/g, 'import StatusBadge from');
  content = content.replace(/import\s*\{\s*LoadingState\s*\}\s*from/g, 'import LoadingState from');
  content = content.replace(/import\s*\{\s*EmptyState\s*\}\s*from/g, 'import EmptyState from');
  content = content.replace(/import\s*\{\s*ErrorState\s*\}\s*from/g, 'import ErrorState from');


  if (content.includes('import useClinicWebSocket')) {
    content = content.replace(/import useClinicWebSocket/g, 'import { useClinicWebSocket }');
    changed = true;
  }
  if (content.includes('import api ')) {
    content = content.replace(/import api from/g, 'import { api } from');
    changed = true;
  }
  
  if (changed || content !== fs.readFileSync(dir + '/' + file, 'utf8')) {
    fs.writeFileSync(dir + '/' + file, content, 'utf8');
  }
}
