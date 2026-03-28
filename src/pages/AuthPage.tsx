import React from "react";
import { useAuth } from "../providers/AuthProvider";
import { signIn } from "../firebase";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const AuthPage: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl shadow-zinc-400 rotate-3 hover:rotate-0 transition-transform duration-500">
        <ShieldCheck className="text-white w-12 h-12" />
      </div>
      <h1 className="text-5xl font-display font-bold tracking-tight mb-4 text-zinc-900">Sera</h1>
      <p className="text-zinc-500 max-w-sm mb-12 text-lg leading-relaxed">
        The administrative burden of everyday life, handled by your trusted AI operator.
      </p>
      
      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={signIn} 
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-200 hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Get Started with Google
          <ArrowRight size={20} />
        </button>
        <p className="text-xs text-zinc-400 px-8">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>

      <div className="mt-24 grid grid-cols-3 gap-8 max-w-2xl opacity-40 grayscale">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2">Appointments</p>
          <div className="h-1 bg-zinc-200 rounded-full" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2">Documents</p>
          <div className="h-1 bg-zinc-200 rounded-full" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2">Cases</p>
          <div className="h-1 bg-zinc-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};
