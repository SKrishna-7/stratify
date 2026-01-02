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
  Zap, // <--- 1. IMPORT ZAP ICON
  
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignOutButton, SignInButton, UserButton } from "@clerk/nextjs";
import { LogOut, LogIn, User } from "lucide-react";

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
   <aside className="h-screen w-64 bg-black border-r border-zinc-900 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 flex items-center justify-between border-b border-zinc-900/50">
        <div className="flex items-center gap-3">
          {/* <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <span className="text-white font-black text-xl italic text-shadow-sm">P</span>
          </div> */}
          <h1 className="text-2xl font-black text-white text-center uppercase">PrepOS</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${isActive 
                  ? "bg-zinc-900 text-white border border-zinc-800 shadow-xl italic" 
                  : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200"
                }
              `}
            >
              <item.icon size={16} /> {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
  <div className="mt-auto border-t border-zinc-900 bg-black/50 backdrop-blur-md">
  
  {/* UI FOR LOGGED IN USERS */}
  <SignedIn>
    <div className="p-4 space-y-2">
      {/* Mini Profile Section */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 mb-2">
        <UserButton 
          afterSignOutUrl="/?message=logout-success" 
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8 rounded-lg"
            }
          }}
        />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white uppercase tracking-tight">Active Session</span>
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Pro Account</span>
        </div>
      </div>

      {/* Actual Logout Button */}
      <SignOutButton>
  {/* Remove signOutCallback from here */}
  <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all group">
    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
    Sign Out Terminal
  </button>
</SignOutButton>
    </div>
  </SignedIn>

  {/* UI FOR LOGGED OUT USERS */}
  <SignedOut>
    <div className="p-4">
      <SignInButton mode="modal">
        <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
          <LogIn size={16} />
          Login
        </button>
      </SignInButton>
    </div>
  </SignedOut>
</div>
    </aside>
  );
}