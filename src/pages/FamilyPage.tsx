import React, { useState, useEffect } from "react";
import { useHousehold } from "../hooks/useHousehold";
import { taskService } from "../services/taskService";
import { timelineService } from "../services/timelineService";
import { Task, TimelineEvent, MemberRole } from "../types";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Mail, 
  ChevronRight,
  MoreVertical,
  Heart,
  Baby,
  User,
  Clock,
  FileText,
  Activity,
  Plus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/cn";
import { MemberModal } from "../components/MemberModal";
import { getRoleLabel, canManageMembers } from "../utils/permissions";

export const FamilyPage: React.FC = () => {
  const { 
    household, 
    members, 
    currentMember, 
    userRole, 
    isLoading, 
    addMember, 
    updateMemberRole, 
    removeMember 
  } = useHousehold();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!household) return;
    
    const unsubTasks = taskService.subscribeToHouseholdTasks(household.id, setTasks);
    const unsubTimeline = timelineService.subscribeToHouseholdTimeline(household.id, (events) => {
      setTimeline(events.slice(0, 5));
    });

    return () => {
      unsubTasks();
      unsubTimeline();
    };
  }, [household]);

  const getTaskCountForMember = (memberUid: string) => {
    return tasks.filter(t => (t.authorId === memberUid || t.assigneeId === memberUid) && t.status === 'pending').length;
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center animate-pulse">
          <Users className="text-white" size={24} />
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Sera is gathering your household...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Family</h1>
          <p className="text-zinc-500">Shared household coordination and member management.</p>
        </div>
        {canManageMembers(userRole) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
          >
            <UserPlus size={20} />
            Invite Member
          </button>
        )}
      </div>

      <MemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addMember}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => (
              <MemberCard 
                key={member.id} 
                member={member} 
                isMe={member.uid === currentMember?.uid} 
                taskCount={getTaskCountForMember(member.uid)}
                canManage={canManageMembers(userRole)}
                onUpdateRole={(role: MemberRole) => updateMemberRole(member.id, role)}
                onRemove={() => removeMember(member.id, member.uid)}
              />
            ))}
            
            {/* Placeholder for inviting new members */}
            {canManageMembers(userRole) && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-zinc-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-zinc-200 hover:bg-zinc-50 transition-all group"
              >
                <div className="w-12 h-12 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
                  <UserPlus size={24} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-zinc-900">Add a family member</p>
                  <p className="text-xs text-zinc-400">Partner, child, or caregiver</p>
                </div>
              </button>
            )}
          </div>

          <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-zinc-900">Household Settings</h3>
              <Settings size={20} className="text-zinc-400" />
            </div>
            
            <div className="space-y-2">
              <SettingsItem 
                icon={<Shield size={18} className="text-zinc-400" />} 
                title="Privacy & Permissions" 
                description="Control who can see documents and cases."
              />
              <SettingsItem 
                icon={<Mail size={18} className="text-zinc-400" />} 
                title="Notification Preferences" 
                description="Manage how Sera nudges family members."
              />
            </div>
          </div>
        </div>

        {/* Household Overview */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200 sticky top-28">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{household?.name || "Our Household"}</h3>
                <p className="text-xs text-zinc-400 font-medium">{members.length} Members</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Recent Activity</h4>
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">Your household is currently in a state of calm. No recent activity.</p>
                  ) : (
                    timeline.map((event) => (
                      <ActivityItem 
                        key={event.id}
                        icon={event.type === 'created' ? <Plus size={12} /> : event.type === 'status_change' ? <Activity size={12} /> : <FileText size={12} />} 
                        text={event.description} 
                        time={event.createdAt ? formatDistanceToNow(event.createdAt.toDate(), { addSuffix: true }) : 'Just now'} 
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sera coordinates tasks across the household, ensuring nothing falls through the cracks for any family member.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MemberCard = ({ member, isMe, taskCount, canManage, onUpdateRole, onRemove }: any) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm hover:border-zinc-300 transition-all group relative">
      {canManage && !isMe && (
        <div className="absolute top-6 right-6">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={18} />
          </button>
          
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl z-10 overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Change Role</p>
                  {(['admin', 'member', 'child', 'caregiver'] as MemberRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        onUpdateRole(role);
                        setShowOptions(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors",
                        member.role === role ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-600"
                      )}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                  <div className="border-t border-zinc-50 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onRemove();
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Remove Member
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition-colors">
          {member.photoURL ? (
            <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <User size={28} />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900">{member.displayName || "Family Member"}</h4>
            {isMe && <span className="px-2 py-0.5 bg-zinc-900 text-white text-[8px] font-bold uppercase tracking-widest rounded-full">You</span>}
          </div>
          <p className="text-xs text-zinc-400 font-medium capitalize">{getRoleLabel(member.role)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Clock size={12} />
          {taskCount} Active Tasks
        </div>
        <ChevronRight size={16} className="text-zinc-200 group-hover:text-zinc-900 transition-colors" />
      </div>
    </div>
  );
};

const SettingsItem = ({ icon, title, description }: any) => (
  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-all text-left group">
    <div className="shrink-0">{icon}</div>
    <div className="flex-1">
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      <p className="text-xs text-zinc-400">{description}</p>
    </div>
    <ChevronRight size={16} className="text-zinc-200 group-hover:text-zinc-900 transition-colors" />
  </button>
);

const ActivityItem = ({ icon, text, time }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center text-zinc-500">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-zinc-300 truncate">{text}</p>
      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{time}</p>
    </div>
  </div>
);

// Removed local cn function as it's now imported from ../lib/utils
