// Prisma returns BigInt for clock times — convert to number for JSON serialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePrisma<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

export function fmtSecs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function fmtHrs(secs: number): string | null {
  return secs > 0 ? (secs / 3600).toFixed(2) : null;
}

export function fmtTime(ms: number | bigint | null | undefined): string {
  if (!ms) return "—";
  return new Date(Number(ms)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
