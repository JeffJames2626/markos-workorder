"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface BottomNavProps {
  role: string;
  userName: string;
  userEmail: string;
}

export function BottomNav({ role, userName, userEmail }: BottomNavProps) {
  if (role === "admin") {
    return <AdminNav userName={userName} userEmail={userEmail} />;
  }
  return <TechNav />;
}

/* ─── Admin: pill bar with history / new WO / menu drawer ─── */

function AdminNav({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHistory = pathname === "/history";

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between w-64 px-8 py-2 rounded-full bg-[#262626]">
          {/* History */}
          <Link href="/history" aria-label="History">
            <svg
              width="28" height="28" viewBox="0 0 32 32" fill="none"
              stroke={isHistory ? "#cc367e" : "#a3a3a3"}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 16a10 10 0 1 1 3 7.07" />
              <polyline points="16 10 16 16 20 18" />
              <polyline points="6 12 6 17 11 17" />
            </svg>
          </Link>

          {/* New Work Order FAB */}
          <button
            onClick={() => router.push("/workorder/new")}
            aria-label="New work order"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#cc367e] active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Menu button */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
          >
            <svg
              width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#a3a3a3" strokeWidth="1.8" strokeLinecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Admin drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setDrawerOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Drawer panel — slides up from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#171717] rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ height: "85dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* User card */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#cc367e]/20 flex items-center justify-center">
                  <span className="text-[#cc367e] font-semibold text-base">
                    {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{userName}</span>
                  <span className="text-xs text-white/50">{userEmail}</span>
                </div>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#cc367e] bg-[#cc367e]/15 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex-1 px-5 py-4">
              <nav className="flex flex-col gap-1">
                <DrawerLink
                  href="/clients"
                  label="Clients"
                  active={pathname === "/clients"}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                  onNavigate={() => setDrawerOpen(false)}
                />
                <DrawerLink
                  href="/users"
                  label="Users"
                  active={pathname === "/users"}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                  onNavigate={() => setDrawerOpen(false)}
                />
              </nav>
            </div>

            {/* Sign out */}
            <div className="px-5 pb-6" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full py-3 rounded-xl text-sm font-medium text-white/60 bg-white/5 active:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DrawerLink({
  href,
  label,
  active,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-[#cc367e]/15 text-[#cc367e]"
          : "text-white/70 active:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

/* ─── Tech: expandable FAB in bottom-right ─── */

function TechNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{
        bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        right: "20px",
      }}
    >
      {/* Expanded actions */}
      {open && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />

          {/* History button */}
          <button
            onClick={() => { setOpen(false); router.push("/history"); }}
            className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-[#262626] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <span className="text-sm font-medium text-white/80">History</span>
            <svg
              width="20" height="20" viewBox="0 0 32 32" fill="none"
              stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 16a10 10 0 1 1 3 7.07" />
              <polyline points="16 10 16 16 20 18" />
              <polyline points="6 12 6 17 11 17" />
            </svg>
          </button>

          {/* New Work Order button */}
          <button
            onClick={() => { setOpen(false); router.push("/workorder/new"); }}
            className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full bg-[#262626] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <span className="text-sm font-medium text-white/80">New Order</span>
            <div className="w-8 h-8 rounded-full bg-[#cc367e] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </button>
        </>
      )}

      {/* Main FAB toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg active:scale-95 transition-all duration-200 ${
          open ? "bg-[#262626] rotate-45" : "bg-[#cc367e]"
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
