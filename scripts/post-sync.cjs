const fs = require('fs');
const path = require('path');

const gradlePath = path.join('android', 'app', 'capacitor.build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  content = content.replace(/VERSION_21/g, 'VERSION_17');
  fs.writeFileSync(gradlePath, content);
  console.log('✓ Fixed VERSION_21 → VERSION_17');
}

const variablesPath = path.join('android', 'variables.gradle');
if (fs.existsSync(variablesPath)) {
  let content = fs.readFileSync(variablesPath, 'utf8');
  content = content.replace(/minSdkVersion = 24/g, 'minSdkVersion = 26');
  fs.writeFileSync(variablesPath, content);
  console.log('✓ Fixed minSdkVersion 24 → 26');
}

console.log('Post-sync fixes completed');
