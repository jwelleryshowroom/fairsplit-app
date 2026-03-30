import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught application error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen font-sans bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-auto shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle className="w-8 h-8 drop-shadow-sm" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-3">Oops! Something snapped.</h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            The application encountered an unexpected error. Don't worry, your group data is safe!
                        </p>
                        
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl mb-6 text-left border border-slate-100 overflow-hidden">
                            <p className="text-[10px] font-mono text-slate-400 truncate w-full">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                        >
                            <RefreshCw className="w-5 h-5" /> Reload App
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
