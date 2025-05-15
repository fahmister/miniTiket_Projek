// Updated copy-assets.js (no external dependencies needed)
const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    entry.isDirectory() 
      ? copyDirSync(srcPath, destPath)
      : fs.copyFileSync(srcPath, destPath);
  }
}

// Copy templates
copyDirSync('./src/templates', './dist/src/templates', { overwrite: true });
// Copy public assets
copyDirSync('./public', './dist/public', { overwrite: true });