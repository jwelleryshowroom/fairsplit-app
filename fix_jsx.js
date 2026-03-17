const fs = require('fs');
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the problematic section around line 280 with properly closed JSX
const regex = /\{\/\* Actions & Inline Arrears Section \*\/\}([\s\S]*?)\{\/\* Detailed Breakdown Section \*\/\}/m;
const match = content.match(regex);

if (match) {
    let replaced = match[0].replace(/<\/button>\s*\}\s*<\/div>/, '</button>\n                        )}\n                    </div>');
    content = content.replace(regex, replaced);
    fs.writeFileSync(file, content);
    console.log("Replaced problematic brace.");
} else {
    console.log("Could not find section.");
}

// Ensure the main return block has all closing tags
const endRegex = /\{\/\* Detailed Breakdown Section \*\/\}([\s\S]*?)\);\s*\};/m;
const endMatch = content.match(endRegex);

if (endMatch) {
    const correctEnding = endMatch[1].replace(/<\/div>\s*<\/div>\s*$/, '                </div>\n            </div>\n        </div>\n    );\n};\n');
    content = content.replace(endMatch[1] + ');\n};\n', correctEnding);
    fs.writeFileSync(file, content);
    console.log("Fixed main closing tags.");
}

