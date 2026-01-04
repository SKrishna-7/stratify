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

  {/* BRAND HEADER */}
 {/* BRAND HEADER */}
<div className="px-6 py-8 border-b border-zinc-900/60">
  <div className="flex flex-col gap-1">
    <h1 className="text-2xl font-extrabold text-white tracking-tight">
      Stratify
    </h1>
    <p className="text-[11px] font-medium text-zinc-500 tracking-wide">
      Structured Preparation Platform
    </p>
  </div>
</div>

  <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto scrollbar-thin">
    {menuItems.map((item) => {
      const isActive =
        item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={`
            group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
            ${
              isActive
                ? "bg-zinc-900 text-white border border-zinc-800"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }
          `}
        >
          <item.icon
            size={18}
            className={`transition-colors ${
              isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
            }`}
          />
          <span>{item.label}</span>
        </Link>
      );
    })}
  </nav>

  {/* FOOTER */}
  <div className="border-t border-zinc-900 bg-black/60 backdrop-blur-md">

    <SignedIn>
      <div className="p-4 space-y-3">

        {/* MINI PROFILE */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <UserButton
            afterSignOutUrl="/?message=logout-success"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 rounded-lg",
              },
            }}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-white">
              Active Session
            </span>
            {/* <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
              Pro Account
            </span> */}
          </div>
        </div>

        {/* LOGOUT */}
        <SignOutButton>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut size={16} />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </SignedIn>

    <SignedOut>
      <div className="p-4">
        <SignInButton mode="modal">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
            <LogIn size={16} />
            Sign in
          </button>
        </SignInButton>
      </div>
    </SignedOut>

  </div>
</aside>

  );
}