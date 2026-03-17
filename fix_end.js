const fs = require('fs');
const file = 'src/components/MemberCard.jsx';
let content = fs.readFileSync(file, 'utf8');

const endRegex = /\}\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};/m;
const match = content.match(endRegex);

if (match) {
    content = content.replace(endRegex, '}\n                    )}\n                </div>\n            </div>\n        </div>\n    </div>\n    );\n};');
    fs.writeFileSync(file, content);
    console.log("Fixed main closing tags.");
} else {
    console.log("Regex didn't match.");
}
