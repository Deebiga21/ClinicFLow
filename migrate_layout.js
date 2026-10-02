const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src/pages');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('AppShell')) {
    // Remove import
    content = content.replace(/import AppShell from ['"]\.\.\/components\/AppShell['"];?\r?\n?/g, '');
    
    // Replace <AppShell> with <>
    content = content.replace(/<AppShell[^>]*>/g, '<>');
    
    // Replace </AppShell> with </>
    content = content.replace(/<\/AppShell>/g, '</>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
});
