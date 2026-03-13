"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePushNotifications } from "@/components/pwa/PushSubscriber";
import { QuickCreateSheet } from "@/components/home/QuickCreateSheet";

type Client = { id: string; name: string; address?: string | null; phone?: string | null };

interface BottomNavProps {
  role: string;
  userName: string;
  userEmail: string;
  clients?: Client[];
  techName?: string;
}

export function BottomNav({ role, userName, userEmail, clients = [], techName = "" }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = role === "admin";
  const push = usePushNotifications(role);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-overlay border-t border-border"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between px-6 py-3 max-w-[480px] mx-auto">
          {/* Home */}
          <Link href="/workorder" aria-label="Home" className={`p-2 ${pathname === "/workorder" ? "text-accent" : "text-muted"}`}>
            <svg
              width="24" height="24" viewBox="0 0 32 32" fill="none"
              stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M5 14L16 5L27 14V26H20V20H12V26H5V14Z" />
            </svg>
          </Link>

          {/* History */}
          <Link href="/history" aria-label="History" className={`p-2 ${pathname === "/history" || pathname.startsWith("/history/") ? "text-accent" : "text-muted"}`}>
            <svg
              width="24" height="24" viewBox="0 0 32 32" fill="none"
              stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M6 16a10 10 0 1 1 3 7.07" />
              <polyline points="16 10 16 16 20 18" />
              <polyline points="6 12 6 17 11 17" />
            </svg>
          </Link>

          {/* Add (New Work Order) */}
          <button
            onClick={() => setCreateOpen(true)}
            aria-label="New work order"
            className="flex items-center justify-center w-[82px] h-12 rounded-full bg-accent text-accent-foreground active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Clients */}
          <Link href="/clients" aria-label="Clients" className={`p-2 ${pathname === "/clients" ? "text-accent" : "text-muted"}`}>
            <svg
              width="24" height="24" viewBox="0 0 32 32" fill="none"
              stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="16" cy="10" r="4" />
              <path d="M8 26v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
              <circle cx="25" cy="11" r="3" />
              <path d="M25 17a5 5 0 0 1 4 5v2" />
              <circle cx="7" cy="11" r="3" />
              <path d="M7 17a5 5 0 0 0-4 5v2" />
            </svg>
          </Link>

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            className={`p-2 ${moreOpen ? "text-accent" : "text-muted"}`}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor"
              strokeWidth="2" strokeLinecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Quick create sheet */}
      <QuickCreateSheet
        clients={clients}
        techName={techName}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Drawer panel */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-overlay rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ maxHeight: "85dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* User card */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center">
                  <span className="text-accent font-semibold text-base">
                    {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-overlay-foreground">{userName}</span>
                  <span className="text-xs text-muted">{userEmail}</span>
                </div>
                {isAdmin && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Admin links */}
            {isAdmin && (
              <div className="px-5 py-4 border-b border-border">
                <nav className="flex flex-col gap-1">
                  <DrawerLink
                    href="/users"
                    label="Manage Users"
                    active={pathname === "/users"}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                    onNavigate={() => setMoreOpen(false)}
                  />
                </nav>
              </div>
            )}

            {/* Toggles */}
            <div className="px-5 py-4 flex flex-col gap-1">
              <ThemeToggle />
              {isAdmin && push.supported && (
                <PushToggle
                  subscribed={push.subscribed}
                  loading={push.loading}
                  onToggle={async () => {
                    if (push.subscribed) {
                      await push.unsubscribe();
                    } else {
                      await push.subscribe();
                    }
                  }}
                />
              )}
            </div>

            {/* Sign out */}
            <div className="px-5 pb-6" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full py-3 rounded-xl text-sm font-medium text-muted bg-default active:bg-default-hover transition-colors"
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

/* ─── Theme toggle ─── */

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-between w-full py-3 px-3 rounded-xl text-sm font-medium text-overlay-foreground active:bg-default transition-colors"
    >
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </>
          )}
        </svg>
        <span>{isDark ? "Dark mode" : "Light mode"}</span>
      </div>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${isDark ? "bg-accent" : "bg-default"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${isDark ? "left-5 bg-accent-foreground" : "left-1 bg-overlay-foreground"}`} />
      </div>
    </button>
  );
}

/* ─── Push toggle ─── */

function PushToggle({
  subscribed,
  loading,
  onToggle,
}: {
  subscribed: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center justify-between w-full py-3 px-3 rounded-xl text-sm font-medium text-overlay-foreground active:bg-default transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Notifications</span>
      </div>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${subscribed ? "bg-accent" : "bg-default"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${subscribed ? "left-5 bg-accent-foreground" : "left-1 bg-overlay-foreground"}`} />
      </div>
    </button>
  );
}

/* ─── Drawer link ─── */

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
          ? "bg-accent-soft text-accent"
          : "text-overlay-foreground active:bg-default"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
