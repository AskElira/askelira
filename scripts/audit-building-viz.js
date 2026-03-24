#!/usr/bin/env node
/**
 * Audit Script for Building Visualization
 *
 * Checks all new files and integrations for the animated building visualization
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Auditing Building Visualization Integration...\n');

const checks = [];
let passed = 0;
let failed = 0;

// Helper to check file exists
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  checks.push({ description, passed: exists, path: filePath });
  if (exists) {
    passed++;
    console.log(`✅ ${description}`);
  } else {
    failed++;
    console.log(`❌ ${description} - File not found: ${filePath}`);
  }
  return exists;
}

// Helper to check file contains text
function checkFileContains(filePath, searchText, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    failed++;
    console.log(`❌ ${description} - File not found: ${filePath}`);
    return false;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const contains = content.includes(searchText);
  checks.push({ description, passed: contains, path: filePath });
  if (contains) {
    passed++;
    console.log(`✅ ${description}`);
  } else {
    failed++;
    console.log(`❌ ${description} - Text not found in ${filePath}`);
  }
  return contains;
}

console.log('📦 Core Files:');
console.log('─'.repeat(60));
checkFile('components/AnimatedBuilding3D.tsx', 'AnimatedBuilding3D component exists');
checkFile('lib/socket-emitter.ts', 'Socket emitter utilities exist');
checkFile('server.js', 'Custom server with Socket.io exists');
checkFile('BUILDING_VISUALIZATION.md', 'Documentation exists');

console.log('\n🔌 API Routes:');
console.log('─'.repeat(60));
checkFile('app/api/building/simulate-activity/route.ts', 'Simulation API exists');

console.log('\n🔗 Integration:');
console.log('─'.repeat(60));
checkFileContains(
  'app/buildings/[goalId]/page.tsx',
  'AnimatedBuilding3D',
  'Building page imports 3D component'
);
checkFileContains(
  'app/buildings/[goalId]/page.tsx',
  'show3DView',
  'Building page has 3D view toggle'
);
checkFileContains(
  'package.json',
  '"dev": "node server.js"',
  'Package.json uses custom server'
);

console.log('\n📚 Dependencies:');
console.log('─'.repeat(60));
checkFileContains('package.json', '@react-three/fiber', 'React Three Fiber installed');
checkFileContains('package.json', '@react-three/drei', 'Drei helpers installed');
checkFileContains('package.json', 'socket.io', 'Socket.io installed');
checkFileContains('package.json', 'three', 'Three.js installed');

console.log('\n🎨 Event System:');
console.log('─'.repeat(60));
checkFileContains('lib/events.ts', 'BUILDING_EVENTS', 'Building events defined');
checkFileContains('lib/events.ts', 'AGENT_ACTION', 'Agent action event exists');
checkFileContains('hooks/useBuilding.ts', 'socket.io-client', 'useBuilding hook uses Socket.io');

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✨ All checks passed! The building visualization is ready.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Navigate to a building page');
  console.log('  3. Click "Show 3D Building"');
  console.log('  4. Test with: curl "http://localhost:3000/api/building/simulate-activity?goalId=test-id"\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the errors above.\n');
  process.exit(1);
}
