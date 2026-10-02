const fs = require('fs');
let acc = fs.readFileSync('src/pages/admin/AdminCommandCenter.jsx', 'utf8');
acc = acc.replace(/\\`/g, '`');
acc = acc.replace(/\\\$/g, '$');
fs.writeFileSync('src/pages/admin/AdminCommandCenter.jsx', acc, 'utf8');
