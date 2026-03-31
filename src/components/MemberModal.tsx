import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Baby, Heart } from 'lucide-react';
import { MemberRole } from '../types';
import { cn } from '../utils/cn';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { displayName: string; email: string; role: MemberRole; uid: string }) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [displayName, setDisplayName] = useState('');
  const [accountUid, setAccountUid] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !accountUid.trim()) return;

    setIsSubmitting(true);
    onAdd({ displayName: displayName.trim(), email: email.trim(), role, uid: accountUid.trim() });
    onClose();
    setDisplayName('');
    setAccountUid('');
    setEmail('');
    setRole('member');
    setIsSubmitting(false);
  };

  const roles: { id: MemberRole; icon: any; label: string; desc: string }[] = [
    { id: 'admin', icon: <Shield size={18} />, label: 'Admin', desc: 'Full access to household' },
    { id: 'member', icon: <User size={18} />, label: 'Member', desc: 'Standard adult access' },
    { id: 'child', icon: <Baby size={18} />, label: 'Child', desc: 'Limited view of own items' },
    { id: 'caregiver', icon: <Heart size={18} />, label: 'Caregiver', desc: 'Access to assigned care items' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-zinc-900">Add Existing Member</h2>
                <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  Add an existing Sera account to this household using that member&apos;s auth UID.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Full Name</label>
                  <input
                    autoFocus
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900/5"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sera Account UID</label>
                  <input
                    placeholder="e.g. 7f3c9a2d..."
                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900/5"
                    value={accountUid}
                    onChange={(e) => setAccountUid(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900/5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assign Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                        role === r.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-50 bg-zinc-50 text-zinc-600 hover:border-zinc-200"
                      )}
                    >
                      <div className={cn("shrink-0", role === r.id ? "text-white" : "text-zinc-400")}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{r.label}</p>
                        <p className={cn("text-[10px]", role === r.id ? "text-zinc-400" : "text-zinc-400")}>{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!displayName.trim() || !accountUid.trim() || isSubmitting}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Existing Member'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
