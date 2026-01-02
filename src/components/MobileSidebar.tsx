"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { SidebarSkeleton } from "./SidebarSkeleton"; // We will create this below

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if data is ready

  useEffect(() => {
    setIsMounted(true);
    // Simulate Neon data fetch/cold start sync
    const timer = setTimeout(() => setIsLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* 1. CYBER-NOIR TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-5 left-5 z-40 p-3 bg-black border border-zinc-800 rounded-xl text-zinc-400 shadow-2xl hover:text-white hover:border-zinc-600 transition-all active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 2. SYSTEM BACKDROP */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. SLIDING DRAWER */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-[70] w-72 transform transition-transform duration-500 ease-out md:hidden
          bg-black border-r border-zinc-900 shadow-[20px_0_50px_rgba(0,0,0,0.8)]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col p-6">
          {/* Close Header for Mobile */}
          <div className="flex justify-end mb-6">
            <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-600 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Conditional Content: Skeleton vs Actual Sidebar */}
          {!isLoaded ? (
            <SidebarSkeleton />
          ) : (
            <Sidebar onClose={() => setIsOpen(false)} />
          )}
        </div>
      </div>
    </>
  );
}