import fs from 'fs';
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');

// The line we want to replace
const originalString = "                                ₹{currentBreakdown.total.toFixed(0)} spent out of pocket";
const re = new RegExp(originalString);

if (re.test(content)) {
    const replacementString = "                                ₹{(variableBreakdown.total + fixedBreakdown.total).toFixed(0)} total spent";
    content = content.replace(re, replacementString);
    fs.writeFileSync('src/components/MemberCard.jsx', content);
    console.log("Replaced text");
} else {
    console.log("NOT FOUND");
}
