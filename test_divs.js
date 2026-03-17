const fs = require('fs');
const content = fs.readFileSync('src/components/ExpenseSplitter.jsx', 'utf8');

let depth = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let open = (line.match(/<div/g) || []).length;
    let close = (line.match(/<\/div/g) || []).length;
    
    // Ignore commented lines roughly
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;
    
    if (open > 0 || close > 0) {
        depth += (open - close);
        if (i > 1100 && i < 1300) {
            console.log(`L${i+1} [D:${depth}]: ${line.trim()}`);
        }
    }
}
