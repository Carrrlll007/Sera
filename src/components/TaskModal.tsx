import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { Priority, TaskType } from '../types';
import { toast } from 'sonner';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [type, setType] = useState<TaskType>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title,
        description,
        priority,
        type,
        status: 'pending',
      });
      toast.success('Task added. It’s now off your mind and on your list.');
      onClose();
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error('We encountered an issue adding your task. Please try again.');
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
                <h2 className="text-2xl font-display font-bold text-zinc-900">New Task</h2>
                <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  autoFocus
                  placeholder="What needs to be done?"
                  className="w-full text-xl font-bold placeholder:text-zinc-300 border-none focus:ring-0 p-0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Add more details..."
                  className="w-full text-zinc-500 placeholder:text-zinc-300 border-none focus:ring-0 p-0 resize-none h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="bg-zinc-50 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2 focus:ring-2 focus:ring-zinc-900/5"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>

                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="bg-zinc-50 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2 focus:ring-2 focus:ring-zinc-900/5"
                >
                  <option value="other">General</option>
                  <option value="appointment">Appointment</option>
                  <option value="document">Document</option>
                  <option value="case">Case</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
