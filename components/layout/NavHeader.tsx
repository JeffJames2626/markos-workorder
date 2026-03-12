"use client";

import { Badge, Button } from "@heroui/react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function NavHeader({ role }: { role: string }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-5 h-14 bg-surface border-b-2 border-accent"
    >
      {/* Brand */}
      <Link href="/workorder" className="flex items-baseline gap-1.5">
        <span className="uppercase text-[17px] font-extrabold text-foreground tracking-[0.14em]">
          Marko&apos;s
        </span>
        <span className="uppercase text-[17px] font-extrabold text-accent tracking-[0.14em]">
          Sprinklers
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Badge
          color={role === "admin" ? "accent" : "default"}
          size="sm"
          variant="soft"
        >
          <Badge.Label>{role === "admin" ? "Admin" : "Tech"}</Badge.Label>
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onPress={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
