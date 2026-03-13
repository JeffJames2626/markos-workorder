"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Select, ListBox, Label, Button, Modal, useOverlayState } from "@heroui/react";

type Tech = { id: string; name: string };

interface PendingOrder {
  id: string;
  clientName: string;
  address: string;
  date: string;
  techName: string;
  userId: string | null;
  description: string | null;
}

interface PendingOrdersProps {
  orders: PendingOrder[];
  isAdmin: boolean;
  techs: Tech[];
}

export function PendingOrders({ orders, isAdmin, techs }: PendingOrdersProps) {
  const router = useRouter();
  const [techFilter, setTechFilter] = useState("all");
  const reassignModal = useOverlayState();
  const [reassignOrderId, setReassignOrderId] = useState<string | null>(null);
  const [reassignTechId, setReassignTechId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const filtered = orders.filter((o) => {
    if (!isAdmin) return true;
    if (techFilter === "all") return true;
    return o.userId === techFilter;
  });

  const openReassign = (orderId: string) => {
    setReassignOrderId(orderId);
    setReassignTechId(null);
    reassignModal.open();
  };

  const handleReassign = async () => {
    if (!reassignOrderId || !reassignTechId) return;
    const tech = techs.find((t) => t.id === reassignTechId);
    if (!tech) return;
    setReassigning(true);
    try {
      const res = await fetch(`/api/work-orders/${reassignOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: reassignTechId, techName: tech.name }),
      });
      if (!res.ok) throw new Error();
      reassignModal.close();
      router.refresh();
    } catch {
      // stay open
    }
    setReassigning(false);
  };

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-surface h-[120px]">
        <p className="text-sm text-muted">No pending work orders</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Admin tech filter */}
        {isAdmin && techs.length > 0 && (
          <Select
            aria-label="Filter by tech"
            placeholder="Filter by tech"
            fullWidth
            selectedKey={techFilter}
            onSelectionChange={(key) => setTechFilter(key as string)}
          >
            <Label className="sr-only">Filter by tech</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item key="all" id="all" textValue="All Techs">
                  All Techs
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {techs.map((t) => (
                  <ListBox.Item key={t.id} id={t.id} textValue={t.name}>
                    {t.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        <p className="text-xs text-muted">
          {filtered.length} pending order{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">
            No pending work orders for this tech.
          </div>
        ) : (
          filtered.map((order) => (
            <Card
              key={order.id}
              variant="default"
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => router.push(`/history/${order.id}`)}
            >
              <Card.Content>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{order.clientName}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{order.address}</p>
                    </div>
                    <span className="text-xs font-medium text-accent shrink-0 ml-2">Pending</span>
                  </div>

                  {order.description && (
                    <p className="text-xs text-muted line-clamp-2">{order.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{order.date}</span>
                    {isAdmin && <span>{order.techName}</span>}
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openReassign(order.id);
                        }}
                        className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors"
                      >
                        Reassign
                      </button>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>

      {/* Reassign Modal */}
      <Modal.Backdrop isOpen={reassignModal.isOpen} onOpenChange={reassignModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Reassign Work Order</Modal.Heading>
              <p className="text-sm text-muted">Select a technician to assign this work order to.</p>
            </Modal.Header>
            <Modal.Body>
              <Select
                aria-label="Assign to tech"
                placeholder="Select tech"
                fullWidth
                selectedKey={reassignTechId}
                onSelectionChange={(key) => setReassignTechId(key as string)}
              >
                <Label className="sr-only">Technician</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {techs.map((t) => (
                      <ListBox.Item key={t.id} id={t.id} textValue={t.name}>
                        {t.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={reassigning}
                isDisabled={!reassignTechId || reassigning}
                onPress={handleReassign}
              >
                {reassigning ? "Reassigning..." : "Reassign"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
