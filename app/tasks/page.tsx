"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, MoreHorizontal, Calendar, 
  MessageSquare, Paperclip, CheckCircle2, 
  Circle, Clock, Trash2, Loader2, 
  X
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  getBoardData, createTaskAction, moveTaskAction, deleteTaskAction 
} from "@actions/kaban";
import { DashboardLoader } from "@components/Loader";

// --- TYPES ---
interface Task {
  id: string;
  content: string; // Renamed from 'title' to match DB schema
  priority: string;
  order: number;
  columnId: string;
}

interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}

export default function TasksPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  // --- 1. LOAD DATA ---
  const loadData = async () => {
    const data = await getBoardData();
    // Transform DB data to match UI needs if necessary
    // The server action returns columns with tasks included
    setColumns(data as any);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ACTIONS ---
  
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Optimistic Update (Update UI instantly)
    const newColumns = [...columns];
    const sourceColIndex = newColumns.findIndex(c => c.id === source.droppableId);
    const destColIndex = newColumns.findIndex(c => c.id === destination.droppableId);

    const sourceCol = { ...newColumns[sourceColIndex] };
    const destCol = { ...newColumns[destColIndex] };

    const [movedTask] = sourceCol.tasks.splice(source.index, 1);
    
    // If moving to same column
    if (source.droppableId === destination.droppableId) {
      sourceCol.tasks.splice(destination.index, 0, movedTask);
      newColumns[sourceColIndex] = sourceCol;
    } else {
      // Moving to different column
      destCol.tasks.splice(destination.index, 0, movedTask);
      newColumns[sourceColIndex] = sourceCol;
      newColumns[destColIndex] = destCol;
      
      // 2. Server Action (Persist Change)
      // Note: We are just updating the columnId in DB. 
      // Reordering within a column requires a more complex 'reorderAction' not built yet.
      // For now, we just move it to the new column.
      await moveTaskAction(draggableId, destCol.id);
    }

    setColumns(newColumns);
  };
const handleAddTask = async () => {
    if (!newTaskContent.trim()) return;
    setIsSubmitting(true);
    
    const firstColumnId = columns[0]?.id;
    if (firstColumnId) {
      // Pass the selected priority here
      await createTaskAction(newTaskContent, firstColumnId, newTaskPriority); 
      await loadData();
    }

    setNewTaskContent("");
    setNewTaskPriority("medium"); // Reset to default
    setIsSubmitting(false);
    setIsModalOpen(false);
};

  const handleDeleteTask = async (taskId: string) => {
    // Optimistic delete
    const newColumns = columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.id !== taskId)
    }));
    setColumns(newColumns);

    await deleteTaskAction(taskId);
    loadData(); // Sync to be safe
  };

  // --- HELPERS ---
  const getFilteredTasks = (tasks: Task[]) => {
    if (!searchQuery) return tasks;
    return tasks.filter(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()));
  };
 if (!isLoaded) return (
    <DashboardLoader/>
  );

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-2xl font-black text-white uppercase italic">My Tasks</span>
          <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Drag cards to update their status.</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
          <input 
          type="text" 
          placeholder="SEARCH..." 
          className="bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-bold text-white focus:outline-none w-64 focus:border-indigo-500 uppercase tracking-widest placeholder:text-zinc-600 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
          </div>
          <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
      >
        <Plus size={14} /> Add Task
      </button>
        </div>
      </div>

      {/* DRAG DROP CONTEXT */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1000px] h-full">
            
            {columns.map((col) => (
          <div key={col.id} className="flex-1 flex flex-col min-w-[320px] bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-6 shadow-2xl">
             {/* Column Header */}
             <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                   <div className={`w-1.5 h-4 rounded-full ${col.title === 'Todo' ? 'bg-zinc-700' : col.title === 'In Progress' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">{col.title}</h3>
                </div>
                <span className="text-[10px] font-black text-zinc-700 bg-black border border-zinc-900 px-2.5 py-1 rounded-md">
                  {col.tasks.length}
                </span>
             </div>

             {/* Draggable Area */}
             <KanbanColumn 

                key={col.id}

                id={col.id}

                title={col.title}

                count={col.tasks.length}

                // Map generic icons based on title for visual consistency

                icon={col.title === 'Todo' ? Circle : col.title === 'In Progress' ? Clock : CheckCircle2}

                color={col.title === 'Todo' ? 'text-text-muted' : col.title === 'In Progress' ? 'text-orange-500' : 'text-green-500'}

                tasks={getFilteredTasks(col.tasks)}

                onDelete={handleDeleteTask}

              />
          </div>
        ))}

          </div>
        </div>
      </DragDropContext>

      {/* ADD TASK MODAL */}
      

      {isModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#090909] border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Initialize Task</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-8">
          {/* Content Input */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Task</label>
            <input 
              autoFocus
              type="text" 
              placeholder="ENTER TASK NAME..." 
              className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 uppercase tracking-widest transition-all"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
            />
          </div>

          {/* Priority Selector */}
          <div className="space-y-4">
            <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Execution Priority</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewTaskPriority(p)}
                  className={`
                    flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all
                    ${newTaskPriority === p 
                      ? (p === 'high' ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : p === 'medium' ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]') 
                      : 'bg-black border-zinc-900 text-zinc-600 hover:border-zinc-700'
                    }
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 py-5 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancle
            </button>
            <button 
              onClick={handleAddTask} 
              disabled={isSubmitting || !newTaskContent.trim()} 
              className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function KanbanColumn({ id, title, count, tasks, icon: Icon, color, onDelete }: any) {
  return (
    <div className="flex-1 flex flex-col h-full bg-surface/30 border border-border/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Icon size={18} className={color} />
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <span className="bg-surface border border-border text-xs text-text-secondary px-2 py-0.5 rounded-full">{count}</span>
        </div>
        <MoreHorizontal size={18} className="text-text-muted" />
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto space-y-3 pr-1 rounded-xl transition-colors min-h-[150px]
              ${snapshot.isDraggingOver ? 'bg-surface-highlight/30 ring-2 ring-primary/20' : ''}
            `}
          >
            {tasks.map((task: Task, index: number) => (
              <DraggableTask key={task.id} task={task} index={index} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function DraggableTask({ task, index, onDelete }: any) {
  // Use priority for visual tagging since we don't have 'tags' in simple schema yet
  const priorityColor = 
    task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
    task.priority === 'medium' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
    'bg-surface-highlight text-text-secondary border-border';

  return (
    <Draggable draggableId={task.id} index={index}>
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
          <div className="flex justify-between items-start mb-2">
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${priorityColor}`}>
              {task.priority || 'Normal'}
            </span>
            <button 
              onClick={() => onDelete(task.id)}
              className="text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <h4 className="text-sm font-medium text-text-primary mb-3 leading-snug">{task.content}</h4>
          
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Calendar size={12} /> <span>Today</span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}