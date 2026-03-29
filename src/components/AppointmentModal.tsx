import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { createAppointment } = useAppointments();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [provider, setProvider] = useState('');
  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState('medical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !provider.trim()) return;

    setIsSubmitting(true);
    try {
      const appointmentDate = new Date(`${date}T${time}`);
      await createAppointment({
        title,
        notes: description,
        location,
        provider,
        date: Timestamp.fromDate(appointmentDate),
        type: type as any,
      });
      toast.success('Event scheduled. Sera will keep track of the details for you.');
      onClose();
      setTitle('');
      setDescription('');
      setLocation('');
      setProvider('');
    } catch (error) {
      toast.error('We encountered an issue scheduling your event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <h2 className="text-2xl font-display font-bold text-zinc-900">New Event</h2>
                <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  autoFocus
                  placeholder="Event Title"
                  className="w-full text-xl font-bold placeholder:text-zinc-300 border-none focus:ring-0 p-0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Description..."
                  className="w-full text-zinc-500 placeholder:text-zinc-300 border-none focus:ring-0 p-0 resize-none h-20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Provider (e.g. Dr. Smith)"
                    className="w-full text-zinc-500 placeholder:text-zinc-300 border-none focus:ring-0 p-0"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                  <input
                    placeholder="Location"
                    className="w-full text-zinc-500 placeholder:text-zinc-300 border-none focus:ring-0 p-0"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/5"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Time</label>
                  <input
                    type="time"
                    className="w-full bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/5"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/5"
                >
                  <option value="medical">Medical</option>
                  <option value="school">School</option>
                  <option value="legal">Legal</option>
                  <option value="financial">Financial</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
