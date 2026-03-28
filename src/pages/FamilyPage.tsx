import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { householdService } from "../services/householdService";
import { HouseholdMember } from "../types";
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
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export const FamilyPage: React.FC = () => {
  const { household, user } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    if (!household) return;
    return householdService.subscribeToHouseholdMembers(household.id, setMembers);
  }, [household]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Family</h1>
          <p className="text-zinc-500">Shared household coordination and member management.</p>
        </div>
        <button className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
          <UserPlus size={20} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} isMe={member.uid === user?.uid} />
            ))}
            
            {/* Placeholder for inviting new members */}
            <button className="border-2 border-dashed border-zinc-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-zinc-200 hover:bg-zinc-50 transition-all group">
              <div className="w-12 h-12 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
                <UserPlus size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-900">Add a member</p>
                <p className="text-xs text-zinc-400">Partner, child, or caregiver</p>
              </div>
            </button>
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
                  <ActivityItem 
                    icon={<Heart size={12} />} 
                    text="Partner added a medical case" 
                    time="2h ago" 
                  />
                  <ActivityItem 
                    icon={<Baby size={12} />} 
                    text="Sera updated school schedule" 
                    time="5h ago" 
                  />
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

const MemberCard = ({ member, isMe }: any) => (
  <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm hover:border-zinc-300 transition-all group relative">
    <button className="absolute top-6 right-6 p-1 text-zinc-300 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100">
      <MoreVertical size={18} />
    </button>
    
    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition-colors">
        <User size={28} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-zinc-900">{member.name || "Family Member"}</h4>
          {isMe && <span className="px-2 py-0.5 bg-zinc-900 text-white text-[8px] font-bold uppercase tracking-widest rounded-full">You</span>}
        </div>
        <p className="text-xs text-zinc-400 font-medium capitalize">{member.role}</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <Clock size={12} />
        3 Active Tasks
      </div>
      <ChevronRight size={16} className="text-zinc-200 group-hover:text-zinc-900 transition-colors" />
    </div>
  </div>
);

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

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
