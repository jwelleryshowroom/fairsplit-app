const fs = require('fs');
const content = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');
const lines = content.split('\n');

const res = lines.findIndex(a => a.includes('} spent out of pocket'));
if(res !== -1) {
    console.log("FOUND AT " + res, lines[res]);
} else if (lines.findIndex(a => a.includes('total spent')) !== -1) {
    let ix = lines.findIndex(a => a.includes('total spent'));
    console.log("FOUND NEW TOTAL AT " + ix, lines[ix]);
}
