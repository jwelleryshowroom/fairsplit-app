const fs = require('fs');
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    const hasError = isDuplicate || isInvalid;
    const splitRegex = /[,\&+\\n]| and /i;`;
const replacement1 = `    const hasError = isDuplicate || isInvalid;
    const splitRegex = /[,\&+\\n]| and /i;`;

// Let me just regex replace the Absent logic out of Collapsible and into Identity Section.
