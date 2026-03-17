const fs = require('fs');
const content = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines[141]);
