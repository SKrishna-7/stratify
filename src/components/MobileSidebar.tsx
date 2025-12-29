"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* HAMBURGER BUTTON 
        - Visible only on Mobile (md:hidden)
        - Fixed to top-left
      */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-sidebar border border-border rounded-lg text-text-primary shadow-md hover:bg-surface-highlight transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* OVERLAY BACKDROP 
        - Darkens the background when menu is open
      */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SLIDING DRAWER 
        - Slides in from left
        - Uses transform instead of conditional rendering for smoothness
      */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Render the Original Sidebar inside, passing the close function */}
        <Sidebar onClose={() => setIsOpen(false)} />
      </div>
    </>
  );
}