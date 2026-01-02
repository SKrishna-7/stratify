"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, Plus, Trash2, Play, Loader2, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  getDeckDetails, createFlashcardAction, deleteFlashcardAction, updateMasteryAction 
} from "@actions/flashcard";
import { DashboardLoader } from "@components/Loader";

// --- TYPES ---
interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: string;
}

interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
}

export default function DeckPage() {
  const params = useParams();
  const deckId = params.id as string;
  const router = useRouter();

  // --- STATE ---
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(""); // Track errors
  
  const [mode, setMode] = useState<'edit' | 'study'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit State
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  
  // Study State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);

  // --- LOAD DATA ---
  const loadData = async () => {
    try {
      if (!deckId) return;

      const data = await getDeckDetails(deckId);
      
      if (!data) {
        setError("Deck not found");
      } else {
        setDeck(data as Deck);
      }
    } catch (err) {
      console.error("Error loading deck:", err);
      setError("Failed to load deck");
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [deckId]);

  // --- ACTIONS ---
  const handleAddCard = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    setIsSubmitting(true);
    await createFlashcardAction(deckId, newFront, newBack);
    await loadData(); // Reload to get new ID
    setNewFront("");
    setNewBack("");
    setIsSubmitting(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    if(confirm("Delete this card?")) {
        await deleteFlashcardAction(cardId, deckId);
        loadData();
    }
  };

  // --- STUDY LOGIC ---
  const startSession = () => {
    if (!deck || deck.cards.length === 0) return;
    
    // Sort: Hard > New > Medium > Easy
    const queue = [...deck.cards].sort((a, b) => {
      const score: Record<string, number> = { 'hard': 0, 'new': 1, 'medium': 2, 'easy': 3 };
      return (score[a.mastery] || 1) - (score[b.mastery] || 1);
    });
    
    setStudyQueue(queue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMode('study');
  };

  const rateCard = async (rating: string) => {
    const currentCard = studyQueue[currentIndex];
    
    // Optimistic Update
    setDeck((prev: any) => ({
      ...prev,
      cards: prev.cards.map((c: any) => c.id === currentCard.id ? { ...c, mastery: rating } : c)
    }));

    await updateMasteryAction(currentCard.id, rating, deckId);

    if (currentIndex < studyQueue.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      alert("Session Complete! Great job.");
      setMode('edit');
      loadData();
    }
  };

  // --- LOADING STATE ---
   if (!isLoaded) return (
      <DashboardLoader/>
    );
  // --- NOT FOUND STATE ---
  if (error || !deck) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <AlertCircle size={48} className="text-red-500" />
      <h2 className="text-xl font-bold text-text-primary">Deck Not Found</h2>
      <p className="text-text-secondary">{error || "This deck might have been deleted."}</p>
      <Link href="/flashcards" className="px-4 py-2 bg-surface-highlight border border-border rounded-xl text-text-primary hover:bg-primary hover:text-white transition-colors">
        Back to Library
      </Link>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-2 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900">
    <div className="flex items-center gap-6">   
      <Link href="/flashcards" className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:text-white transition-all text-zinc-500 hover:border-zinc-700">
        <ArrowLeft size={18} />
      </Link>
      <div>
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">{deck.title}</h1>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{deck.cards.length} Total Nodes in Deck</p>
      </div>
    </div>
        
        {mode === 'edit' && deck.cards.length > 0 && (
          <button onClick={startSession} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
            <Play size={18} fill="currentColor" /> Study Now
          </button>
        )}
        
        {mode === 'study' && (
           <button onClick={() => setMode('edit')} className="text-text-muted hover:text-text-primary text-sm font-medium">Exit Session</button>
        )}
      </div>

      {/* === MODE: EDIT === */}
      {mode === 'edit' && (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-[#090909] border border-zinc-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
          <Plus size={16}/> New Data Entry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <textarea placeholder="FRONT: OPERATIONAL QUESTION" className="bg-black border border-zinc-800 rounded-2xl p-5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 resize-none h-32 uppercase tracking-widest placeholder:text-zinc-800" value={newFront} onChange={(e) => setNewFront(e.target.value)} />
          <textarea placeholder="BACK: SYSTEM RESPONSE" className="bg-black border border-zinc-800 rounded-2xl p-5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 resize-none h-32 uppercase tracking-widest placeholder:text-zinc-800" value={newBack} onChange={(e) => setNewBack(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <button onClick={handleAddCard} disabled={isSubmitting} className="px-8 py-4 bg-white text-black text-[10px] font-black rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest flex items-center gap-2">
            {isSubmitting && <Loader2 size={14} className="animate-spin" />} Commit Card
          </button>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2 mb-4">Deck Inventory</h3>
         {deck.cards.length === 0 ? (
           <div className="text-center py-20 text-zinc-700 border-2 border-dashed border-zinc-900 rounded-[2.5rem] uppercase font-black text-[10px] tracking-widest italic">Inventory empty.</div>
         ) : (
           deck.cards.map((card: any, idx: number) => (
             <div key={card.id} className="group bg-[#090909] border border-zinc-900 p-6 rounded-[1.5rem] flex justify-between items-center hover:border-zinc-700 transition-all">
                <div className="flex gap-8 flex-1">
                  <span className="text-zinc-700 font-black text-[10px] w-8 pt-1">#{String(idx + 1).padStart(2, '0')}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    <p className="text-sm font-black text-zinc-100 uppercase italic tracking-tight">{card.front}</p>
                    <p className="text-xs font-medium text-zinc-500 italic md:border-l border-zinc-800 md:pl-8">{card.back}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-8">
                   <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-md border tracking-widest ${
                     card.mastery === 'easy' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 
                     card.mastery === 'medium' ? 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5' : 
                     card.mastery === 'hard' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 
                     'text-zinc-600 border-zinc-900 bg-black'
                   }`}>{card.mastery || 'untested'}</span>
                   <button onClick={() => handleDeleteCard(card.id)} className="text-zinc-800 hover:text-rose-500 p-2 transition-colors"><Trash2 size={16} /></button>
                </div>
             </div>
           ))
         )}
      </div>
    </div>
  )}

      {/* === MODE: STUDY === */}
     {mode === 'study' && studyQueue.length > 0 && (
    <div className="flex flex-col items-center justify-center flex-1 py-8 animate-in zoom-in-95 duration-500">
        <div className="w-full max-w-2xl mb-12 space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
             <span>Recall Status: {currentIndex + 1} / {studyQueue.length}</span>
             <span className="text-emerald-500 italic">Accuracy Drive Active</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="relative w-full max-w-2xl h-[400px] perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
             <div className="absolute inset-0 backface-hidden bg-[#090909] border border-zinc-900 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-12 text-center" style={{ backfaceVisibility: 'hidden' }}>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6">Neural Query</span>
                <h2 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">{studyQueue[currentIndex].front}</h2>
                <p className="absolute bottom-8 text-[9px] font-black text-zinc-700 uppercase tracking-widest animate-pulse italic">Click to trigger recall</p>
             </div>
             <div className="absolute inset-0 backface-hidden bg-black border-2 border-indigo-500/20 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-12 text-center rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-6">Verified Logic</span>
                <h2 className="text-2xl font-bold text-zinc-200 leading-relaxed italic">{studyQueue[currentIndex].back}</h2>
             </div>
          </div>
        </div>

        <div className={`mt-12 flex gap-6 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button onClick={() => rateCard('hard')} className="group flex flex-col items-center gap-2 w-32 py-5 rounded-[1.5rem] bg-black border border-rose-500/20 hover:border-rose-500 text-rose-500 transition-all active:scale-95">
             <span className="text-[10px] font-black uppercase tracking-widest">Hard</span>
             <span className="text-[8px] font-bold opacity-40 uppercase">Recall Failed</span>
          </button>
          <button onClick={() => rateCard('medium')} className="group flex flex-col items-center gap-2 w-32 py-5 rounded-[1.5rem] bg-black border border-indigo-500/20 hover:border-indigo-500 text-indigo-500 transition-all active:scale-95">
             <span className="text-[10px] font-black uppercase tracking-widest">Medium</span>
             <span className="text-[8px] font-bold opacity-40 uppercase">Stable recall</span>
          </button>
          <button onClick={() => rateCard('easy')} className="group flex flex-col items-center gap-2 w-32 py-5 rounded-[1.5rem] bg-black border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 transition-all active:scale-95">
             <span className="text-[10px] font-black uppercase tracking-widest">Easy</span>
             <span className="text-[8px] font-bold opacity-40 uppercase">Mastered</span>
          </button>
        </div>
    </div>
  )}
</div>
  );
}