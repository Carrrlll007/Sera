import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { taskService } from "../services/taskService";
import { Task, TaskStatus, Priority } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  User,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isPast } from "date-fns";

export const TasksPage: React.FC = () => {
  const { household, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    if (!household) return;
    return taskService.subscribeToHouseholdTasks(household.id, setTasks);
  }, [household]);

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  const toggleTask = async (task: Task) => {
    await taskService.updateTask(task.id!, { 
      status: task.status === 'completed' ? 'pending' : 'completed' 
    });
  };

  const priorityColors: Record<Priority, string> = {
    "low": "bg-zinc-100 text-zinc-500",
    "medium": "bg-blue-50 text-blue-600",
    "high": "bg-amber-50 text-amber-600",
    "urgent": "bg-red-50 text-red-600"
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Tasks</h1>
          <p className="text-zinc-500">Your structured view of active responsibilities.</p>
        </div>
        <button className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
          <Plus size={20} />
          Add Task
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-[2rem] border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-zinc-50 rounded-2xl w-full md:w-auto">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Pending" />
          <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')} label="Completed" />
        </div>
        <div className="relative w-full md:w-64 px-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="w-full bg-zinc-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-20 text-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-zinc-300" size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">All caught up</h3>
            <p className="text-zinc-500 max-w-xs mx-auto">
              You have no {filter !== 'all' ? filter : ''} tasks at the moment. Enjoy the calm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={() => toggleTask(task)}
                  priorityColor={priorityColors[task.priority]}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onToggle, priorityColor }: any) => {
  const isDone = task.status === 'completed';
  const dueDate = task.dueDate?.toDate();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "group flex items-center gap-4 p-5 bg-white border rounded-[2rem] transition-all duration-300",
        isDone ? "border-zinc-50 opacity-60" : "border-zinc-100 hover:border-zinc-300 hover:shadow-md"
      )}
    >
      <button 
        onClick={onToggle}
        className={cn(
          "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
          isDone ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100"
        )}
      >
        {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className={cn("font-bold text-zinc-900 truncate", isDone && "line-through text-zinc-400")}>
            {task.title}
          </h4>
          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0", priorityColor)}>
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {dueDate && (
            <div className={cn(
              "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
              isPast(dueDate) && !isDone ? "text-red-500" : "text-zinc-400"
            )}>
              <CalendarIcon size={12} />
              {isToday(dueDate) ? "Today" : isTomorrow(dueDate) ? "Tomorrow" : format(dueDate, 'MMM d')}
            </div>
          )}
          {task.type !== 'general' && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="w-1 h-1 bg-zinc-300 rounded-full" />
              {task.type}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </motion.div>
  );
};

const FilterButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-6 py-2 rounded-xl text-xs font-bold transition-all",
      active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
    )}
  >
    {label}
  </button>
);

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
