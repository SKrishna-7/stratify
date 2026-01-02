"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, MoreHorizontal, Calendar, 
  MapPin, DollarSign, Briefcase, 
  Trash2, ExternalLink, Loader2, 
  X
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  getApplications, createApplicationAction, updateStatusAction, deleteApplicationAction 
} from "@actions/application";
import { DashboardLoader } from "@components/Loader";

// --- TYPES ---
// We map DB fields to UI fields here
interface Application {
  id: string;
  company: string;
  role: string;       // DB: position
  location: string;
  date: string;       // DB: dateApplied
  stipend: string;    // DB: salary
  status: string;
  type: string;       // Note: We'll default this for now as DB doesn't have it yet
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Inputs
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newStipend, setNewStipend] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    const data = await getApplications();
    
    // Transform DB data to UI format
    const formattedApps: Application[] = data.map((item: any) => ({
      id: item.id,
      company: item.company,
      role: item.position,
      location: item.location || "Remote",
      date: new Date(item.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      stipend: item.salary || "TBD",
      status: item.status.toLowerCase(), // Ensure lowercase for column matching
      type: "Remote" // Default for now
    }));

    setApps(formattedApps);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ACTIONS ---
  
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    // If dropped in same place, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Optimistic UI Update
    const newStatus = destination.droppableId;
    setApps((prev) => prev.map((a) => a.id === draggableId ? { ...a, status: newStatus } : a));

    // 2. Server Update
    // Capitalize first letter for DB consistency if needed, or keep lowercase
    await updateStatusAction(draggableId, newStatus);
  };

  const handleAddApplication = async () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    setIsSubmitting(true);

    // Map UI fields to DB schema
    await createApplicationAction({
      company: newCompany,
      position: newRole,
      salary: newStipend,
      location: newLocation
    });

    await loadData();
    
    // Reset
    setNewCompany("");
    setNewRole("");
    setNewStipend("");
    setNewLocation("");
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteApp = async (id: string) => {
    // Optimistic delete
    setApps(prev => prev.filter(a => a.id !== id));
    await deleteApplicationAction(id);
    loadData(); // Sync
  };

  // --- FILTER ---
  const getAppsByStatus = (status: string) => {
    return apps.filter(a => 
      a.status === status && 
      (a.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
       a.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

   if (!isLoaded) return (
      <DashboardLoader/>
    );

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
    <div>
      <span className="text-2xl font-black text-white uppercase tracking-tighter">Application Tracker</span>
      <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Track your journey from Application to Offer. </h1>
    </div>
        <div className="flex items-center gap-4">
      {/* Search HUD */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
        <input 
          type="text" 
          placeholder="SEARCH COMPANY..." 
          className="bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-bold text-white focus:outline-none w-64 focus:border-indigo-500 uppercase tracking-widest placeholder:text-zinc-800 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
          <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
      >
        <Plus size={14} /> Add Application
      </button>
    </div>
  </div>
      {/* DRAG DROP BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
    <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
      <div className="flex gap-8 min-w-[1500px] h-full">
        
        {[
          { id: 'applied', title: 'Applied', color: 'bg-zinc-700' },
          { id: 'oa', title: 'Online Assessment', color: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' },
          { id: 'interview', title: 'Interview', color: 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.4)]' },
          { id: 'offer', title: 'Offer Issued', color: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' },
          { id: 'rejected', title: 'Rejected', color: 'bg-rose-500' }
        ].map((col) => (
          <div key={col.id} className="flex-1 flex flex-col min-w-[300px] bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-6 shadow-2xl">
             {/* Column Header */}
             <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                   <div className={`w-1.5 h-4 rounded-full ${col.color}`} />
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">{col.title}</h3>
                </div>
                <span className="text-[10px] font-black text-zinc-700 bg-black border border-zinc-900 px-2.5 py-1 rounded-md">
                  {getAppsByStatus(col.id).length}
                </span>
             </div>

             {/* Column Body */}
             <Column 
               id={col.id} 
               apps={getAppsByStatus(col.id)} 
               onDelete={handleDeleteApp} 
             />
          </div>
        ))}

      </div>
    </div>
  </DragDropContext>
      {/* ADD MODAL */}
      {isModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#090909] border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Register Application</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6 mb-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Company Entity</label>
              <input autoFocus type="text" placeholder="E.G. NVIDIA" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Designation</label>
              <input type="text" placeholder="E.G. SDE-1" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Compensation</label>
              <input type="text" placeholder="E.G. 1.2L/MO" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all" value={newStipend} onChange={(e) => setNewStipend(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Deployment Location</label>
              <input type="text" placeholder="E.G. BENGALURU" className="w-full bg-black border border-zinc-900 rounded-2xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 uppercase tracking-widest transition-all" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          <button 
            onClick={handleAddApplication} 
            disabled={isSubmitting || !newCompany.trim()} 
            className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Registration'}
          </button>
        </div>
      </div>
    </div>
  )}
</div> );
}

// --- COMPONENTS ---

function Column({ id, title, count, apps, color, onDelete }: any) {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface/30 border border-border/50 rounded-2xl p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color?.replace('bg-','bg-')}`}></div>
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <span className="bg-surface border border-border text-xs text-text-secondary px-2 py-0.5 rounded-full">{count}</span>
        </div>
        <MoreHorizontal size={16} className="text-text-muted" />
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl transition-colors min-h-[150px]
              ${snapshot.isDraggingOver ? 'bg-surface-highlight/30 ring-2 ring-primary/20' : ''}
              [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            `}
          >
            {apps.map((app: Application, index: number) => (
              <AppCard key={app.id} app={app} index={index} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function AppCard({ app, index, onDelete }: any) {
  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            group bg-surface border border-border p-4 rounded-xl relative transition-all
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary rotate-2 z-50' : 'hover:border-primary/50 hover:shadow-md'}
          `}
          style={provided.draggableProps.style}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-highlight border border-border flex items-center justify-center font-bold text-text-primary">
                {app.company.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary leading-tight">{app.company}</h4>
                <p className="text-xs text-text-muted">{app.role}</p>
              </div>
            </div>
            <button 
              onClick={() => onDelete(app.id)}
              className="text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-2 text-[11px] text-text-secondary mb-3">
             <div className="flex items-center gap-1.5">
               <MapPin size={12} /> {app.location}
             </div>
             <div className="flex items-center gap-1.5">
               <Briefcase size={12} /> {app.type}
             </div>
             <div className="flex items-center gap-1.5">
               <DollarSign size={12} /> {app.stipend}
             </div>
             <div className="flex items-center gap-1.5">
               <Calendar size={12} /> {app.date}
             </div>
          </div>

          {/* Footer Link */}
          <div className="pt-2 border-t border-border flex justify-end">
             <a href="#" className="flex items-center gap-1 text-[10px] text-accent-blue hover:underline">
               View Details <ExternalLink size={10} />
             </a>
          </div>
        </div>
      )}
    </Draggable>
  );
}