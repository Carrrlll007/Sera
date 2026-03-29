import React, { useState } from "react";
import { useAppointments } from "../hooks/useAppointments";
import { Appointment, AppointmentState } from "../types";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { cn } from "../utils/cn";
import { AppointmentModal } from "../components/AppointmentModal";
import { VALID_APPOINTMENT_TRANSITIONS } from "../constants/appointmentWorkflow";

export const CalendarPage: React.FC = () => {
  const { appointments, updateAppointmentState, toggleChecklistItem } = useAppointments();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const selectedDayAppointments = appointments.filter(app => 
    isSameDay(app.date.toDate(), selectedDate)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Calendar</h1>
          <p className="text-zinc-500">Appointments, deadlines, and follow-ups.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
        >
          <Plus size={20} />
          New Event
        </button>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialDate={selectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-zinc-900">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dayAppointments = appointments.filter(app => isSameDay(app.date.toDate(), day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative h-24 p-2 rounded-2xl transition-all border group",
                    isSelected ? "bg-zinc-900 border-zinc-900 shadow-xl shadow-zinc-200" : "bg-white border-transparent hover:border-zinc-200",
                    !isCurrentMonth && !isSelected && "opacity-30"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold block mb-1",
                    isSelected ? "text-white" : isToday(day) ? "text-zinc-900" : "text-zinc-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((app, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate",
                          isSelected ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-600"
                        )}
                      >
                        {app.title}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className={cn("text-[8px] font-bold pl-1", isSelected ? "text-white/50" : "text-zinc-400")}>
                        + {dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>

                  {isToday(day) && !isSelected && (
                    <div className="absolute top-2 right-2 w-1 h-1 bg-zinc-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm sticky top-28">
            <div className="mb-8">
              <h3 className="text-2xl font-display font-bold text-zinc-900 mb-1">{format(selectedDate, 'EEEE')}</h3>
              <p className="text-zinc-500 font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>

            <div className="space-y-6">
              {selectedDayAppointments.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="text-zinc-300" size={24} />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium px-6">
                    Your schedule is open. Use the calendar to visualize deadlines, appointments, and follow-ups.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {selectedDayAppointments.map((app) => (
                    <div key={app.id} className="space-y-4">
                      <div className="p-5 bg-zinc-50 rounded-[2rem] group relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-900 rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                              {app.type}
                            </span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                            app.state === 'needs-confirmation' ? "bg-amber-100 text-amber-600" :
                            app.state === 'completed' ? "bg-green-100 text-green-600" :
                            "bg-zinc-200 text-zinc-600"
                          )}>
                            {app.state.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-zinc-900 mb-4">{app.title}</h4>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Clock size={14} />
                            <span className="text-xs font-medium">{format(app.date.toDate(), 'h:mm a')}</span>
                          </div>
                          {app.location && (
                            <div className="flex items-center gap-2 text-zinc-500">
                              <MapPin size={14} />
                              <span className="text-xs font-medium">{app.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-zinc-500">
                            <User size={14} />
                            <span className="text-xs font-medium">{app.provider}</span>
                          </div>
                        </div>

                        {/* Status Transitions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200/50">
                          {VALID_APPOINTMENT_TRANSITIONS[app.state]?.map((nextState) => (
                            <button
                              key={nextState}
                              onClick={() => updateAppointmentState(app.id, nextState)}
                              className="text-[10px] font-bold bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white transition-all"
                            >
                              Mark {nextState.replace(/-/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sera's Recommendation */}
                      {app.metadata?.nextRecommendedAction && (
                        <div className="p-4 bg-zinc-900 text-white rounded-2xl flex gap-3 items-start">
                          <Sparkles size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                              {app.metadata.nextRecommendedAction}
                            </p>
                            {app.state === 'completed' && !app.metadata.followUpTaskId && (
                              <button className="text-[10px] font-bold text-white flex items-center gap-1 hover:gap-2 transition-all">
                                Generate follow-up plan <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Checklist */}
                      {app.checklist && app.checklist.length > 0 && (
                        <div className="space-y-3 px-2">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {app.state === 'completed' || app.state === 'follow-up-needed' ? 'Follow-up Actions' : 'Preparation Checklist'}
                          </h5>
                          <div className="space-y-2">
                            {app.checklist
                              .filter(item => (app.state === 'completed' || app.state === 'follow-up-needed') ? item.type === 'follow-up' : item.type === 'prep')
                              .map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => toggleChecklistItem(app.id, item.id, !item.isCompleted)}
                                  className="flex items-center gap-3 w-full text-left group"
                                >
                                  {item.isCompleted ? (
                                    <CheckCircle2 size={16} className="text-zinc-900" />
                                  ) : (
                                    <Circle size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                                  )}
                                  <span className={cn(
                                    "text-xs font-medium transition-colors",
                                    item.isCompleted ? "text-zinc-400 line-through" : "text-zinc-600"
                                  )}>
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all mt-8 shadow-xl shadow-zinc-200"
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Removed local cn function as it's now imported from ../lib/utils
