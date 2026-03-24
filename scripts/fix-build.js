#!/usr/bin/env node
/**
 * Fix Build Issues Script
 *
 * Addresses common build problems with the visualization system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing potential build issues...\n');

// Check for common issues
const fixes = [];

// Fix 1: Ensure .next directory is clean
try {
  const nextDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextDir)) {
    console.log('🗑️  Removing .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
    fixes.push('Cleaned .next directory');
  }
} catch (error) {
  console.log('⚠️  Could not clean .next directory:', error.message);
}

// Fix 2: Check node_modules
try {
  const nodeModules = path.join(__dirname, '..', 'node_modules');
  const requiredPackages = [
    '@react-three/fiber',
    '@react-three/drei',
    'three',
    'socket.io',
    'socket.io-client',
  ];

  console.log('📦 Checking required packages...');
  let missing = [];
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(nodeModules, pkg);
    if (!fs.existsSync(pkgPath)) {
      missing.push(pkg);
    }
  }

  if (missing.length > 0) {
    console.log('⚠️  Missing packages:', missing.join(', '));
    console.log('📥 Installing missing packages...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    fixes.push('Installed missing packages');
  } else {
    console.log('✅ All required packages are installed');
  }
} catch (error) {
  console.log('⚠️  Could not check packages:', error.message);
}

// Fix 3: Create .env.local if it doesn't exist
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env.local...');
    const envContent = `# Building Visualization Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
PORT=3000
`;
    fs.writeFileSync(envPath, envContent);
    fixes.push('Created .env.local');
  }
} catch (error) {
  console.log('⚠️  Could not create .env.local:', error.message);
}

// Fix 4: Verify TypeScript configuration
try {
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (!tsconfig.compilerOptions.jsx) {
      console.log('⚠️  tsconfig.json might need jsx configuration');
    }
  }
} catch (error) {
  console.log('⚠️  Could not verify TypeScript config:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log(`\n✨ Applied ${fixes.length} fixes:\n`);
fixes.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));

console.log('\n📋 Recommendations:\n');
console.log('  For Development:');
console.log('    npm run dev');
console.log('');
console.log('  For Production Build:');
console.log('    NODE_OPTIONS="--max-old-space-size=4096" npm run build');
console.log('');
console.log('  For Vercel Deployment:');
console.log('    - Update vercel.json buildCommand if needed');
console.log('    - Set environment variables in Vercel dashboard');
console.log('    - Note: Socket.io requires separate deployment\n');
