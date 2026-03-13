"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion, Checkbox, Card, Button, Input } from "@heroui/react";
import { BASE_CATALOG } from "@/lib/parts-catalog";

interface Part {
  id: string;
  category: string;
  itemName: string;
  quantity: number;
  isCustom: boolean;
}

type PartSelection = Record<string, number>; // "Category||ItemName" → qty

interface PartsEditorProps {
  orderId: string;
  parts: Part[];
}

function partsToSelection(parts: Part[]): PartSelection {
  const sel: PartSelection = {};
  for (const p of parts) {
    sel[`${p.category}||${p.itemName}`] = p.quantity;
  }
  return sel;
}

function selectionToApi(sel: PartSelection) {
  return Object.entries(sel)
    .filter(([, qty]) => qty > 0)
    .map(([key, quantity]) => {
      const [category, itemName] = key.split("||");
      const catalogItems = BASE_CATALOG[category]?.items ?? [];
      const isCustom = !catalogItems.includes(itemName);
      return { category, itemName, quantity, isCustom };
    });
}

export function PartsEditor({ orderId, parts }: PartsEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<PartSelection>(() => partsToSelection(parts));
  const [saving, setSaving] = useState(false);
  const [newPartCategory, setNewPartCategory] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState("");

  const togglePart = (key: string) => {
    const next = { ...data };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 1;
    }
    setData(next);
  };

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) {
      const next = { ...data };
      delete next[key];
      setData(next);
    } else {
      setData({ ...data, [key]: qty });
    }
  };

  const addCustomPart = () => {
    if (!newPartCategory || !newPartName.trim()) return;
    const key = `${newPartCategory}||${newPartName.trim()}`;
    setData({ ...data, [key]: 1 });
    setNewPartName("");
    setNewPartCategory(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts: selectionToApi(data) }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      // stay in edit mode
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setData(partsToSelection(parts));
    setEditing(false);
  };

  const selectedCount = Object.values(data).filter((q) => q > 0).length;

  // Read-only view
  if (!editing) {
    return (
      <Card variant="default">
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title>Parts ({parts.length})</Card.Title>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors"
            >
              Edit
            </button>
          </div>
        </Card.Header>
        <Card.Content>
          {parts.length === 0 ? (
            <p className="text-sm text-muted">No parts added</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {parts.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {p.itemName}
                    {p.isCustom && <span className="text-muted ml-1">(custom)</span>}
                  </span>
                  <span className="text-muted">x{p.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    );
  }

  // Edit view
  return (
    <Card variant="default">
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <Card.Title>
            Parts ({selectedCount})
          </Card.Title>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-xs font-medium text-muted px-2 py-1 rounded-lg active:bg-default transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <Accordion>
          {Object.entries(BASE_CATALOG).map(([category, { icon, items }]) => {
            const categoryParts = Object.entries(data).filter(
              ([key, qty]) => key.startsWith(category + "||") && qty > 0
            );

            return (
              <Accordion.Item key={category} id={category}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    <div className="flex items-center gap-2 flex-1">
                      <span>{icon}</span>
                      <span>{category}</span>
                      {categoryParts.length > 0 && (
                        <span className="ml-auto text-xs text-accent font-medium">
                          {categoryParts.length}
                        </span>
                      )}
                    </div>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <div className="flex flex-col gap-1">
                    {items.map((item) => {
                      const key = `${category}||${item}`;
                      const qty = data[key] ?? 0;
                      const selected = qty > 0;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 px-1"
                        >
                          <Checkbox
                            isSelected={selected}
                            onChange={() => togglePart(key)}
                          >
                            <span className="text-sm">{item}</span>
                          </Checkbox>

                          {selected && (
                            <div className="flex items-center gap-2">
                              <button
                                className="w-7 h-7 rounded-lg bg-surface-secondary text-foreground flex items-center justify-center text-sm font-medium"
                                onClick={() => setQty(key, qty - 1)}
                              >
                                −
                              </button>
                              <span className="text-sm font-medium w-6 text-center tabular-nums">
                                {qty}
                              </span>
                              <button
                                className="w-7 h-7 rounded-lg bg-surface-secondary text-foreground flex items-center justify-center text-sm font-medium"
                                onClick={() => setQty(key, qty + 1)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom parts already in this category (not in catalog) */}
                    {categoryParts
                      .filter(([key]) => !items.includes(key.split("||")[1]))
                      .map(([key]) => {
                        const itemName = key.split("||")[1];
                        const qty = data[key] ?? 0;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2 px-1"
                          >
                            <Checkbox
                              isSelected={true}
                              onChange={() => togglePart(key)}
                            >
                              <span className="text-sm">{itemName} <span className="text-muted">(custom)</span></span>
                            </Checkbox>
                            <div className="flex items-center gap-2">
                              <button
                                className="w-7 h-7 rounded-lg bg-surface-secondary text-foreground flex items-center justify-center text-sm font-medium"
                                onClick={() => setQty(key, qty - 1)}
                              >
                                −
                              </button>
                              <span className="text-sm font-medium w-6 text-center tabular-nums">
                                {qty}
                              </span>
                              <button
                                className="w-7 h-7 rounded-lg bg-surface-secondary text-foreground flex items-center justify-center text-sm font-medium"
                                onClick={() => setQty(key, qty + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Add custom part */}
                    {newPartCategory === category ? (
                      <div className="flex gap-2 mt-2">
                        <Input
                          aria-label="Custom part name"
                          placeholder="Part name"
                          value={newPartName}
                          onChange={(e) => setNewPartName(e.target.value)}
                          fullWidth
                        />
                        <Button variant="primary" size="sm" onPress={addCustomPart}>
                          Add
                        </Button>
                        <Button variant="ghost" size="sm" onPress={() => setNewPartCategory(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="text-sm text-accent mt-2 text-left py-1"
                        onClick={() => {
                          setNewPartCategory(category);
                          setNewPartName("");
                        }}
                      >
                        + New Part
                      </button>
                    )}
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Card.Content>
    </Card>
  );
}
