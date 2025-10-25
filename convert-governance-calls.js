const fs = require('fs');

// Read the test file
const filePath = 'test/integration-bulletproof-edge-cases.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match propose() calls with 5 parameters
// governance.connect(user).propose([target], [value], [sig], [data], "description")

const proposePattern = /governance\.connect\(([^)]+)\)\.propose\(\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*"([^"]+)"\s*\)/g;

// Replace with createProposal() calls
content = content.replace(proposePattern, (match, user, target, value, sig, data, desc) => {
  // createProposal(title, description, target, data)
  return `governance.connect(${user}).createProposal(
        "${desc}",
        "${desc}",
        ${target},
        ${data}
      )`;
});

// Also handle propose.staticCall pattern
const staticCallPattern = /governance\.connect\(([^)]+)\)\.propose\.staticCall\(\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*"([^"]+)"\s*\)/g;

content = content.replace(staticCallPattern, (match, user, target, value, sig, data, desc) => {
  return `governance.connect(${user}).createProposal.staticCall(
        "${desc}",
        "${desc}",
        ${target},
        ${data}
      )`;
});

// Write back
fs.writeFileSync(filePath, content);
console.log('✅ Converted all propose() calls to createProposal()');
