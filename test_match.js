const fs = require('fs');
const content = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');
const searchString = `                <div className="w-full">
                    <div className="flex items-center gap-3">
                        <div className={\`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm transition-transform duration-300 \${hasError ? 'bg-red-100 text-red-600' : 'bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-400 group-hover:scale-110 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white shadow-inner'}\`}>
                            {member.name.charAt(0).toUpperCase() || emoji('👤')}
                        </div>
                        <div className="flex-1 min-w-0">`;
console.log(content.includes(searchString));
