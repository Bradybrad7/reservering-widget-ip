/**
 * Remove unnecessary "import React" statements
 * React 17+ JSX Transform doesn't require explicit React imports
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SRC_DIR = 'src';
const EXTENSIONS = ['.tsx', '.jsx'];

async function* getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const path = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      yield* getFiles(path);
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      yield path;
    }
  }
}

async function removeUnusedReactImports() {
  let filesProcessed = 0;
  let importsRemoved = 0;
  
  for await (const file of getFiles(SRC_DIR)) {
    try {
      let content = await readFile(file, 'utf-8');
      const originalContent = content;
      
      // Pattern 1: import React from 'react';
      content = content.replace(/^import React from ['"]react['"];?\n?/gm, '');
      
      // Pattern 2: import React, { ... } from 'react';
      // Convert to: import { ... } from 'react';
      content = content.replace(
        /^import React,\s*(\{[^}]+\})\s*from ['"]react['"];/gm,
        'import $1 from \'react\';'
      );
      
      if (content !== originalContent) {
        await writeFile(file, content, 'utf-8');
        importsRemoved++;
        console.log(`✅ Cleaned: ${file}`);
      }
      
      filesProcessed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Imports removed: ${importsRemoved}`);
}

removeUnusedReactImports().catch(console.error);
