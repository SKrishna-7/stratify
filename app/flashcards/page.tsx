"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Plus, Trash2, BrainCircuit, Layers, Search, Play, Loader2 
} from "lucide-react";
import Link from "next/link";
import { getDecks, createDeckAction, deleteDeckAction } from "@/src/actions/flashcard";

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
    <div className="h-full flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-8 p-2">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Revision Zone</h1>
          <p className="text-text-secondary text-sm">Spaced repetition to master your concepts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input type="text" placeholder="Search decks..." className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none w-64" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={18} /> New Deck
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500"><Zap size={24} /></div>
          <div><h3 className="text-2xl font-bold text-text-primary">{decks.reduce((acc, d) => acc + d.totalCards, 0)}</h3><p className="text-xs text-text-muted uppercase font-bold tracking-wider">Total Cards</p></div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><BrainCircuit size={24} /></div>
          <div><h3 className="text-2xl font-bold text-text-primary">{decks.reduce((acc, d) => acc + d.masteredCards, 0)}</h3><p className="text-xs text-text-muted uppercase font-bold tracking-wider">Mastered</p></div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Layers size={24} /></div>
          <div><h3 className="text-2xl font-bold text-text-primary">{decks.length}</h3><p className="text-xs text-text-muted uppercase font-bold tracking-wider">Active Decks</p></div>
        </div>
      </div>

      {/* DECKS GRID */}
      <div>
        <h3 className="font-semibold text-text-primary mb-6 flex items-center gap-2"><Layers size={18} className="text-text-muted" /> Your Decks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
             const progress = deck.totalCards === 0 ? 0 : Math.round((deck.masteredCards / deck.totalCards) * 100);
             return (
              <Link href={`/flashcards/${deck.id}`} key={deck.id}>
                <div className="group h-full bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${deck.color}`}></div>
                  <div className="flex justify-between items-start mb-6 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center text-text-primary font-bold text-lg">{deck.title.charAt(0)}</div>
                    <button onClick={(e) => handleDeleteDeck(e, deck.id)} className="text-text-muted hover:text-red-500 p-1 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{deck.title}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-6">{deck.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                    <span className="flex items-center gap-1"><Layers size={12}/> {deck.totalCards} cards</span>
                    <span className="flex items-center gap-1 font-medium text-green-500"><BrainCircuit size={12}/> {progress}% Mastered</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-highlight rounded-full overflow-hidden">
                    <div className={`h-full ${deck.color} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="absolute bottom-6 right-6 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-lg shadow-blue-500/20">
                    <Play size={16} fill="currentColor" />
                  </div>
                </div>
              </Link>
             );
          })}
          <button onClick={() => setIsModalOpen(true)} className="h-full min-h-[200px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 text-text-muted hover:text-primary hover:border-primary hover:bg-surface-highlight/30 transition-all group">
            <div className="w-14 h-14 rounded-full bg-surface-highlight group-hover:bg-primary/10 flex items-center justify-center transition-colors"><Plus size={28} /></div>
            <span className="font-medium text-sm">Create New Deck</span>
          </button>
        </div>
      </div>

      {/* CREATE DECK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-text-primary mb-4">Create New Deck</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Deck Name</label>
                <input autoFocus type="text" placeholder="e.g. React Interview Questions" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Description</label>
                <input type="text" placeholder="Optional description" className="w-full bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddDeck()} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary">Cancel</button>
              <button onClick={handleAddDeck} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />} Create Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}