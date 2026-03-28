import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { appointmentService } from "../services/appointmentService";
import { Appointment } from "../types";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  MoreVertical
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

export const CalendarPage: React.FC = () => {
  const { household } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!household) return;
    return appointmentService.subscribeToHouseholdAppointments(household.id, setAppointments);
  }, [household]);

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
        <button className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
          <Plus size={20} />
          New Event
        </button>
      </div>

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
                  <p className="text-sm text-zinc-400 font-medium">No events scheduled for this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayAppointments.map((app) => (
                    <div key={app.id} className="p-5 bg-zinc-50 rounded-[2rem] group relative">
                      <button className="absolute top-4 right-4 p-1 text-zinc-300 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={16} />
                      </button>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-zinc-900 rounded-full" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {app.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-zinc-900 mb-4">{app.title}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Clock size={14} />
                          <span className="text-xs font-medium">10:00 AM</span>
                        </div>
                        {app.location && (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <MapPin size={14} />
                            <span className="text-xs font-medium">{app.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-zinc-500">
                          <User size={14} />
                          <span className="text-xs font-medium">Household Shared</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all mt-8 shadow-xl shadow-zinc-200">
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
