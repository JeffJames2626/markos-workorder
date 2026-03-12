export interface CatalogCategory {
  icon: string;
  items: string[];
}

export const BASE_CATALOG: Record<string, CatalogCategory> = {
  "Clocks / Controllers": {
    icon: "⏱",
    items: [
      "Hunter X2 4-Station",
      "Hunter X2 6-Station",
      "Hunter X2 8-Station",
      "Hunter X2 14-Station",
      "Hunter WAND WiFi",
      "Other / See Custom",
    ],
  },
  Valves: {
    icon: "🔧",
    items: [
      '1" Irritrol 2400T',
      '1" RB 100DV',
      '1" Hunter PGV',
      "24V Solenoid Repl",
      "Diaphragm Repair Kit",
      "Other / See Custom",
    ],
  },
  Heads: {
    icon: "💧",
    items: [
      '4" PGP-ADJ',
      '4" PGP Ultra',
      '4" PRS40',
      '4" PRS30',
      '4" PRS30 CkVlv',
      '4" Hunter SRM (1/2")',
    ],
  },
  Nozzles: {
    icon: "🌊",
    items: [
      "MP 1000",
      "MP 2000",
      "MP 3000",
      "ADJ VAN Nozzle",
      "Fixed VAN Nozzle",
      "Other / See Custom",
    ],
  },
  Pipe: {
    icon: "〰",
    items: [
      '1/2" Poly/ft',
      '3/4" Poly/ft',
      '1" Poly/ft',
      "Funny Pipe/ft",
      '___" PVC SCH40/ft',
    ],
  },
  Fittings: {
    icon: "🔩",
    items: [
      'Poly Coupling ___"',
      'Poly Elbow ___"',
      'Poly Tee ___"',
      'Poly MIPT Adapter ___"',
      'Poly FIPT Adapter ___"',
      'Poly Cap / Plug ___"',
    ],
  },
  "Wire / Wire Nuts": {
    icon: "⚡",
    items: [
      "18G 13 Wire/ft",
      "Blue Wire Nut",
      "18G 9 Wire/ft",
      "Black Wire Nut",
      "18G 5 Wire/ft",
      "3M DBR-Y6 Splice Kit",
    ],
  },
  Drip: {
    icon: "🪴",
    items: [
      '1/4" Drip Tube/ft',
      '1/4" Fittings',
      "Micro Sprayer",
      'Risers ___" x ___"',
      "Drip Emitters",
      "Drip Spray Spike",
    ],
  },
  "Backflows / Boxes": {
    icon: "📦",
    items: [
      '1" Wilkins Backflow',
      '(___") Round Box',
      '1" Wilkins PVB',
      "Standard Valve Box",
      "Tape / Glue / Solder",
      "Jumbo Valve Box",
    ],
  },
};
