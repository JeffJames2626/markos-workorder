"use client";

import { Badge, Button } from "@heroui/react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function NavHeader({ role }: { role: string }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-5 h-14"
      style={{
        background: "var(--color-surface, #161616)",
        borderBottom: "2px solid #ee4f9a",
      }}
    >
      {/* Brand */}
      <Link href="/workorder" className="flex items-baseline gap-1.5">
        <span
          className="uppercase"
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--color-foreground, #fff)",
            fontFamily: "var(--font-barlow, sans-serif)",
            letterSpacing: "0.14em",
          }}
        >
          Marko&apos;s
        </span>
        <span
          className="uppercase"
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "#ee4f9a",
            fontFamily: "var(--font-barlow, sans-serif)",
            letterSpacing: "0.14em",
          }}
        >
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
