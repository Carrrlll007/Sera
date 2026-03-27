import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Users, 
  Settings, 
  Send, 
  Upload, 
  ChevronRight, 
  MoreVertical,
  Search,
  LayoutDashboard,
  MessageSquare,
  Bell,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db, signIn, signOut, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy,
  getDocs
} from "firebase/firestore";
import { parseUserIntent, extractDocumentData } from "./lib/gemini";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type TaskType = "appointment" | "document" | "case" | "other";
type TaskStatus = "pending" | "in-progress" | "completed" | "exception";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  dueDate?: any;
  priority: Priority;
  householdId: string;
  authorId: string;
  metadata?: any;
  createdAt: any;
}

interface Household {
  id: string;
  name: string;
  members: string[];
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-black text-white hover:bg-zinc-800",
      secondary: "bg-zinc-100 text-black hover:bg-zinc-200",
      ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100",
      danger: "bg-red-50 text-red-600 hover:bg-red-100"
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "error" }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    error: "bg-red-50 text-red-600"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "tasks" | "docs">("dashboard");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create household
        try {
          const q = query(collection(db, "households"), where("members", "array-contains", u.uid));
          const snap = await getDocs(q);
          if (snap.empty) {
            const newHousehold = {
              name: `${u.displayName || 'My'} Household`,
              members: [u.uid],
              createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "households"), newHousehold);
            setHousehold({ id: docRef.id, ...newHousehold } as any);
          } else {
            setHousehold({ id: snap.docs[0].id, ...snap.docs[0].data() } as any);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "households");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Tasks Listener
  useEffect(() => {
    if (!household) return;
    const q = query(
      collection(db, "tasks"), 
      where("householdId", "==", household.id),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "tasks");
    });
    return () => unsubscribe();
  }, [household]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !household) return;
    setIsProcessing(true);
    setError(null);
    const userMsg = message;
    setMessage("");

    try {
      const intent = await parseUserIntent(userMsg);
      await addDoc(collection(db, "tasks"), {
        ...intent,
        status: "pending",
        householdId: household.id,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      setError("Failed to process request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !household) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const data = await extractDocumentData(base64, file.type);
        
        // Add document to Firestore
        await addDoc(collection(db, "documents"), {
          name: file.name,
          type: data.type || file.type,
          url: "https://picsum.photos/seed/doc/200/300", // Placeholder for actual storage
          householdId: household.id,
          authorId: user.uid,
          metadata: data,
          createdAt: serverTimestamp()
        });

        // Create a task if deadlines are found
        if (data.deadlines && data.deadlines.length > 0) {
          await addDoc(collection(db, "tasks"), {
            title: `Review: ${file.name}`,
            description: data.summary || `Extracted from ${file.name}`,
            status: "pending",
            type: "document",
            priority: "medium",
            dueDate: data.deadlines[0],
            householdId: household.id,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Failed to process document.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Initializing Operator...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-8 shadow-xl rotate-3">
          <ShieldCheck className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Operator</h1>
        <p className="text-zinc-500 max-w-xs mb-8">
          The administrative burden of everyday life, handled by your trusted AI operator.
        </p>
        <Button onClick={signIn} className="w-full max-w-xs py-4 text-lg">
          Get Started with Google
        </Button>
        <p className="mt-8 text-xs text-zinc-400">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-50 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-white flex-col p-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Operator</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={<MessageSquare size={20} />} label="Intake" />
          <NavItem active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} icon={<Clock size={20} />} label="Tasks" />
          <NavItem active={activeTab === "docs"} onClick={() => setActiveTab("docs")} icon={<FileText size={20} />} label="Documents" />
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden">
              <img src={user.photoURL || ""} alt={user.displayName || ""} referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{household?.name}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start text-red-500 hover:bg-red-50">
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg capitalize">{activeTab}</h2>
            {isProcessing && <div className="w-2 h-2 bg-black rounded-full animate-ping ml-2" />}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-black transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="md:hidden w-8 h-8 rounded-full bg-zinc-100 overflow-hidden">
              <img src={user.photoURL || ""} alt={user.displayName || ""} referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pb-32">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-4xl mx-auto"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Pending Tasks" value={tasks.filter(t => t.status === 'pending').length} icon={<Clock className="text-amber-500" />} />
                  <StatCard label="In Progress" value={tasks.filter(t => t.status === 'in-progress').length} icon={<AlertCircle className="text-blue-500" />} />
                  <StatCard label="Completed" value={tasks.filter(t => t.status === 'completed').length} icon={<CheckCircle2 className="text-green-500" />} />
                </div>

                {/* Recent Tasks */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl">Active Workflows</h3>
                    <Button variant="ghost" onClick={() => setActiveTab("tasks")} className="text-sm">View All</Button>
                  </div>
                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <EmptyState icon={<LayoutDashboard />} title="No active tasks" description="Use the intake chat to delegate your first life-admin task." />
                    ) : (
                      tasks.slice(0, 5).map(task => (
                        <TaskItem key={task.id} task={task} onUpdate={updateTaskStatus} />
                      ))
                    )}
                  </div>
                </section>

                {/* Quick Actions */}
                <section>
                  <h3 className="font-bold text-xl mb-4">Quick Delegate</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QuickAction label="Book Appointment" icon={<Calendar />} onClick={() => { setActiveTab("chat"); setMessage("I need to book a dentist appointment for next Tuesday."); }} />
                    <QuickAction label="Upload Bill" icon={<FileText />} onClick={() => setActiveTab("docs")} />
                    <QuickAction label="Track Claim" icon={<AlertCircle />} onClick={() => { setActiveTab("chat"); setMessage("Help me track my insurance claim for the car repair."); }} />
                    <QuickAction label="Family Sync" icon={<Users />} onClick={() => { setActiveTab("chat"); setMessage("Sync my family calendar for the upcoming school events."); }} />
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col max-w-2xl mx-auto"
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="text-zinc-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">What's on your mind?</h3>
                  <p className="text-zinc-500 max-w-sm">
                    Tell me what you need help with. I can handle appointments, bills, claims, and more.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "tasks" && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-2xl">All Tasks</h3>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="text-xs">Filter</Button>
                    <Button variant="secondary" className="text-xs">Sort</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onUpdate={updateTaskStatus} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "docs" && (
              <motion.div 
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-2xl">Document Inbox</h3>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
                    <div className="bg-black text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-800 transition-all">
                      <Upload size={18} />
                      Upload
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.filter(t => t.type === 'document').length === 0 ? (
                    <EmptyState className="col-span-full" icon={<FileText />} title="No documents yet" description="Upload bills, insurance papers, or school forms to get started." />
                  ) : (
                    tasks.filter(t => t.type === 'document').map(doc => (
                      <Card key={doc.id} className="flex flex-col gap-3">
                        <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm truncate">{doc.title}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-2">{doc.description}</p>
                        </div>
                        <div className="mt-auto pt-2 border-t border-zinc-50 flex items-center justify-between">
                          <Badge variant="default">{doc.status}</Badge>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {doc.createdAt?.toDate ? format(doc.createdAt.toDate(), 'MMM d') : 'Just now'}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Intake Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent">
          <div className="max-w-2xl mx-auto relative">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-lg p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-black/5 transition-all">
              <button className="p-2 text-zinc-400 hover:text-black transition-colors">
                <Plus size={20} />
              </button>
              <input 
                type="text" 
                placeholder="Delegate a task..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSendMessage} 
                className="rounded-xl p-2 h-10 w-10" 
                disabled={!message.trim() || isProcessing}
              >
                {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
            {error && (
              <p className="absolute -top-8 left-0 right-0 text-center text-xs text-red-500 font-medium">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden h-16 border-t border-zinc-200 bg-white flex items-center justify-around px-2">
        <MobileNavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="Home" />
        <MobileNavItem active={activeTab === "chat"} onClick={() => setActiveTab("chat")} icon={<MessageSquare size={20} />} label="Intake" />
        <MobileNavItem active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} icon={<Clock size={20} />} label="Tasks" />
        <MobileNavItem active={activeTab === "docs"} onClick={() => setActiveTab("docs")} icon={<FileText size={20} />} label="Docs" />
      </nav>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active ? "bg-black text-white shadow-md" : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-1 transition-all",
        active ? "text-black" : "text-zinc-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-black/10 hover:shadow-md transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-xs font-bold text-center leading-tight">{label}</span>
    </button>
  );
}

function TaskItem({ task, onUpdate }: { task: Task; onUpdate: (id: string, status: TaskStatus) => void }) {
  const typeIcons = {
    appointment: <Calendar size={16} />,
    document: <FileText size={16} />,
    case: <AlertCircle size={16} />,
    other: <Plus size={16} />
  };

  const statusColors = {
    pending: "warning",
    "in-progress": "default",
    completed: "success",
    exception: "error"
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white border border-zinc-100 rounded-2xl p-4 hover:shadow-md transition-all flex items-center gap-4"
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        task.status === 'completed' ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-400"
      )}>
        {task.status === 'completed' ? <CheckCircle2 size={20} /> : typeIcons[task.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn("font-bold text-sm truncate", task.status === 'completed' && "text-zinc-400 line-through")}>
            {task.title}
          </h4>
          <Badge variant={statusColors[task.status] as any}>{task.status}</Badge>
        </div>
        <p className="text-xs text-zinc-500 truncate">{task.description}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'completed' && (
          <Button variant="ghost" size="sm" onClick={() => onUpdate(task.id, 'completed')} className="p-2">
            <CheckCircle2 size={18} />
          </Button>
        )}
        <button className="p-2 text-zinc-400 hover:text-black">
          <MoreVertical size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, description, className }: { icon: React.ReactNode; title: string; description: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl", className)}>
      <div className="w-12 h-12 text-zinc-300 mb-4">{icon}</div>
      <h4 className="font-bold text-zinc-900 mb-1">{title}</h4>
      <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
    </div>
  );
}
