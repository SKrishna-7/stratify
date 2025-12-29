"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, MoreHorizontal, Calendar, 
  MessageSquare, Paperclip, CheckCircle2, 
  Circle, Clock, Trash2, Loader2 
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  getBoardData, createTaskAction, moveTaskAction, deleteTaskAction 
} from "@/src/actions/kaban";

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
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Tasks</h1>
          <p className="text-text-secondary text-sm">Drag cards to update their status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none w-64 focus:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* DRAG DROP CONTEXT */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1000px] h-full">
            
            {columns.map((col) => (
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
            ))}

          </div>
        </div>
      </DragDropContext>

      {/* ADD TASK MODAL */}
      

      {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
      <h3 className="text-lg font-bold text-text-primary mb-4">New Task</h3>
      
      {/* Task Title Input */}
      <input 
        autoFocus
        type="text" 
        placeholder="Task name..." 
        className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary mb-4"
        value={newTaskContent}
        onChange={(e) => setNewTaskContent(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
      />

      {/* NEW: Priority Selector */}
      <div className="mb-6">
        <label className="text-xs font-bold text-text-secondary uppercase mb-2 block">Priority</label>
        <div className="flex gap-2">
          {['low', 'medium', 'high'].map((p) => (
            <button
              key={p}
              onClick={() => setNewTaskPriority(p)}
              className={`
                flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-all
                ${newTaskPriority === p 
                  ? (p === 'high' ? 'bg-red-500 text-white border-red-500' : p === 'medium' ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-500 text-white border-green-500') 
                  : 'bg-surface border-border text-text-muted hover:border-primary/50'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancel</button>
        <button onClick={handleAddTask} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />} Create
        </button>
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