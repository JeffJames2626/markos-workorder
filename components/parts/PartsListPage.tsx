"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion, Card, Button, Input } from "@heroui/react";
import { BASE_CATALOG } from "@/lib/parts-catalog";

interface CustomPart {
  id: string;
  category: string;
  itemName: string;
}

export function PartsListPage({ customParts: initial }: { customParts: CustomPart[] }) {
  const router = useRouter();
  const [customParts, setCustomParts] = useState(initial);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState("");
  const [saving, setSaving] = useState(false);

  const customByCategory = customParts.reduce<Record<string, CustomPart[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!addingCategory || !newPartName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/custom-parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: addingCategory, itemName: newPartName.trim() }),
    });
    if (res.ok) {
      const part = await res.json();
      setCustomParts((prev) => [...prev, part]);
      setNewPartName("");
      setAddingCategory(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/custom-parts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomParts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Parts Catalog</h1>
      <p className="text-xs text-muted">
        Browse the parts catalog and add custom parts. Custom parts will appear in the work order parts chooser.
      </p>

      <Accordion>
        {Object.entries(BASE_CATALOG).map(([category, { icon, items }]) => {
          const custom = customByCategory[category] ?? [];
          const totalCount = items.length + custom.length;

          return (
            <Accordion.Item key={category} id={category}>
              <Accordion.Heading>
                <Accordion.Trigger>
                  <div className="flex items-center gap-2 flex-1">
                    <span>{icon}</span>
                    <span>{category}</span>
                    <span className="ml-auto text-xs text-muted font-medium">
                      {totalCount}
                    </span>
                  </div>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <div className="flex flex-col gap-1">
                  {/* Base catalog items */}
                  {items.map((item) => (
                    <div key={item} className="flex items-center py-2 px-1">
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}

                  {/* Custom parts */}
                  {custom.map((part) => (
                    <div key={part.id} className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{part.itemName}</span>
                        <span className="text-[10px] text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">
                          Custom
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(part.id)}
                        className="text-muted active:text-danger p-1"
                        aria-label={`Delete ${part.itemName}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add custom part */}
                  {addingCategory === category ? (
                    <div className="flex gap-2 mt-2">
                      <Input
                        aria-label="Custom part name"
                        placeholder="Part name"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        fullWidth
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAdd();
                        }}
                      />
                      <Button variant="primary" size="sm" isPending={saving} onPress={handleAdd}>
                        Add
                      </Button>
                      <Button variant="ghost" size="sm" onPress={() => setAddingCategory(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="text-sm text-accent mt-2 text-left py-1"
                      onClick={() => {
                        setAddingCategory(category);
                        setNewPartName("");
                      }}
                    >
                      + Add Custom Part
                    </button>
                  )}
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
}
