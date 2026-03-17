const fs = require('fs');
let code = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');

// I'm replacing lines 112 through 180 as per my instruction but ensuring no exact copy-paste matching failures.
// Let's rely on simple syntax replacement logic via block identification.

const searchRegex = /<\!\-\-\s*Collapsible Edit Area\s*\(\w+\s*on\s*Hover\)\s*\-\->[^]+?(?=\{\/\*\s*Expenses Section\s*\*\/\})/gmi;

