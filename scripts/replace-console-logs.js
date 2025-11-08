/**
 * Script to replace console.log statements with proper logging
 * 
 * This script helps migrate from console.log to the logger service
 * for better production-ready logging.
 * 
 * Usage:
 *   node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Patterns to replace
const replacements = [
  // Replace console.log with logger.info
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    importNeeded: true
  },
  // Replace console.error with logger.error
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    importNeeded: true
  },
  // Replace console.warn with logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    importNeeded: true
  },
  // Replace console.debug with logger.debug
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    importNeeded: true
  },
];

function shouldProcessFile(filePath) {
  // Skip node_modules and dist
  if (filePath.includes('node_modules') || filePath.includes('dist')) {
    return false;
  }
  
  // Only process .ts and .tsx files
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

function addLoggerImport(content, filePath) {
  // Check if logger is already imported
  if (content.includes('from \'../services/logger\'') || 
      content.includes('from \'./logger\'') ||
      content.includes('from \'../../services/logger\'')) {
    return content;
  }
  
  // Determine correct import path based on file location
  const relativePath = path.relative(srcDir, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  const importPath = '../'.repeat(depth) + 'services/logger';
  
  // Add import after other imports
  const importStatement = `import { logger } from '${importPath}';\n`;
  
  // Find the last import statement
  const importRegex = /import .* from .*;?\n/g;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    
    return content.slice(0, lastImportIndex + lastImport.length) +
           importStatement +
           content.slice(lastImportIndex + lastImport.length);
  }
  
  // If no imports, add at the top
  return importStatement + content;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let needsImport = false;
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement, importNeeded }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      changed = true;
      if (importNeeded) needsImport = true;
    }
  });
  
  // Add logger import if needed
  if (changed && needsImport) {
    content = addLoggerImport(content, filePath);
  }
  
  // Write back if changed
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function processDirectory(dir) {
  let filesProcessed = 0;
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (shouldProcessFile(filePath)) {
        if (processFile(filePath)) {
          filesProcessed++;
        }
      }
    });
  }
  
  walk(dir);
  return filesProcessed;
}

// Run the script
console.log('🔄 Replacing console statements with logger...\n');
const count = processDirectory(srcDir);
console.log(`\n✅ Done! Updated ${count} files.`);
console.log('\n⚠️  Note: Please review the changes and test your application.');
console.log('💡 Tip: Some console statements in error boundaries or debugging code might need to stay as console.');
