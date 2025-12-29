"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- DECKS (LIBRARY) ---
export async function getDecks() {
  try {
    const decks = await db.deck.findMany({
      include: {
        cards: true
      },
      orderBy: { title: 'asc' }
    });

    // Transform for UI (Calculate stats)
    return decks.map(deck => ({
      ...deck,
      totalCards: deck.cards.length,
      masteredCards: deck.cards.filter(c => c.mastery === 'easy').length
    }));
  } catch (error) {
    return [];
  }
}

export async function createDeckAction(title: string, description: string) {
  const colors = ["bg-purple-500", "bg-blue-500", "bg-orange-500", "bg-pink-500", "bg-green-500"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  await db.deck.create({
    data: {
      title,
      description,
      color: randomColor
    }
  });
  revalidatePath("/flashcards");
}

export async function deleteDeckAction(deckId: string) {
  await db.deck.delete({ where: { id: deckId } });
  revalidatePath("/flashcards");
}

// --- CARDS (PLAYER) ---
export async function getDeckDetails(deckId: string) {
  try {
    const deck = await db.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true
      }
    });
    return deck;
  } catch (error) {
    return null;
  }
}

export async function createFlashcardAction(deckId: string, front: string, back: string) {
  await db.flashcard.create({
    data: {
      front,
      back,
      deckId,
      mastery: 'new'
    }
  });
  revalidatePath(`/flashcards/${deckId}`);
}

export async function deleteFlashcardAction(cardId: string, deckId: string) {
  await db.flashcard.delete({ where: { id: cardId } });
  revalidatePath(`/flashcards/${deckId}`);
}

export async function updateMasteryAction(cardId: string, mastery: string, deckId: string) {
  await db.flashcard.update({
    where: { id: cardId },
    data: { mastery }
  });
  revalidatePath(`/flashcards/${deckId}`);
}