"use client";

import { useState } from "react";
import { 
  User, Mail, Lock, LogOut, Save, Loader2 
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { DashboardLoader } from "@components/Loader";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isLoaded) return (
     <DashboardLoader/>
   );

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await user.update({
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
      });
      alert("Profile updated");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 max-w-3xl mx-auto space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account & security</p>
      </div>

      {/* Profile Card */}
      <section className="bg-[#090909] border border-zinc-900 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.imageUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full border border-zinc-800"
          />
          <div>
            <p className="font-bold">{user?.fullName}</p>
            <p className="text-xs text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-zinc-500 uppercase tracking-widest">
            Display Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={user?.fullName || "Your name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
          </div>
        </div>
      </section>

      {/* Security */}
     
      {/* Danger Zone */}
      <section className="bg-[#090909] border border-red-900/40 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-red-500"></h3>

        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </section>
    </div>
  );
}
