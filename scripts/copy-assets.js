import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function copyAssets() {
  console.log('Copying assets...');
  
  try {
    // Ensure dist directory exists
    await fs.ensureDir(path.join(projectRoot, 'dist'));
    
    // Copy package.json for version info
    await fs.copy(
      path.join(projectRoot, 'package.json'),
      path.join(projectRoot, 'dist', 'package.json')
    );
    
    console.log('✅ Assets copied successfully');
  } catch (error) {
    console.error('❌ Failed to copy assets:', error);
    process.exit(1);
  }
}

copyAssets();
