"use client";

import { fmtHrs } from "@/lib/utils";

type Order = {
  id: string;
  clientName: string;
  address: string;
  serviceType: string | null;
  date: string;
  completed: string;
  billableSecs: number;
  techName: string;
  parts: { id: string }[];
};

export function RecentActivity({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-surface h-[120px]">
        <p className="text-sm text-muted">No work orders yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const hrs = fmtHrs(order.billableSecs);

        return (
          <div
            key={order.id}
            className="bg-surface rounded-xl p-4 flex items-center gap-2 active:scale-[0.98] transition-transform duration-100"
          >
            {/* Text content */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <p className="text-xs font-medium text-foreground tracking-tight">
                {order.clientName}
              </p>
              <p className="text-base font-medium text-foreground tracking-tight truncate">
                {order.address}
              </p>
            </div>

            {/* Hours badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-foreground">
                {hrs ? `${hrs} h` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
