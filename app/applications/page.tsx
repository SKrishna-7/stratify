"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, MoreHorizontal, Calendar, 
  MapPin, DollarSign, Briefcase, 
  Trash2, ExternalLink, Loader2 
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  getApplications, createApplicationAction, updateStatusAction, deleteApplicationAction 
} from "@/src/actions/application";

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
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Application Tracker</h1>
          <p className="text-text-secondary text-sm">Track your journey from Application to Offer.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search company..." 
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none w-64 focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Add Application
          </button>
        </div>
      </div>

      {/* DRAG DROP BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-[1400px] h-full">
            
            <Column id="applied" title="Applied" count={getAppsByStatus('applied').length} color="text-blue-400" apps={getAppsByStatus('applied')} onDelete={handleDeleteApp} />
            <Column id="oa" title="Online Assessment" count={getAppsByStatus('oa').length} color="text-yellow-400" apps={getAppsByStatus('oa')} onDelete={handleDeleteApp} />
            <Column id="interview" title="Interview" count={getAppsByStatus('interview').length} color="text-purple-400" apps={getAppsByStatus('interview')} onDelete={handleDeleteApp} />
            <Column id="offer" title="Offer" count={getAppsByStatus('offer').length} color="text-green-400" apps={getAppsByStatus('offer')} onDelete={handleDeleteApp} />
            <Column id="rejected" title="Rejected" count={getAppsByStatus('rejected').length} color="text-red-400" apps={getAppsByStatus('rejected')} onDelete={handleDeleteApp} />

          </div>
        </div>
      </DragDropContext>

      {/* ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add Application</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Company</label>
                <input autoFocus type="text" placeholder="e.g. Google" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Role</label>
                <input type="text" placeholder="e.g. SDE Intern" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Salary/Stipend</label>
                    <input type="text" placeholder="e.g. 50k/mo" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newStipend} onChange={(e) => setNewStipend(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Location</label>
                    <input type="text" placeholder="e.g. Remote" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                 </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancel</button>
              <button onClick={handleAddApplication} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTS ---

function Column({ id, title, count, apps, color, onDelete }: any) {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface/30 border border-border/50 rounded-2xl p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`}></div>
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