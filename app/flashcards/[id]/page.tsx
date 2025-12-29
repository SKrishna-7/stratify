"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, Plus, Trash2, Play, Loader2, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  getDeckDetails, createFlashcardAction, deleteFlashcardAction, updateMasteryAction 
} from "@/src/actions/flashcard";

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
      console.log("Fetching deck:", deckId); // Debug Log

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
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Loader2 size={48} className="animate-spin text-primary" />
      <p className="text-text-muted text-sm">Loading Deck...</p>
    </div>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/flashcards" className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-muted hover:text-text-primary">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-text-primary text-2xl">{deck.title}</h1>
            <p className="text-sm text-text-secondary">{deck.cards.length} cards in deck</p>
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
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2"><Plus size={18}/> Add New Card</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <textarea placeholder="Front (Question)" className="bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary resize-none h-24" value={newFront} onChange={(e) => setNewFront(e.target.value)} />
              <textarea placeholder="Back (Answer)" className="bg-surface-highlight border border-border rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary resize-none h-24" value={newBack} onChange={(e) => setNewBack(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <button onClick={handleAddCard} disabled={isSubmitting} className="px-6 py-2 bg-surface-highlight border border-border text-text-primary font-medium rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-colors flex items-center gap-2">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />} Add Card
              </button>
            </div>
          </div>

          <div className="space-y-3">
             {deck.cards.length === 0 ? (
               <div className="text-center py-12 text-text-muted border border-dashed border-border rounded-2xl"><p>This deck is empty.</p></div>
             ) : (
               deck.cards.map((card: any, idx: number) => (
                 <div key={card.id} className="group bg-surface border border-border p-4 rounded-xl flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div className="flex gap-4 flex-1">
                      <span className="text-text-muted font-mono text-xs w-6 pt-1">#{idx + 1}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        <p className="text-text-primary font-medium">{card.front}</p>
                        <p className="text-text-secondary border-l border-border pl-4 md:border-l-0 md:pl-0">{card.back}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                       <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${card.mastery === 'easy' ? 'text-green-500 border-green-500/20 bg-green-500/10' : card.mastery === 'medium' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : card.mastery === 'hard' ? 'text-orange-500 border-orange-500/20 bg-orange-500/10' : 'text-text-muted border-border bg-surface-highlight'}`}>{card.mastery}</span>
                       <button onClick={() => handleDeleteCard(card.id)} className="text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {/* === MODE: STUDY === */}
      {mode === 'study' && studyQueue.length > 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
           <div className="w-full max-w-2xl mb-6 flex items-center gap-4 text-sm text-text-secondary">
             <span>Card {currentIndex + 1} of {studyQueue.length}</span>
             <div className="flex-1 h-2 bg-surface-highlight rounded-full overflow-hidden">
               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}></div>
             </div>
           </div>
           <div className="relative w-full max-w-2xl h-80 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
             <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                <div className="absolute inset-0 backface-hidden bg-surface border border-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center" style={{ backfaceVisibility: 'hidden' }}>
                   <span className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Question</span>
                   <h2 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">{studyQueue[currentIndex].front}</h2>
                   <p className="absolute bottom-6 text-xs text-text-muted animate-pulse">Click to flip</p>
                </div>
                <div className="absolute inset-0 backface-hidden bg-surface-highlight border border-primary/20 rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                   <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Answer</span>
                   <h2 className="text-xl md:text-2xl font-medium text-text-primary leading-relaxed">{studyQueue[currentIndex].back}</h2>
                </div>
             </div>
           </div>
           <div className={`mt-10 flex gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             <button onClick={() => rateCard('hard')} className="flex flex-col items-center gap-1 w-24 py-3 rounded-xl bg-surface border border-red-500/20 hover:bg-red-500/10 hover:border-red-500 text-red-500 transition-all"><span className="font-bold">Hard</span><span className="text-[10px] opacity-70">Review soon</span></button>
             <button onClick={() => rateCard('medium')} className="flex flex-col items-center gap-1 w-24 py-3 rounded-xl bg-surface border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500 text-blue-500 transition-all"><span className="font-bold">Medium</span><span className="text-[10px] opacity-70">Got it</span></button>
             <button onClick={() => rateCard('easy')} className="flex flex-col items-center gap-1 w-24 py-3 rounded-xl bg-surface border border-green-500/20 hover:bg-green-500/10 hover:border-green-500 text-green-500 transition-all"><span className="font-bold">Easy</span><span className="text-[10px] opacity-70">Mastered</span></button>
           </div>
        </div>
      )}
    </div>
  );
}