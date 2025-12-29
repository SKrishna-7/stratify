"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  Settings, 
  Sun, 
  Moon,
  ListTodo,
  X,
  Zap // <--- 1. IMPORT ZAP ICON
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// 2. ADD REVISION ZONE HERE
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: BookOpen, label: "My Courses", href: "/courses" },
  { icon: ListTodo, label: "My Tasks", href: "/tasks" },
  { icon: Zap, label: "Revision Zone", href: "/flashcards" }, // <--- NEW LINK
  { icon: Briefcase, label: "Applications", href: "/applications" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="h-screen w-64 bg-sidebar border-r border-border flex flex-col fixed left-0 top-0 transition-colors duration-300 z-50">
      
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-accent-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">PrepOS</h1>
        </div>
        
        {onClose && (
          <button onClick={onClose} className="md:hidden text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive 
                  ? "bg-surface-highlight text-text-primary border border-border-light shadow-sm" 
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }
              `}
            >
              <item.icon size={18} className={item.label === "Revision Zone" ? "group-hover:text-yellow-500 transition-colors" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-full p-2 rounded-lg text-text-secondary hover:bg-surface hover:text-accent-blue transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </div>
    </aside>
  );
}