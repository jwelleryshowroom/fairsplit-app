const fs = require('fs');
let code = fs.readFileSync('src/components/MemberCard.jsx', 'utf8');

const replacement = `            </div>
        </div>

        {/* Advanced Arrears Section */}
        {showAdvanced && (
            <div className="mt-6 pt-6 border-t-2 border-slate-50 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                    <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Carry Forward Arrears {emoji('📉')}</label>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-800">₹</span>
                            <input
                                type="number"
                                value={member.arrears || ''}
                                onChange={(e) => updateMember(member.id, 'arrears', e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent border-b-2 border-amber-200 outline-none w-32 font-black text-amber-900 placeholder-amber-200"
                            />
                            <p className="text-[10px] text-amber-600 italic">+ for credit, - for debt</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAdvanced(false)} className="text-amber-400 p-2"><X className="w-4 h-4" /></button>
                </div>
            </div>
        )}

        {/* Detailed Breakdown Section */}
        {showDetails && (
            <div className="mt-4 pt-4 border-t-2 border-slate-50 border-dashed animate-in slide-in-from-top-2">
                <div className="flex flex-wrap gap-2">
                    {currentBreakdown.items.length > 0 ? (
                        currentBreakdown.items.map((val, i) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-600 border border-slate-100">
                                ₹{val}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-300 italic font-medium">No individual entries yet...</span>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default MemberCard;
`;

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes('{/* Advanced Arrears Section */}')) - 1; // get the div before it
if (startIdx > -1) {
    const newCode = lines.slice(0, startIdx).join('\n') + '\n' + replacement;
    fs.writeFileSync('src/components/MemberCard.jsx', newCode);
    console.log("Patched successfully");
} else {
    console.log("Could not find start index");
}
