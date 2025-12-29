"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Clock, MoreVertical, Trash2, MapPin, 
  BookOpen, Coffee, X
} from "lucide-react";

// --- TYPES ---
type EventType = "Class" | "Study" | "Test" | "Break" | "Meeting";

interface ScheduleEvent {
  id: string;
  title: string;
  subtitle: string; // e.g., "Chapter 4" or "Room 302"
  startTime: string; // "08:30"
  endTime: string;   // "09:30"
  type: EventType;
}

// --- MOCK DATA ---
const INITIAL_EVENTS: ScheduleEvent[] = [
  { 
    id: "1", 
    title: "Basic Color Theory", 
    subtitle: "UI Design Class", 
    startTime: "08:30", 
    endTime: "10:00", 
    type: "Class" 
  },
  { 
    id: "2", 
    title: "DSA Graph Algorithms", 
    subtitle: "Self Study", 
    startTime: "11:30", 
    endTime: "13:00", 
    type: "Study" 
  },
  { 
    id: "3", 
    title: "Lunch Break", 
    subtitle: "Cafeteria", 
    startTime: "13:00", 
    endTime: "14:00", 
    type: "Break" 
  },
  { 
    id: "4", 
    title: "System Design Mock", 
    subtitle: "Peer Interview", 
    startTime: "16:00", 
    endTime: "17:00", 
    type: "Test" 
  }
];

export default function PlannerPage() {
  // State
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<EventType>("Study");

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem("prepos-planner");
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      setEvents(INITIAL_EVENTS);
    }
    setIsLoaded(true);
  }, []);

  // Save Data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("prepos-planner", JSON.stringify(events));
    }
  }, [events, isLoaded]);

  // --- ACTIONS ---

  const addEvent = () => {
    if (!newTitle.trim() || !newTime) return;
    
    const newEvent: ScheduleEvent = {
      id: Date.now().toString(),
      title: newTitle,
      subtitle: newSubtitle || newType,
      startTime: newTime,
      endTime: "", // Optional for simple view
      type: newType
    };

    // Add and sort by time
    const updatedEvents = [...events, newEvent].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    setEvents(updatedEvents);
    setIsModalOpen(false);
    resetForm();
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const resetForm = () => {
    setNewTitle("");
    setNewSubtitle("");
    setNewTime("");
    setNewType("Study");
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // Helper for formatted date
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  if (!isLoaded) return null;

  return (
    <div className="h-full flex flex-col gap-6 p-2 max-w-3xl mx-auto">
      
      {/* 1. HEADER & DATE CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daily Planner</h1>
          <p className="text-text-secondary text-sm">Time-block your day for maximum focus.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-surface-highlight rounded-lg text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-primary" />
          <span className="font-bold text-text-primary text-lg">{formattedDate}</span>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-surface-highlight rounded-lg text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 2. TIMELINE LIST (Reference Image Style) */}
      <div className="bg-surface border border-border rounded-2xl p-6 min-h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-lg text-text-primary">Schedule</h3>
          <span className="text-xs text-text-muted bg-surface-highlight px-2 py-1 rounded-md">
            {events.length} Events
          </span>
        </div>

        <div className="space-y-8 relative">
          {/* Vertical Guide Line */}
          <div className="absolute left-[85px] top-2 bottom-2 w-px bg-border/50 hidden sm:block"></div>

          {events.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p>No plans for today yet.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-primary hover:underline text-sm mt-2">Add your first task</button>
            </div>
          )}

          {events.map((event) => (
            <div key={event.id} className="group flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 relative">
              
              {/* TIME COLUMN */}
              <div className="w-[85px] flex-shrink-0 pt-1">
                <span className="text-lg font-bold text-text-primary block leading-none">
                  {event.startTime}
                </span>
                <span className="text-xs text-text-muted mt-1 block pl-0.5">
                  {parseInt(event.startTime) >= 12 ? 'PM' : 'AM'}
                </span>
              </div>

              {/* EVENT CARD */}
              <div className="flex-1 pl-4 sm:pl-8 relative">
                {/* Colored Indicator Line */}
                <div className={`
                  absolute left-0 top-0 bottom-0 w-1 rounded-full 
                  ${event.type === 'Class' ? 'bg-purple-500' : 
                    event.type === 'Study' ? 'bg-blue-500' : 
                    event.type === 'Test' ? 'bg-red-500' : 
                    event.type === 'Break' ? 'bg-orange-500' : 'bg-gray-500'}
                `}></div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 block
                       ${event.type === 'Class' ? 'text-purple-400' : 
                         event.type === 'Study' ? 'text-blue-400' : 
                         event.type === 'Test' ? 'text-red-400' : 
                         event.type === 'Break' ? 'text-orange-400' : 'text-gray-400'}
                    `}>
                      {event.type}
                    </span>
                    <h4 className="text-base font-bold text-text-primary">{event.title}</h4>
                    <p className="text-sm text-text-secondary mt-1">{event.subtitle}</p>
                  </div>

                  {/* Delete Action */}
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">Add Schedule Block</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Type Selection */}
              <div className="grid grid-cols-5 gap-2">
                {['Class', 'Study', 'Test', 'Break', 'Meeting'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type as EventType)}
                    className={`
                      text-[10px] py-2 rounded-lg border transition-all
                      ${newType === type 
                        ? 'bg-primary/20 border-primary text-primary font-bold' 
                        : 'bg-surface-highlight border-transparent text-text-secondary hover:bg-surface-highlight/80'}
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Time</label>
                <input 
                  type="time" 
                  className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. System Design Lecture"
                  className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Subtitle / Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Room 302 or Chapter 4"
                  className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={addEvent} 
              className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              Add to Schedule
            </button>
          </div>
        </div>
      )}

    </div>
  );
}