const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function publish() {
  try {
    console.log('📦 Publishing POP MART Helper to npm...');
    
    // Read and increment version
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Increment patch version
    const versionParts = packageJson.version.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    const newVersion = versionParts.join('.');
    
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`📈 Version incremented to: ${newVersion}`);
    
    // Create dist directory
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }
    
    // Copy script.js to dist/ with version injection
    const scriptPath = path.join(__dirname, 'script.js');
    const distScriptPath = path.join(distDir, 'script.js');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error('script.js not found');
    }
    
    // Read the original script content
    const originalScript = fs.readFileSync(scriptPath, 'utf8');
    
    // Inject version information at the top
    const versionHeader = `// POP MART Helper v${newVersion} - Published ${new Date().toISOString()}\n// CDN: https://cdn.jsdelivr.net/npm/popmarthelper@${newVersion}/dist/script.js\nwindow.POP_MART_HELPER_VERSION = 'v${newVersion}';\n\n`;
    const scriptWithVersion = versionHeader + originalScript;
    
    // Write the modified script to dist
    fs.writeFileSync(distScriptPath, scriptWithVersion, 'utf8');
    console.log(`📄 Copied script.js to dist/ with version ${newVersion} header`);
    
    // Publish to npm
    console.log('🚀 Publishing to npm...');
    execSync('npm publish', { stdio: 'inherit' });
    
    console.log('✅ Published successfully!');
    console.log(`📦 Version: ${newVersion}`);
    console.log(`🌐 CDN URL: https://cdn.jsdelivr.net/npm/popmarthelper@${newVersion}/dist/script.js`);
    console.log(`🌐 Latest URL: https://cdn.jsdelivr.net/npm/popmarthelper@latest/dist/script.js`);
    console.log(`🔄 Purge here: https://www.jsdelivr.com/tools/purge`)
    console.log('\n🎉 Your bookmarklet will now load the latest version!');
    
  } catch (error) {
    console.error('❌ Publish failed:', error.message);
    process.exit(1);
  }
}

publish(); 