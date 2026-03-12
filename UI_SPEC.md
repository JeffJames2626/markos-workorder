# Marko's Sprinklers — Work Order System UI Spec

> Reference document for rebuilding the UI from scratch with HeroUI v3.
> All features, data shapes, flows, and visual design captured here.

---

## 1. Pages & Routing

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Redirect only — auth → `/workorder`, no auth → `/login` | — |
| `/login` | Credentials login form | Redirect to `/workorder` if already authed |
| `/workorder` | 5-step work order wizard | Required |
| `/history` | Work order history list | Required |

---

## 2. Wizard Flow (5 Steps)

Steps: **Job Info → Time → Parts → Notes → Review**

### Navigation Rules
- Back available on steps 1–4
- Next on step 0 disabled until: `client`, `address`, `tech`, `date` all non-empty
- Steps 1, 2, 3 always allow Next
- Step 4 has Submit button instead of Next (green gradient)
- No step skipping — sequential only
- Going back preserves all state

### Step 0 — Job Info
Fields:
- **Service Type** (optional) — 5 toggle buttons in 2-col grid:
  - Sprinkler Turn On, Sprinkler Adjustment, Sprinkler Repair, Sprinkler Blowout, Backflow Test
- **Client Name*** — text input
- **Service Address*** — text input
- **Phone** — tel input
- **Technician*** — read-only, auto-filled from session user name
- **Date*** — date input, defaults to today
- **Completed?** — select: `Y` = Done, `N` = Return Visit, `P` = Partial

### Step 1 — Time on Site
Timer interface with 4 states (see Section 6).

Displays:
- Large billable time counter (48px monospace)
- Status text label
- Non-billable time (if > 0)
- Control buttons (vary by state)
- Summary box when stopped
- Info tip explaining billable vs non-billable

### Step 2 — Parts
- Category accordion (9 categories, collapsible)
- Each part: checkbox + quantity stepper (−, number, +) when selected
- Custom parts badge per category
- "+ New Part" button opens bottom-sheet modal
- Can submit with 0 parts selected

### Step 3 — Notes
- **Number of Zones** — select, 1–100, optional
- **Description of Work** — textarea, resizable, min 80px
- **Additional Repairs Needed** — textarea, resizable, min 72px

### Step 4 — Review & Submit
Read-only summary of all data plus:
- **Technician Signature** — large text input (condensed font), date picker, preview shows typed name
- **Client Signature** — same as tech, OR toggle "No client present" (amber warning shown)
- Submit button: POST to API, attempt email (non-fatal), show success screen

---

## 3. Success Screen
Shows after submit:
- ✅ "ORDER SUBMITTED" / ⚠️ "SAVED LOCALLY" (if email failed)
- Summary: Client, Tech, Date, Billable Hrs, Parts count
- "New Work Order" button (resets all state, returns to step 0)
- "View History" button (navigates to `/history`)

---

## 4. History / Admin View

- Admin role sees all work orders; tech role sees own only
- Expandable cards sorted by newest first
- Collapsed: client name, date, tech, parts count, billable hrs, status badge
- Expanded: full details including parts, description, repairs, signoffs, time summary
- Delete button with `window.confirm()` → DELETE API call

**Status Badges:**
| Value | Label | Color | BG |
|-------|-------|-------|----|
| Y | DONE | #22c55e | #14532d |
| N | RETURN | #60a5fa | #1e3a5f |
| P | PARTIAL | #fbbf24 | #3d2c00 |

---

## 5. Login
- Email + password fields
- Error: "Invalid email or password"
- Button shows "Signing in..." while loading
- On success: redirect to `/workorder`
- Header: "MARKO'S SPRINKLERS" / "WORK ORDER SYSTEM"

---

## 6. Timer State Machine

States: `idle → running ↔ paused → stopped`

| State | Display | Actions |
|-------|---------|---------|
| idle | "TAP TO START", white | Clock In |
| running | "● RUNNING", PINK | Pause, Clock Out |
| paused | "⏸ PAUSED — NOT BILLING", AMBER | Resume, Clock Out |
| stopped | "✓ CLOCKED OUT", GREEN | Reset Timer |

**Internal tracking:**
- `billableSecs` — accumulated seconds while running
- `pausedSecs` — accumulated seconds while paused
- `segStart` — timestamp when current segment started
- `liveSecs` — ticks every 500ms from segStart
- `currentBillable = billableSecs + (running ? liveSecs : 0)`
- `currentPaused = pausedSecs + (paused ? liveSecs : 0)`
- `totalOnSite = currentBillable + currentPaused`

**Floating Pause Pill:**
- Visible when running or paused AND not on step 1
- Fixed position, top 74px, centered
- Shows live time + Pause/Resume button
- Pulse animation when running

---

## 7. Parts Catalog

9 categories:

| Category | Icon |
|----------|------|
| Clocks / Controllers | ⏱ |
| Valves | 🔧 |
| Heads | 💧 |
| Nozzles | 🌊 |
| Pipe | 〰 |
| Fittings | 🔩 |
| Wire / Wire Nuts | ⚡ |
| Drip | 🪴 |
| Backflows / Boxes | 📦 |

Full item lists are in `lib/parts-catalog.ts`.

**Part key format:** `"Category||ItemName"` → quantity
**Custom parts:** Saved to DB per user, appended to category, marked "custom"

---

## 8. Data Shapes

### JobInfo
```typescript
{ client, address, phone, tech, date, zones, completed, service }
```

### PartSelection
```typescript
Record<"Category||ItemName", quantity: number>
```

### SignoffData
```typescript
{ techSig, techDate, clientSig, clientDate, clientAbsent: boolean }
```

### Work Order POST body
```typescript
{
  clientName, address, phone?, serviceType?, date, zones?, completed,
  techName, clockInTime?, clockOutTime?, billableSecs, pausedSecs,
  description?, repairs?, techSig?, techSigDate?, clientSig?,
  clientSigDate?, clientAbsent,
  parts: [{ category, itemName, quantity, isCustom }]
}
```

---

## 9. Color Scheme

| Name | Hex | Usage |
|------|-----|-------|
| Pink (primary) | `#ee4f9a` | Buttons, active states, accents |
| Pink dark | `#c9367e` | Gradient end |
| Green | `#22c55e` | Success, clock out |
| Green dark | `#16a34a` | Gradient end |
| Amber | `#f59e0b` | Paused, warnings |
| Amber dark | `#d97706` | Gradient end |
| Background | `#0d0d0d` | Page background |
| Card | `#161616` | Cards, header |
| Surface | `#1e1e1e` | Inputs, nested items |
| Border | `#2a2a2a` | All borders |
| Muted | `#888` | Secondary text |
| Subtext | `#aaaaaa` | Tertiary text |
| Disabled | `#444` | Disabled text |
| White | `#ffffff` | Primary text |

**Gradients:**
- Primary CTA: `linear-gradient(135deg, #ee4f9a, #c9367e)`
- Success: `linear-gradient(135deg, #22c55e, #16a34a)`
- Pause: `linear-gradient(135deg, #f59e0b, #d97706)`

**Special backgrounds:**
- Selected part row: `#1f0a15`
- Open category: `#1a0a11`
- Info tip: `#0d0d14` border `#2a2a3a` text `#6666aa`

---

## 10. Typography

| Font | Weights | Variable | Usage |
|------|---------|----------|-------|
| Barlow Condensed | 700, 800 | `--font-barlow` | Headers, brand, signatures display |
| DM Mono | 400, 500 | `--font-dm-mono` | Timer, numbers, metadata, labels |
| DM Sans | 400–700 | `--font-dm-sans` | Body, inputs, buttons |

| Element | Font | Size | Weight | Letter spacing |
|---------|------|------|--------|----------------|
| App title | Condensed | 20px | 800 | 2px |
| Big clock | Mono | 48px | 500 | 2px |
| Section label | Mono | 10px | 700 | 0.12–0.15em, uppercase |
| Body / inputs | Sans | 13–15px | 400–600 | — |
| Buttons | Sans | 13–18px | 700 | — |
| Signature display | Condensed | 18–22px | 700 | 1px |
| Subtitles | Mono | 9px | 400 | 0.15em |

---

## 11. Layout

- **Max width:** 480px, centered (`mx-auto`)
- **Header:** Sticky top, 3px pink bottom border
- **Footer nav:** Fixed bottom, z-50
- **Content area:** flex-1, overflow-y-auto, padding bottom 100px (for footer)
- **Floating pill:** Fixed top 74px, centered, z-100
- **Scrollbars:** Hidden via CSS

**Border radius:**
- Inputs: 8–10px
- Cards: 10–12px
- Buttons: 10–12px
- Modals: 16px top corners only
- Pills: 30px

---

## 12. Animations

| Class | Keyframes | Duration | Trigger |
|-------|-----------|----------|---------|
| `.fade-up` | opacity 0→1, translateY 10→0 | 220ms ease | Page/section entry |
| `.pulse` | opacity 1→0.5→1 | 1.4s ease-in-out infinite | Timer running |
| `.btn:active` | scale(0.97) | instant | Button press |
| `.trow:active` | scale(0.98) | instant | Row/card press |

---

## 13. Auth & Session

- NextAuth v5, credentials provider, JWT sessions
- `session.user: { id, name, email, role: "admin" | "tech" }`
- Middleware protects all routes except `/login` and `/api/auth/*`
- Admin role: sees all work orders in history
- Tech role: sees only own work orders

---

## 14. API Routes (keep as-is)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth |
| GET | `/api/work-orders` | List work orders |
| POST | `/api/work-orders` | Create work order |
| GET | `/api/work-orders/[id]` | Single order |
| DELETE | `/api/work-orders/[id]` | Delete order |
| POST | `/api/email` | Send email via Resend |
| GET | `/api/custom-parts` | List user's custom parts |
| POST | `/api/custom-parts` | Create custom part |

---

## 15. Utility Functions (keep as-is)

- `fmtSecs(secs)` — "1h 2m" / "2m 5s" / "30s"
- `fmtHrs(secs)` — "1.50" decimal hours, null if 0
- `fmtTime(ms)` — "02:31 PM" locale time string
- `serializePrisma(data)` — converts BigInt → number for JSON
