/**
 * Script to copy PDF.js worker file to public folder
 * This ensures the worker is served locally for better reliability
 * 
 * Run this script after npm install:
 * node scripts/copy-pdf-worker.js
 */

const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '..', 'public');
const destFileName = 'pdf.worker.min.js'; // Always copy as .js (browser expects .js)
const destPath = path.join(destDir, destFileName);

// Try multiple possible locations for the worker file
// Priority: react-pdf's pdfjs-dist first (must match react-pdf's version!)
const possiblePaths = [
  // react-pdf's pdfjs-dist (MUST USE THIS - version matches react-pdf)
  // Check both .js and .mjs extensions
  path.join(__dirname, '..', 'node_modules', 'react-pdf', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, '..', 'node_modules', 'react-pdf', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  // Direct pdfjs-dist (fallback, but may have version mismatch)
  path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js'),
  path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
];

let sourcePath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    sourcePath = possiblePath;
    break;
  }
}

try {
  // Check if source file exists
  if (!sourcePath) {
    console.error('Error: Worker file not found in any expected location:');
    possiblePaths.forEach(p => console.log(`  - ${p}`));
    console.log('\nTrying to find worker file in node_modules...');
    
    // Try to find it recursively
    const findWorker = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            const found = findWorker(fullPath);
            if (found) return found;
          } else if (file.includes('worker') && file.endsWith('.js')) {
            return fullPath;
          }
        }
      } catch (e) {
        // Ignore errors
      }
      return null;
    };
    
    const found = findWorker(path.join(__dirname, '..', 'node_modules', 'pdfjs-dist'));
    if (found) {
      sourcePath = found;
      console.log(`Found worker at: ${found}`);
    } else {
      console.error('\nMake sure pdfjs-dist is installed: npm install');
      process.exit(1);
    }
  }

  // Create public directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the file (always as .js even if source is .mjs)
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✓ Successfully copied PDF.js worker to ${destPath}`);
  console.log(`  Source: ${sourcePath}`);
  console.log(`  Destination: ${destPath}`);
  
  // Verify file was copied
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
  
  // Try to detect version from the file (check first few lines for version info)
  try {
    const workerContent = fs.readFileSync(destPath, 'utf8').substring(0, 500);
    const versionMatch = workerContent.match(/pdfjs-dist@(\d+\.\d+\.\d+)/) || 
                         workerContent.match(/version["\s:=]+(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      console.log(`  Detected worker version: ${versionMatch[1]}`);
    }
  } catch (e) {
    // Ignore version detection errors
  }
  
  console.log('  ✓ Worker ready to use: pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"');
} catch (error) {
  console.error('Error copying PDF.js worker:', error.message);
  process.exit(1);
}
