"use client";

import { useState, useEffect } from "react";
import { Accordion, Checkbox, Card, Button, Input } from "@heroui/react";
import { BASE_CATALOG } from "@/lib/parts-catalog";
import type { PartSelection } from "./types";

interface StepPartsProps {
  data: PartSelection;
  onChange: (data: PartSelection) => void;
}

interface CustomPart {
  id: string;
  category: string;
  itemName: string;
}

export function StepParts({ data, onChange }: StepPartsProps) {
  const [newPartCategory, setNewPartCategory] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState("");
  const [customParts, setCustomParts] = useState<CustomPart[]>([]);

  useEffect(() => {
    fetch("/api/custom-parts")
      .then((r) => r.json())
      .then(setCustomParts)
      .catch(() => {});
  }, []);

  const customByCategory = customParts.reduce<Record<string, CustomPart[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const togglePart = (key: string) => {
    const next = { ...data };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = 1;
    }
    onChange(next);
  };

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) {
      const next = { ...data };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...data, [key]: qty });
    }
  };

  const addCustomPart = () => {
    if (!newPartCategory || !newPartName.trim()) return;
    const key = `${newPartCategory}||${newPartName.trim()}`;
    onChange({ ...data, [key]: 1 });

    // Persist the custom part
    fetch("/api/custom-parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newPartCategory, itemName: newPartName.trim() }),
    })
      .then((r) => r.json())
      .then((part) => setCustomParts((prev) => [...prev, part]))
      .catch(() => {});

    setNewPartName("");
    setNewPartCategory(null);
  };

  const selectedCount = Object.values(data).filter((q) => q > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {selectedCount} part{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>

      <Accordion>
        {Object.entries(BASE_CATALOG).map(([category, { icon, items }]) => {
          const custom = customByCategory[category] ?? [];
          const customNames = custom.map((c) => c.itemName);
          const allItems = [...items, ...customNames.filter((name) => !items.includes(name))];

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
                  {allItems.map((item) => {
                    const key = `${category}||${item}`;
                    const qty = data[key] ?? 0;
                    const selected = qty > 0;
                    const isCustom = !items.includes(item);

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 px-1"
                      >
                        <Checkbox
                          isSelected={selected}
                          onChange={() => togglePart(key)}
                        >
                          <span className="text-sm">
                            {item}
                            {isCustom && (
                              <span className="ml-1.5 text-[10px] text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">
                                Custom
                              </span>
                            )}
                          </span>
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

                  {/* Add custom part for this category */}
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
    </div>
  );
}
