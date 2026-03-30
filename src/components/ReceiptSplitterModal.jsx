import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Check, Loader2, Sparkles, AlertCircle, UploadCloud, Scissors, Users } from 'lucide-react';
import { parseReceiptImage } from '../services/ai';
import Modal from './Modal';
import { useSettings } from '../context/SettingsContext';
import { parseAIError } from '../utils/errorParser';

const ReceiptSplitterModal = ({ isOpen, onClose, members, onConfirmSplits }) => {
    const { settings } = useSettings();
    const [imageStr, setImageStr] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');
    const [itemAssignments, setItemAssignments] = useState({});
    const [payerId, setPayerId] = useState('');

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const emoji = (e) => settings.showEmojis ? e : '';

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleFile = (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size shouldn't exceed 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            setImageStr(base64String);
            processImage(base64String, file.type);
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (!isOpen || isAnalyzing || imageStr) return;
        const handlePaste = (e) => {
            if (e.clipboardData && e.clipboardData.items) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
                        const file = e.clipboardData.items[i].getAsFile();
                        handleFile(file);
                        e.preventDefault();
                        break;
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, isAnalyzing, imageStr]);

    const processImage = async (base64String, mimeType) => {
        setIsAnalyzing(true);
        setError('');
        setExtractedData(null);
        setItemAssignments({});
        try {
            const data = await parseReceiptImage(base64String, mimeType, (msg) => console.log(msg));
            if (!data || !data.items || !Array.isArray(data.items)) {
                console.error("AI Response invalid:", data);
                throw new Error("Could not detect items in the receipt.");
            }
            const initialAssignments = {};
            const allMemberIds = members.map(m => m.id.toString());
            data.items.forEach((item, index) => {
                initialAssignments[index] = [...allMemberIds];
            });
            setItemAssignments(initialAssignments);
            setExtractedData(data);
        } catch (err) {
            console.error(err);
            setError(parseAIError(err, 'receipt'));
            setImageStr(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleAssignment = (itemIndex, memberId) => {
        const mId = memberId.toString();
        setItemAssignments(prev => {
            const current = prev[itemIndex] || [];
            if (current.includes(mId)) {
                return { ...prev, [itemIndex]: current.filter(id => id !== mId) };
            } else {
                return { ...prev, [itemIndex]: [...current, mId] };
            }
        });
    };

    const splitItemRow = (index) => {
        if (!extractedData || !extractedData.items) return;
        const items = [...extractedData.items];
        const itemToSplit = items[index];
        const qty = parseInt(itemToSplit.qty);
        if (isNaN(qty) || qty <= 1) return;
        const totalRowPrice = parseFloat(itemToSplit.price) || 0;
        const individualPrice = (totalRowPrice / qty).toFixed(2);
        items.splice(index, 1);
        const newItemsToInsert = [];
        for (let i = 0; i < qty; i++) {
            newItemsToInsert.push({
                ...itemToSplit,
                name: `${itemToSplit.name} (${i + 1} of ${qty})`,
                qty: 1,
                price: individualPrice
            });
        }
        items.splice(index, 0, ...newItemsToInsert);
        const currentAssignments = { ...itemAssignments };
        const newAssignments = {};
        for (let i = 0; i < index; i++) {
            if (currentAssignments[i]) newAssignments[i] = currentAssignments[i];
        }
        const originalAssignment = currentAssignments[index] || [];
        for (let i = 0; i < qty; i++) {
            newAssignments[index + i] = [...originalAssignment];
        }
        const shiftAmt = qty - 1;
        Object.keys(currentAssignments).forEach(key => {
            const numKey = parseInt(key);
            if (numKey > index) {
                newAssignments[numKey + shiftAmt] = currentAssignments[numKey];
            }
        });
        setExtractedData({ ...extractedData, items });
        setItemAssignments(newAssignments);
    };

    const handleConfirm = () => {
        if (!payerId) {
            setError("Please select who paid the bill.");
            return;
        }
        setError("");
        const memberFoodTotals = {};
        members.forEach(m => memberFoodTotals[m.id.toString()] = 0);
        let assignedSubtotal = 0;
        extractedData.items.forEach((item, index) => {
            const assignedIds = itemAssignments[index] || [];
            if (assignedIds.length === 0) return;
            const lineItemCost = parseFloat(item.price) || 0;
            const splitCost = lineItemCost / assignedIds.length;
            assignedIds.forEach(id => {
                const sId = id.toString();
                if (memberFoodTotals[sId] !== undefined) {
                    memberFoodTotals[sId] += splitCost;
                    assignedSubtotal += splitCost;
                }
            });
        });
        const totalTax = parseFloat(extractedData.taxAndTip) || 0;
        const generatedSplits = [];
        members.forEach(m => {
            const mId = m.id.toString();
            const foodShare = memberFoodTotals[mId];
            if (foodShare <= 0) return;
            const taxShare = assignedSubtotal > 0
                ? (foodShare / assignedSubtotal) * totalTax
                : (totalTax / members.filter(mx => memberFoodTotals[mx.id.toString()] > 0).length);
            const totalForPerson = foodShare + taxShare;
            if (mId !== payerId.toString()) {
                generatedSplits.push({
                    id: Date.now() + Math.random(),
                    payerId: payerId.toString(),
                    amount: parseFloat(totalForPerson.toFixed(2)),
                    involvedIds: [m.id.toString()],
                    description: `Receipt: Food (₹${foodShare.toFixed(2)}) + Tax (₹${taxShare.toFixed(2)})`
                });
            }
        });
        onConfirmSplits(generatedSplits);
        handleReset();
    };

    const handleReset = () => {
        setImageStr(null);
        setExtractedData(null);
        setItemAssignments({});
        setError('');
        setPayerId('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleReset}
            title={`Receipt Scanner ${emoji('🧾')}`}
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col gap-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border-2 border-red-100 flex items-center gap-3 animate-pulse">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                    </div>
                )}

                {/* Upload & Capture Section */}
                {!imageStr && !isAnalyzing && (
                    <div className="flex flex-col sm:flex-row gap-4 h-full">
                        <div
                            className="flex-1 border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 sm:p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            <div className="bg-slate-50 p-6 rounded-3xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <UploadCloud className="w-12 h-12 text-slate-300 group-hover:text-white" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Upload Receipt</h4>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">
                                Choose an image or simply <b>Cmd+V</b> to paste from clipboard. {emoji('✨')}
                            </p>
                        </div>

                        {/* Mobile Camera Capture */}
                        <div
                            className="sm:hidden flex-1 border-4 border-indigo-100 bg-indigo-50/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                            <div className="bg-indigo-600 text-white p-6 rounded-3xl mb-6 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-all">
                                <Camera className="w-12 h-12" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Capture {emoji('📸')}</h4>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium">
                                Use camera to scan directly.
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <div className="relative mb-6">
                            <Sparkles className="w-16 h-16 text-indigo-400 animate-pulse" />
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest animate-pulse">Analyzing Receipt...</h4>
                        <p className="text-xs text-slate-400 mt-2 font-bold">Extracting items & parsing prices</p>
                    </div>
                )}

                {/* Extracted Data View */}
                {extractedData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

                        {/* Control: Who Paid */}
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Payer</label>
                                    <select
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                                        value={payerId}
                                        onChange={(e) => setPayerId(e.target.value)}
                                    >
                                        <option value="">Who paid?</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id.toString()}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="text-right w-full md:w-auto">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tax & Tip {emoji('📈')}</p>
                                <p className="text-2xl font-black text-emerald-600 font-mono">₹{(parseFloat(extractedData.taxAndTip) || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Items Matrix */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mapping Items</h3>
                            {extractedData.items.map((item, index) => {
                                const assigned = itemAssignments[index] || [];
                                const rawPrice = parseFloat(item.price) || 0;
                                const splitPrice = assigned.length > 0 ? (rawPrice / assigned.length).toFixed(2) : rawPrice.toFixed(2);

                                return (
                                    <div key={index} className={`bg-white rounded-[2rem] p-6 border-2 transition-all ${assigned.length === 0 ? 'border-red-100 bg-red-50/20' : 'border-slate-50 hover:border-indigo-100'}`}>
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            <div className="flex-1">
                                                <h5 className="font-black text-slate-800 text-lg leading-tight mb-2">{item.name}</h5>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl text-sm font-mono">₹{rawPrice.toFixed(2)}</span>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Qty: {item.qty || 1}</span>
                                                    {parseInt(item.qty) > 1 && (
                                                        <button
                                                            onClick={() => splitItemRow(index)}
                                                            className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                                                        >
                                                            <Scissors className="w-3 h-3" /> Split
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-[2] flex flex-wrap gap-2">
                                                {members.map(m => {
                                                    const isSelected = assigned.includes(m.id.toString());
                                                    return (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => toggleAssignment(index, m.id)}
                                                            className={`min-w-[80px] h-14 rounded-2xl border-2 flex flex-col items-center justify-center px-3 transition-all active:scale-95 ${isSelected
                                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <span className="text-[10px] font-black truncate w-full text-center uppercase">{m.name.split(' ')[0]}</span>
                                                            {isSelected && <span className="text-[9px] font-mono opacity-80 mt-0.5">₹{splitPrice}</span>}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Confirmation Footer */}
                        <div className="flex gap-4 pt-6">
                            <button onClick={handleReset} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-xs">Reset Scanner</button>
                            <button
                                onClick={handleConfirm}
                                className="flex-[2] bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Check className="w-6 h-6" /> Generate Splits {emoji('💸')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ReceiptSplitterModal;
