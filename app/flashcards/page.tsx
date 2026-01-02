"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Plus, Trash2, BrainCircuit, Layers, Search, Play, Loader2, 
  X
} from "lucide-react";
import Link from "next/link";
import { getDecks, createDeckAction, deleteDeckAction } from "@actions/flashcard";
import { DashboardLoader } from "@components/Loader";

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Load Data
  const loadData = async () => {
    const data = await getDecks();
    setDecks(data);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actions
  const handleAddDeck = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    await createDeckAction(newTitle, newDesc || "No description");
    await loadData();
    setNewTitle("");
    setNewDesc("");
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Delete this deck and all its cards?")) {
      await deleteDeckAction(id);
      loadData();
    }
  };

  if (!isLoaded) return (
    <DashboardLoader/>
  );

  return (
    <div className="h-full flex flex-col gap-8 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
    <div>
      <h1 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Knowledge Archive</h1>
      <span className="text-2xl font-black text-white uppercase">Revision Zone</span>
    </div>
    
    <div className="flex items-center gap-4">
      {/* Search HUD */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
        <input 
          type="text" 
          placeholder="SEARCH DECKS..." 
          className="bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-bold text-white focus:outline-none w-64 focus:border-indigo-500 uppercase tracking-widest placeholder:text-zinc-800 transition-all"
        />
      </div>
      
      {/* Create Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
      >
        <Plus size={14} /> New Deck
      </button>
    </div>
  </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[
      { label: "Total Cards", val: decks.reduce((acc, d) => acc + d.totalCards, 0), icon: Zap, color: "text-indigo-500" },
      { label: "Mastered", val: decks.reduce((acc, d) => acc + d.masteredCards, 0), icon: BrainCircuit, color: "text-emerald-500" },
      { label: "Active Decks", val: decks.length, icon: Layers, color: "text-zinc-400" }
    ].map((stat, i) => (
      <div key={i} className="bg-[#090909] border border-zinc-900 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center ${stat.color} shadow-inner`}>
          <stat.icon size={24} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none mb-1">{stat.val}</h3>
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] -rotate-12 translate-x-4 -translate-y-4" />
      </div>
    ))}
  </div>

      {/* DECKS GRID */}
      <div>
    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 px-2">
      <Layers size={16} /> Deck Inventory
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {decks.map((deck) => {
        const progress = deck.totalCards === 0 ? 0 : Math.round((deck.masteredCards / deck.totalCards) * 100);
        return (
          <Link href={`/flashcards/${deck.id}`} key={deck.id}>
            <div className="group h-full bg-[#090909] border border-zinc-900 rounded-[2rem] p-8 hover:border-zinc-700 transition-all cursor-pointer flex flex-col relative overflow-hidden">
              {/* Dynamic Accent Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${deck.color === 'bg-primary' ? 'from-indigo-600 to-indigo-400' : 'from-emerald-600 to-emerald-400'}`}></div>
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-white font-black text-xl italic uppercase shadow-inner group-hover:border-zinc-700 transition-colors">
                  {deck.title.charAt(0)}
                </div>
                <button onClick={(e) => handleDeleteDeck(e, deck.id)} className="text-zinc-700 hover:text-rose-500 p-2 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black text-zinc-100 uppercase italic mb-3 group-hover:text-white transition-colors">{deck.title}</h3>
                <p className="text-xs text-zinc-600 font-medium italic line-clamp-2 leading-relaxed">{deck.description || "Operational parameters defined."}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-900/50">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-3">
                  <span className="text-zinc-600">{deck.totalCards} CARDS IN DECK</span>
                  <span className="text-emerald-500 italic">{progress}% MASTERED</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div 
                    className={`h-full bg-gradient-to-r ${deck.color === 'bg-primary' ? 'from-indigo-600 to-indigo-400' : 'from-emerald-600 to-emerald-400'} rounded-full transition-all duration-1000`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

              {/* HUD Play Button Overlay */}
              <div className="absolute bottom-10 right-10 w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-2xl">
                <Play size={18} fill="black" />
              </div>
            </div>
          </Link>
        );
      })}

      {/* Initialize New Deck Button */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="h-full min-h-[300px] border-2 border-dashed border-zinc-900 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-zinc-700 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/20 transition-all group"
      >
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-zinc-800 flex items-center justify-center transition-colors">
          <Plus size={32} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Create New Deck</span>
      </button>
    </div>
  </div>
      {/* CREATE DECK MODAL */}
      {isModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#090909] border border-zinc-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Initialize Deck</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-8 mb-10">
          <div className="space-y-4">
            <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Deck Designation</label>
            <input 
              autoFocus 
              type="text" 
              placeholder="e.g. TECHNICAL CONCEPTS" 
              className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 uppercase tracking-widest transition-all"
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
            />
          </div>
          <div className="space-y-4">
            <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">Contextual Description</label>
            <input 
              type="text" 
              placeholder="OPTIONAL DATA..." 
              className="w-full bg-black border border-zinc-900 rounded-2xl p-5 text-[11px] font-bold text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-800 uppercase tracking-widest transition-all"
              value={newDesc} 
              onChange={(e) => setNewDesc(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddDeck()} 
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          <button 
            onClick={handleAddDeck} 
            disabled={isSubmitting || !newTitle.trim()} 
            className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Protocol'}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}