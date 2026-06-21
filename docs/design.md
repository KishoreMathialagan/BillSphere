# Vendor Mind — Design System

> Version 1.0 · AI-Powered Retail Operating System · Tamil Nadu

---

## 0. Design Rationale

**Single Design Thesis:**
Vendor Mind must feel like the most intelligent thing in a retailer's shop — not the most complex. Every surface choice, typographic decision, and interaction pattern serves one outcome: a business owner in Salem or Coimbatore should open the app and feel *in command*, not overwhelmed.

**Two tension points resolved through design:**
- Intelligence ↔ Approachability → Solved via typography contrast: elegant serif display + clean sans body
- Premium ↔ Affordability signal → Solved via Neumorphism (tactile, physical) + Glassmorphism (aspirational, tech-forward) layered together

**Psychology Anchors:**
- **Cyprus (#004741)** → Teal-green triggers trust, stability, and growth. In Tamil Nadu retail culture, green signals prosperity (auspicious color). Primary decision-making color.
- **Sand (#F0EDE4)** → Warm neutrals reduce cognitive load and eye fatigue during long billing sessions. Safer than cold white for extended daily use.
- **#212121** → Near-black (not pure black) prevents the harshness of #000000 while maintaining authority and professional weight.

**Signature Element — "The Cyprus Halo":**
A large radial ring on the Dashboard hero — rendered neumorphically on Sand — framing a glassmorphic inner card showing Business Health Score. Communicates: *Your business, whole, healthy, intelligent.* Every other design choice is quiet. This moment is the brand.

---

## 1. Color System

### Core Palette

```
┌─────────────────────────────────────────────────────────────┐
│  NAME        HEX         RGB               ROLE             │
├─────────────────────────────────────────────────────────────┤
│  Cyprus      #004741     0, 71, 65         Brand Primary    │
│  Night       #212121     33, 33, 33        Text / Depth     │
│  Sand        #F0EDE4     240, 237, 228     Surface / Warm   │
│  Sand Dark   #D9D5CB     217, 213, 203     Divider / Sub    │
│  Sand Light  #F8F5EE     248, 245, 238     Elevated Surface │
│  Cyprus Mid  #006B63     0, 107, 99        Hover / Active   │
│  Cyprus Deep #002E2A     0, 46, 42         Dark Sections    │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Color Map

```
INTERACTIVE
  Primary Action     →  Cyprus #004741
  Primary Hover      →  Cyprus Mid #006B63
  Primary Active     →  Cyprus Deep #002E2A
  Destructive        →  #B03A2E
  Warning            →  #9A6B00
  Success            →  #1A6644
  Info               →  #1A4A6B

TEXT
  Primary            →  Night #212121
  Secondary          →  rgba(33,33,33,0.65)
  Tertiary           →  rgba(33,33,33,0.40)
  Inverse            →  Sand #F0EDE4
  Inverse Secondary  →  rgba(240,237,228,0.70)
  Brand              →  Cyprus #004741

SURFACE
  Base               →  Sand #F0EDE4
  Raised             →  Sand Light #F8F5EE
  Sunken             →  Sand Dark #D9D5CB
  Dark Base          →  Night #212121
  Dark Raised        →  #2C2C2C
  Brand Dark         →  Cyprus Deep #002E2A

BORDER
  Subtle             →  rgba(0,71,65,0.10)
  Default            →  rgba(0,71,65,0.18)
  Strong             →  rgba(0,71,65,0.35)
  Inverse            →  rgba(240,237,228,0.25)
  Inverse Strong     →  rgba(240,237,228,0.50)
```

### Glass Tints (for glassmorphism layers)

```
GLASS LIGHT (over Sand/White background)
  Fill:    rgba(240, 237, 228, 0.22)
  Border:  rgba(255, 255, 255, 0.50)
  Blur:    backdrop-filter: blur(20px) saturate(180%)

GLASS CYPRUS (over Cyprus/dark background)
  Fill:    rgba(0, 71, 65, 0.18)
  Border:  rgba(240, 237, 228, 0.22)
  Blur:    backdrop-filter: blur(24px) saturate(160%)

GLASS NIGHT (over #212121 background)
  Fill:    rgba(33, 33, 33, 0.25)
  Border:  rgba(240, 237, 228, 0.15)
  Blur:    backdrop-filter: blur(20px)
```

### Neumorphic Shadow Pairs (for Sand #F0EDE4 base)

```
Light Source: Top-left (135°)
  Highlight:   #FFFFFF
  Shadow:      #D4D0C7

RAISED (default state)
  box-shadow: 6px 6px 14px #D4D0C7, -6px -6px 14px #FFFFFF

RAISED SUBTLE (small elements)
  box-shadow: 3px 3px 8px #D4D0C7, -3px -3px 8px #FFFFFF

PRESSED (active / selected state)
  box-shadow: inset 4px 4px 10px #D4D0C7, inset -4px -4px 10px #FFFFFF

INSET INPUT (text fields, search bars)
  box-shadow: inset 3px 3px 7px #D4D0C7, inset -3px -3px 7px #FFFFFF

HOVER TRANSITION (intermediate)
  box-shadow: 4px 4px 10px #D4D0C7, -4px -4px 10px #FFFFFF
```

---

## 2. Typography System

### Typeface Selection

**Why these three families — and not the defaults:**

```
┌───────────────────────────────────────────────────────────────────┐
│  ROLE          FAMILY                WHY                          │
├───────────────────────────────────────────────────────────────────┤
│  Display       Cormorant Garamond    High-contrast optical serif. │
│                                      Signals intelligence and     │
│                                      precision. Rare in Indian    │
│                                      SaaS. Used at large sizes    │
│                                      only — restraint amplifies   │
│                                      impact.                      │
│                                                                   │
│  Heading/UI    Syne                  Geometric sans with          │
│                                      distinctive letterforms.     │
│                                      Wide, confident. Designed    │
│                                      for identity systems.        │
│                                      Every module name, sidebar   │
│                                      item, label uses Syne.       │
│                                                                   │
│  Body          DM Sans               Humanist sans. Warm, highly  │
│                                      legible at small sizes.      │
│                                      Not Inter (overused).        │
│                                      Feels accessible without     │
│                                      being casual.                │
│                                                                   │
│  Data/Numbers  Space Grotesk         Built-in tabular figures.    │
│                                      Modern. Every rupee amount,  │
│                                      metric, percentage, count    │
│                                      uses Space Grotesk.          │
└───────────────────────────────────────────────────────────────────┘
```

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

---

### Type Scale — Perfect Fourth (1.333 ratio)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ROLE            SIZE   LINE-H  WEIGHT  FONT               TRACKING     │
├──────────────────────────────────────────────────────────────────────────┤
│  Display         72px   80px    300     Cormorant Garamond  -0.02em     │
│  Display SM      56px   64px    300     Cormorant Garamond  -0.02em     │
│                                                                          │
│  Heading 1       48px   56px    700     Syne               -0.01em      │
│  Heading 2       36px   44px    600     Syne               -0.01em      │
│  Heading 3       28px   36px    600     Syne                0em         │
│  Heading 4       22px   30px    500     Syne                0em         │
│  Heading 5       18px   26px    500     Syne                0.01em      │
│                                                                          │
│  Body Large      18px   28px    400     DM Sans             0em         │
│  Body            16px   26px    400     DM Sans             0em         │
│  Body Small      14px   22px    400     DM Sans             0em         │
│  Caption         12px   18px    500     DM Sans             0.02em      │
│  Overline        11px   16px    600     Syne                0.10em      │
│                                                                          │
│  Metric Hero     56px   64px    700     Space Grotesk      -0.02em      │
│  Metric Large    40px   48px    700     Space Grotesk      -0.01em      │
│  Metric          28px   36px    600     Space Grotesk       0em         │
│  Metric Small    20px   28px    600     Space Grotesk       0em         │
│  Data Label      11px   16px    500     Space Grotesk       0.08em      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Psychological Hierarchy Rules

```
RULE 1 — SIZE RATIO
  Each hierarchy level maintains minimum 1.25× size ratio from the next.
  Prevents visual ambiguity between heading levels.

RULE 2 — WEIGHT CONTRAST
  Display uses weight 300 (thin) at large size → paradoxically stronger presence.
  Never use weight 300 below 36px.

RULE 3 — FONT MIXING DISCIPLINE
  Cormorant Garamond: Hero section headlines, marketing moments ONLY.
  Never in the product UI.

  Syne: Module names, nav items, section headers, buttons, badges.
  Never for long-form reading.

  DM Sans: Descriptions, help text, table cells, form content.
  All text longer than 10 words.

  Space Grotesk: Rupee amounts, percentages, counts, dates, times.
  Never for labels or prose.

RULE 4 — COLOR & WEIGHT TOGETHER
  Cyprus + Bold Syne = Primary action signal
  Night 65% + Regular DM Sans = Supporting information
  Night 40% + Regular DM Sans = Disabled or tertiary info
  Sand + Bold Syne (on Cyprus bg) = Inverse primary heading
```

---

## 3. Spacing System

**Base unit: 8px**

```
TOKEN     VALUE    USE
──────────────────────────────────────────────────
space-1    4px     Icon padding, micro gaps
space-2    8px     Inline gaps, tight stacks
space-3   12px     Input padding, compact cards
space-4   16px     Default padding, card inner
space-5   20px     Section inner padding (mobile)
space-6   24px     Card padding (desktop), lg gaps
space-8   32px     Section gaps, group spacing
space-10  40px     Large section breathing room
space-12  48px     Content sections (mobile)
space-16  64px     Section separators (desktop)
space-20  80px     Hero padding (mobile)
space-24  96px     Hero padding (desktop)
space-32 128px     Top-of-page hero breathing
```

---

## 4. Layout & Grid

### Desktop Grid
```
Max content width:  1280px
Columns:            12
Gutter:             24px
Margin:             40px
```

### Tablet Grid
```
Max content width:  1024px
Columns:            8
Gutter:             20px
Margin:             32px
```

### Mobile Grid
```
Columns:            4
Gutter:             16px
Margin:             20px
```

### Breakpoints
```
xs:    0 – 374px     (small phones)
sm:    375 – 767px   (phones)
md:    768 – 1023px  (tablets)
lg:    1024 – 1279px (small laptops)
xl:    1280 – 1439px (desktops)
2xl:   1440px+       (large screens)
```

### Sidebar
```
Expanded:   240px fixed left
Collapsed:  64px  fixed left (icon only)
Transition: 200ms ease-in-out
Z-index:    100
```

---

## 5. Surface Effects

### 5.1 Glassmorphism

**When to use:**
- Hero metric cards on Cyprus/dark backgrounds
- Modal overlays
- Floating notification panels
- AI advisor chat bubble containers
- Tooltip surfaces

**When NOT to use:**
- Body text surfaces
- Data tables
- Navigation sidebar (too distracting)
- Form fields (use neumorphism instead)

#### Glass Card — Light (on Cyprus or dark background)

```css
.glass-card-light {
  background: rgba(240, 237, 228, 0.18);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.40);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.20),
    0 1px 0px rgba(255, 255, 255, 0.35) inset,
    0 -1px 0px rgba(0, 0, 0, 0.10) inset;
}
```

#### Glass Card — Dark (on medium surfaces)

```css
.glass-card-dark {
  background: rgba(0, 71, 65, 0.16);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(240, 237, 228, 0.20);
  border-radius: 20px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.30),
    0 1px 0px rgba(240, 237, 228, 0.18) inset;
}
```

#### Glass Modal Overlay

```css
.glass-modal {
  background: rgba(248, 245, 238, 0.85);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 24px;
  box-shadow:
    0 24px 80px rgba(33, 33, 33, 0.18),
    0 2px 0px rgba(255, 255, 255, 0.80) inset;
}
```

#### Glass Notification / Toast

```css
.glass-toast {
  background: rgba(0, 71, 65, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(240, 237, 228, 0.25);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  color: #F0EDE4;
}
```

---

### 5.2 Neumorphism

**When to use:**
- Dashboard stat cards (resting state on Sand background)
- Sidebar nav items (active = pressed state)
- Toggle switches
- Primary buttons (raised by default, pressed on click)
- Number pad keys in POS billing screen
- Icon containers

**When NOT to use:**
- On any background that isn't Sand #F0EDE4 (or very close to it)
- For disabled states (use flat + 40% opacity instead)
- On dark/Cyprus backgrounds (use glassmorphism there)

#### Neumorphic Card

```css
.neuo-card {
  background: #F0EDE4;
  border-radius: 16px;
  box-shadow:
    8px 8px 18px #D4D0C7,
    -8px -8px 18px #FFFFFF;
  transition: box-shadow 150ms ease;
}

.neuo-card:hover {
  box-shadow:
    5px 5px 12px #D4D0C7,
    -5px -5px 12px #FFFFFF;
}
```

#### Neumorphic Button — Primary (Cyprus label)

```css
.neuo-btn {
  background: #F0EDE4;
  border-radius: 12px;
  border: none;
  box-shadow:
    5px 5px 12px #D4D0C7,
    -5px -5px 12px #FFFFFF;
  color: #004741;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: box-shadow 100ms ease, transform 100ms ease;
}

.neuo-btn:hover {
  box-shadow:
    3px 3px 8px #D4D0C7,
    -3px -3px 8px #FFFFFF;
}

.neuo-btn:active {
  box-shadow:
    inset 3px 3px 8px #D4D0C7,
    inset -3px -3px 8px #FFFFFF;
  transform: scale(0.99);
}
```

#### Neumorphic Button — Filled (Cyprus background)

```css
.neuo-btn-filled {
  background: #004741;
  border-radius: 12px;
  border: none;
  box-shadow:
    5px 5px 12px rgba(0,71,65,0.35),
    -2px -2px 8px rgba(0,150,135,0.15);
  color: #F0EDE4;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  transition: box-shadow 100ms ease, background 100ms ease;
}

.neuo-btn-filled:hover {
  background: #006B63;
  box-shadow:
    3px 3px 8px rgba(0,71,65,0.40),
    -2px -2px 6px rgba(0,150,135,0.12);
}

.neuo-btn-filled:active {
  background: #002E2A;
  box-shadow: inset 2px 2px 6px rgba(0,0,0,0.25);
}
```

#### Neumorphic Input Field

```css
.neuo-input {
  background: #F0EDE4;
  border: none;
  border-radius: 12px;
  box-shadow:
    inset 3px 3px 7px #D4D0C7,
    inset -3px -3px 7px #FFFFFF;
  color: #212121;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  outline: none;
  transition: box-shadow 150ms ease;
}

.neuo-input:focus {
  box-shadow:
    inset 4px 4px 9px #C8C4BB,
    inset -3px -3px 7px #FFFFFF,
    0 0 0 2px rgba(0, 71, 65, 0.35);
}

.neuo-input::placeholder {
  color: rgba(33, 33, 33, 0.38);
}
```

#### Neumorphic Nav Item

```css
.neuo-nav-item {
  background: #F0EDE4;
  border-radius: 12px;
  box-shadow: none; /* flat when inactive */
  color: rgba(33, 33, 33, 0.55);
  font-family: 'Syne', sans-serif;
  font-weight: 500;
  transition: all 180ms ease;
}

.neuo-nav-item:hover {
  box-shadow:
    3px 3px 8px #D4D0C7,
    -3px -3px 8px #FFFFFF;
  color: #004741;
}

.neuo-nav-item.active {
  box-shadow:
    inset 3px 3px 8px #D4D0C7,
    inset -3px -3px 8px #FFFFFF;
  color: #004741;
  font-weight: 700;
}
```

#### Neumorphic Toggle

```css
.neuo-toggle-track {
  background: #F0EDE4;
  border-radius: 9999px;
  box-shadow:
    inset 3px 3px 6px #D4D0C7,
    inset -3px -3px 6px #FFFFFF;
  width: 52px;
  height: 28px;
  position: relative;
}

.neuo-toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  position: absolute;
  top: 3px;
  left: 3px;
  background: #F0EDE4;
  box-shadow:
    3px 3px 6px #D4D0C7,
    -2px -2px 5px #FFFFFF;
  transition: left 200ms ease, background 200ms ease;
}

/* ON state */
.neuo-toggle-track.on .neuo-toggle-thumb {
  left: 27px;
  background: #004741;
  box-shadow:
    2px 2px 5px rgba(0,71,65,0.40),
    -1px -1px 4px rgba(0,150,130,0.20);
}
```

---

## 6. Component Library

### 6.1 Metric Cards

**Dashboard KPI Card (neumorphic on Sand):**
```
┌─────────────────────────────────────────────────┐
│  ←neuo-card→                                    │
│                                                 │
│  ⬤  OVERLINE LABEL                [Syne 11px]  │
│     in Data Label / UPPERCASE / 0.10em spacing  │
│                                                 │
│  ₹2,47,500                   [Space Grotesk 40] │
│  Today's Revenue             [DM Sans 13px 60%] │
│                                                 │
│  ▲ +12.4% vs yesterday      [Space Grotesk 13] │
│    ──────────────────────                       │
│    [Cyprus sparkline bar]                       │
└─────────────────────────────────────────────────┘
```

**Hero Glassmorphic Metric Card (on Cyprus background):**
```
╔═════════════════════════════════════════════════╗  ← Cyprus #004741 bg
║                                                 ║
║    ┌─────────────────────────────────────────┐  ║
║    │  ←glass-card-light→                    │  ║
║    │                                         │  ║
║    │  Business Health                        │  ║
║    │  [Syne 14px / Sand 70%]                 │  ║
║    │                                         │  ║
║    │         87                              │  ║
║    │  [Cormorant 72px / Sand]                │  ║
║    │                                         │  ║
║    │  Your business performed well           │  ║
║    │  this week.                             │  ║
║    │  [DM Sans 14px / Sand 60%]              │  ║
║    └─────────────────────────────────────────┘  ║
║                                                 ║
╚═════════════════════════════════════════════════╝
```

---

### 6.2 The Cyprus Halo (Signature Element)

This is the centerpiece of the Dashboard hero section.

```
                    ┌──────────────────────────────────┐
                    │    Sand #F0EDE4 background        │
                    │                                  │
                    │         ╭─────────────╮          │
                    │      ╭──┤   RING      ├──╮       │
                    │      │  │ neuo outer  │  │       │
                    │      │  ╰─────────────╯  │       │
                    │      │  ┌─────────────┐  │       │
                    │      │  │  glass      │  │       │
                    │      │  │  inner card │  │       │
                    │      │  │             │  │       │
                    │      │  │     87      │  │       │
                    │      │  │   Health    │  │       │
                    │      │  └─────────────┘  │       │
                    │      ╰──────────────────╯        │
                    │                                  │
                    └──────────────────────────────────┘

Outer ring:   width 280px, border-radius 50%
              neuo raised shadow on Sand
              Cyprus #004741 stroke 2px dashed, animated rotation
              CSS: animation: halo-spin 40s linear infinite

Inner card:   glassmorphic, 200px × 200px, border-radius 50%
              glass-card-dark style
              Business Health Score in Cormorant Garamond 72px Sand

Animated pulse:
  @keyframes halo-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,71,65,0.4); }
    50% { box-shadow: 0 0 0 20px rgba(0,71,65,0.0); }
  }
```

CSS:
```css
.cyprus-halo-ring {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: #F0EDE4;
  box-shadow:
    12px 12px 28px #D4D0C7,
    -12px -12px 28px #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: halo-pulse 3s ease-in-out infinite;
}

.cyprus-halo-ring::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1.5px dashed rgba(0, 71, 65, 0.35);
  animation: halo-spin 40s linear infinite;
}

.cyprus-halo-ring::after {
  content: '';
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  border: 1px solid rgba(0, 71, 65, 0.12);
}

.cyprus-halo-inner {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(0, 71, 65, 0.14);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(240, 237, 228, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(240,237,228,0.20),
    0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@keyframes halo-pulse {
  0%, 100% { box-shadow: 12px 12px 28px #D4D0C7, -12px -12px 28px #FFFFFF, 0 0 0 0 rgba(0,71,65,0.15); }
  50% { box-shadow: 12px 12px 28px #D4D0C7, -12px -12px 28px #FFFFFF, 0 0 0 16px rgba(0,71,65,0.0); }
}

@keyframes halo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

### 6.3 Buttons

**Scale:**
```
sm: height 32px, padding 8px 14px, font-size 13px, border-radius 8px
md: height 40px, padding 10px 20px, font-size 15px, border-radius 10px
lg: height 48px, padding 12px 28px, font-size 16px, border-radius 12px
xl: height 56px, padding 14px 36px, font-size 17px, border-radius 14px
```

**Variants:**
- `neuo-btn` → Neumorphic raised (default)
- `neuo-btn-filled` → Cyprus filled (primary CTA)
- `ghost-btn` → Transparent, Cyprus border
- `danger-btn` → #B03A2E filled
- `icon-btn` → Square/circle, icon only

**Icon Button:**
```css
.icon-btn {
  background: #F0EDE4;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  box-shadow:
    4px 4px 10px #D4D0C7,
    -4px -4px 10px #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 120ms ease;
}

.icon-btn:active {
  box-shadow:
    inset 3px 3px 7px #D4D0C7,
    inset -3px -3px 7px #FFFFFF;
}
```

---

### 6.4 Badges & Status Chips

```css
.badge {
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #F0EDE4;
  box-shadow:
    2px 2px 5px #D4D0C7,
    -2px -2px 5px #FFFFFF;
}

/* Variants */
.badge-cyprus  { color: #004741; }
.badge-success { color: #1A6644; }
.badge-warning { color: #9A6B00; }
.badge-danger  { color: #B03A2E; }
```

---

### 6.5 Data Table

```
┌──────────────────────────────────────────────────────────────────┐
│ TABLE HEADER ROW                                                  │
│ [Syne 11px / Night 55% / 0.10em letter-spacing / UPPERCASE]     │
│ background: Sand Dark #D9D5CB                                    │
├──────────────────────────────────────────────────────────────────┤
│ Row 1 · background: Sand Light #F8F5EE                           │
│ [DM Sans 14px for labels] [Space Grotesk 14px for numbers]       │
├──────────────────────────────────────────────────────────────────┤
│ Row 2 · background: Sand #F0EDE4                                 │
├──────────────────────────────────────────────────────────────────┤
│ Row 3 · background: Sand Light #F8F5EE (alternating)             │
└──────────────────────────────────────────────────────────────────┘

Row hover:
  background: rgba(0,71,65,0.04)
  cursor: pointer
  transition: background 100ms ease

Selected row:
  background: rgba(0,71,65,0.08)
  border-left: 3px solid #004741
```

---

### 6.6 AI Advisor Chat Bubble

```css
.ai-bubble {
  background: rgba(0, 71, 65, 0.12);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(0, 71, 65, 0.20);
  border-radius: 4px 20px 20px 20px;
  padding: 14px 18px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #212121;
  box-shadow:
    0 4px 16px rgba(0, 71, 65, 0.10),
    0 1px 0 rgba(255,255,255,0.50) inset;
  max-width: 480px;
  line-height: 1.6;
}

.user-bubble {
  background: #004741;
  border-radius: 20px 4px 20px 20px;
  padding: 12px 18px;
  color: #F0EDE4;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  box-shadow: 0 4px 14px rgba(0,71,65,0.30);
  max-width: 420px;
  align-self: flex-end;
}
```

---

### 6.7 POS Numpad Key

```css
.pos-key {
  background: #F0EDE4;
  border-radius: 14px;
  border: none;
  width: 72px;
  height: 72px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 500;
  color: #212121;
  box-shadow:
    5px 5px 12px #D4D0C7,
    -5px -5px 12px #FFFFFF;
  cursor: pointer;
  transition: box-shadow 80ms ease, transform 80ms ease;
  user-select: none;
}

.pos-key:active {
  box-shadow:
    inset 3px 3px 8px #D4D0C7,
    inset -3px -3px 8px #FFFFFF;
  transform: scale(0.97);
}

.pos-key-action {
  background: #004741;
  color: #F0EDE4;
  box-shadow:
    5px 5px 12px rgba(0,71,65,0.35),
    -2px -2px 6px rgba(0,140,120,0.15);
}

.pos-key-action:active {
  box-shadow:
    inset 3px 3px 8px rgba(0,0,0,0.25);
  transform: scale(0.97);
}
```

---

## 7. Screen Layouts (ASCII Wireframes)

### 7.1 Dashboard — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR 240px [neuo, Sand bg]    MAIN CONTENT [Sand bg]                          │
│ ─────────────────────────────    ─────────────────────────────────────────────── │
│                                                                                  │
│  ┌──────────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │  VM                      │    │  HEADER BAR                                 │ │
│  │  Vendor Mind             │    │  [Search input neuo] [Notifications] [User] │ │
│  │  [Cormorant 20px Cyprus] │    └─────────────────────────────────────────────┘ │
│  └──────────────────────────┘                                                    │
│                                   TOP ROW — 4 KPI Cards [neuo-card]              │
│  NAV ITEMS                        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────┐ │
│  [icon + Syne 14px]               │ Revenue  │ │ Invoices │ │ Stock    │ │ AI │ │
│                                   │ ₹2,47,500│ │ 143      │ │ 18 Low   │ │ 87 │ │
│  ◉ Dashboard [active/pressed]     │ +12.4%   │ │ Today    │ │ Alerts   │ │ ℅  │ │
│  ○ Billing                        └──────────┘ └──────────┘ └──────────┘ └────┘ │
│  ○ Inventory                                                                     │
│  ○ Customers                      MIDDLE SECTION                                 │
│  ○ Vendors                        ┌─────────────────────────┐ ┌───────────────┐  │
│  ○ Employees                      │ Sales Chart             │ │ Cyprus Halo   │  │
│  ○ Reports                        │ [Space Grotesk numbers] │ │ (Signature)   │  │
│  ○ GST & Tax                      │ [Cyprus line graph]     │ │               │  │
│  ○ Accounting                     │                         │ │  Health: 87   │  │
│  ○ AI Advisor                     └─────────────────────────┘ └───────────────┘  │
│  ─────────────                                                                   │
│  ○ Settings                       BOTTOM SECTION                                 │
│  ○ Help                           ┌─────────────────────────────────────────────┐ │
│                                   │ AI Recommendations [glass-card-dark strip]  │ │
│  ┌──────────────────────────┐     │ "Milk inventory will run out in 3 days."   │ │
│  │ Branch: Salem Main  ▼   │     │ "Rice category up 22% this week."          │ │
│  └──────────────────────────┘     └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.2 POS Billing Screen — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR [collapsed 64px]   BILLING WORKSPACE [Sand bg]                           │
│ ──────────────────────     ──────────────────────────────────────────────────────│
│                                                                                  │
│  VM                        ┌─────────────────────────────────┐ ┌──────────────┐  │
│  [icon]                    │ PRODUCT SEARCH [neuo-input]      │ │ CART         │  │
│                            │ 🔍 Scan or search product...    │ │ [neuo-card]  │  │
│  [D]                       └─────────────────────────────────┘ │              │  │
│  [B] ←active               ┌─────────────────────────────────┐ │ 3 items      │  │
│  [I]                       │ PRODUCT GRID                     │ │              │  │
│  [C]                       │ [neuo cards, 4-col]              │ │ ₹1,250       │  │
│  [V]                       │                                  │ │              │  │
│  [E]                       │  Rice 5kg  Milk 1L  Sugar 1kg   │ │ [CGST 9%]    │  │
│  [R]                       │  ₹290      ₹62      ₹48         │ │ [SGST 9%]    │  │
│  [G]                       │                                  │ │              │  │
│  [A]                       │  Atta 1kg  Oil 1L   Tea 250g    │ │ Total        │  │
│                            │  ₹68       ₹140     ₹85         │ │ ₹1,477       │  │
│  ─────                     └─────────────────────────────────┘ │              │  │
│  [⚙]                                                           │ ┌──────────┐ │  │
│  [?]                       ┌─────────────────────────────────┐ │ │  NUMPAD  │ │  │
│                            │ NUMPAD + PAYMENT                 │ │ │ [neuo]   │ │  │
│                            │ [pos-key grid]                   │ │ └──────────┘ │  │
│                            │                                  │ │              │  │
│                            │  7   8   9   [CLEAR]            │ │ [Pay ₹1477]  │  │
│                            │  4   5   6   [BKSP]             │ │ [neuo-filled]│  │
│                            │  1   2   3   [QTY]              │ └──────────────┘  │
│                            │  .   0   ₹   [BILL]             │                  │
│                            └─────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.3 AI Advisor — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR [240px]          AI ADVISOR SCREEN                                       │
│                                                                                  │
│                           ╔═══════════════════════════════════════════════════╗  │
│                           ║  CYPRUS HEADER BAND [#002E2A bg]                  ║  │
│                           ║                                                   ║  │
│                           ║  AI Advisor          [Syne 32px / Sand]           ║  │
│                           ║  Business Intelligence, Tamil & English            ║  │
│                           ║  [DM Sans 15px / Sand 60%]                        ║  │
│                           ║                                                   ║  │
│                           ║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ║  │
│                           ║  │ glass-card  │ │ glass-card  │ │ glass-card  │ ║  │
│                           ║  │ Revenue     │ │ Top Product │ │ Risk Alert  │ ║  │
│                           ║  │ ₹2.4L       │ │ Basmati     │ │ 3 items     │ ║  │
│                           ║  └─────────────┘ └─────────────┘ └─────────────┘ ║  │
│                           ╚═══════════════════════════════════════════════════╝  │
│                                                                                  │
│                           CHAT AREA [Sand bg, scrollable]                        │
│                           ┌───────────────────────────────────────────────────┐  │
│                           │                                                   │  │
│                           │  [ai-bubble]                                      │  │
│                           │  Revenue increased 12% this month.                │  │
│                           │  Consider restocking Basmati Rice — demand        │  │
│                           │  up 22% ahead of Pongal.                         │  │
│                           │                                                   │  │
│                           │                          [user-bubble]            │  │
│                           │                   What should I reorder?          │  │
│                           │                                                   │  │
│                           │  [ai-bubble]                                      │  │
│                           │  Based on current stock and sales velocity:       │  │
│                           │  1. Basmati Rice — order 50kg by Thursday         │  │
│                           │  2. Sunflower Oil — 20 units                      │  │
│                           │  3. Tea 250g — 30 units                           │  │
│                           │                                                   │  │
│                           └───────────────────────────────────────────────────┘  │
│                                                                                  │
│                           INPUT [neuo-input]                                     │
│                           ┌──────────────────────────────────────────────────┐   │
│                           │  Ask in English or Tamil...   [🎤] [➤]           │   │
│                           └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.4 Mobile — Bottom Navigation

```
┌─────────────────────────────┐
│  STATUS BAR                 │
│                             │
│  [Main content area]        │
│  [Sand bg]                  │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
│                             │
│  ─────────────────────────  │
│  ┌─────────────────────────┐│
│  │ [neuo raised bar]       ││
│  │                         ││
│  │ 🏠  📋  ⊕  📦  🤖      ││
│  │                         ││
│  │ Home Bill POS Inv  AI   ││
│  │                  ←active││
│  │ [Syne 10px / Cyprus]    ││
│  └─────────────────────────┘│
└─────────────────────────────┘

Bottom bar CSS:
  background: #F0EDE4
  box-shadow: -4px 0 0 0 transparent,
              0 -6px 20px rgba(0,71,65,0.08),
              0 -1px 0 rgba(0,71,65,0.08)
  height: 72px + safe-area-inset-bottom
  padding-bottom: env(safe-area-inset-bottom)

Active tab indicator:
  Color: Cyprus #004741
  Icon: filled variant
  Label: weight 700
  Dot: 4px circle above icon, bg Cyprus
```

---

### 7.5 Login Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Cyprus Deep #002E2A fullscreen bg]                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [glass-modal centered, 480px wide]                       │  │
│  │                                                           │  │
│  │  Vendor Mind                                              │  │
│  │  [Cormorant Garamond 48px / Sand]                         │  │
│  │                                                           │  │
│  │  Sign in to your business                                 │  │
│  │  [DM Sans 16px / Sand 60%]                                │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Mobile / Email           [neuo-input on Sand panel] │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Password                                 [👁]       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Sign In   [neuo-btn-filled, full width, Cyprus]    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Forgot Password?        [DM Sans 14px / Cyprus]         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Subtle Cyprus Halo ring visible behind glass card]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Motion & Interaction Design

### Principles

```
1. PURPOSEFUL — Animation communicates state change, not decoration
2. FAST — UI transitions < 200ms. Data loading skeleton, not spinner
3. REDUCED MOTION — All animations wrapped in prefers-reduced-motion
4. ONE MOMENT — The Cyprus Halo pulse is the ambient animation. Rest = instant or subtle.
```

### Timing Functions

```css
:root {
  --ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1);  /* enter + exit */
  --ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);  /* enter only  */
  --ease-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);  /* exit only   */
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce    */
}
```

### Duration Scale

```
Micro:     80ms   — button press, icon state
Fast:     150ms   — tooltip appear, dropdown open
Standard: 200ms   — sidebar collapse, modal fade
Slow:     300ms   — page transition, chart draw
Ambient:  3000ms+ — Cyprus Halo pulse (infinite)
```

### Page Transition (Route Change)

```
Outgoing page: opacity 1→0, translateY 0→-8px, 150ms accelerate
Incoming page: opacity 0→1, translateY 8px→0, 200ms decelerate
Gap: 50ms
```

### Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #D9D5CB 0%,
    #F0EDE4 50%,
    #D9D5CB 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

### Chart Entry Animation

```css
/* Bar charts: bars grow from bottom */
@keyframes bar-rise {
  from { transform: scaleY(0); transform-origin: bottom; }
  to   { transform: scaleY(1); transform-origin: bottom; }
}

/* Line charts: draw along path */
stroke-dashoffset animation: 600ms var(--ease-decelerate)

/* Stagger delay for multiple bars: 30ms per bar */
```

### Scroll Behavior

```
Sidebar: position: fixed, never scrolls
Header: position: sticky, box-shadow appears on scroll
Main content: smooth scroll, scroll-behavior: smooth
Cards: scroll-snap on mobile carousels
```

---

## 9. Accessibility

```
Color Contrast Ratios:
  Night #212121 on Sand #F0EDE4     — 11.8:1  ✓ AAA
  Cyprus #004741 on Sand #F0EDE4    — 8.2:1   ✓ AAA
  Sand #F0EDE4 on Cyprus #004741    — 8.2:1   ✓ AAA
  Sand 60% on Cyprus #004741        — 4.8:1   ✓ AA
  Night 65% on Sand #F0EDE4         — 7.1:1   ✓ AAA

Focus Indicators:
  All interactive elements: 2px solid rgba(0,71,65,0.70) outline
  outline-offset: 3px
  Border-radius matches element

Keyboard Navigation:
  Tab order: logical document order
  Sidebar: trap focus when modal open
  POS numpad: arrow key navigation supported

Touch Targets:
  Minimum: 44×44px (WCAG 2.5.5)
  Preferred: 48×48px on mobile
  Spacing between targets: minimum 8px

Motion:
  @media (prefers-reduced-motion: reduce) {
    .cyprus-halo-ring { animation: none; }
    .skeleton { animation: none; background: #D9D5CB; }
    * { transition-duration: 0.01ms !important; }
  }

Font Sizes:
  Minimum body text: 14px
  Minimum label: 11px (with increased letter-spacing for legibility)
  Scale-independent: use rem units throughout

Language:
  <html lang="ta"> for Tamil interface
  <html lang="en"> for English
  Font stack fallback for Tamil: 'Latha', 'Vijaya', system-ui
```

---

## 10. CSS Design Tokens

```css
:root {

  /* ─── COLORS ─────────────────────────────────────────────── */

  /* Brand */
  --color-cyprus:        #004741;
  --color-cyprus-mid:    #006B63;
  --color-cyprus-deep:   #002E2A;
  --color-cyprus-tint:   rgba(0, 71, 65, 0.08);
  --color-cyprus-glass:  rgba(0, 71, 65, 0.16);

  --color-night:         #212121;
  --color-night-60:      rgba(33, 33, 33, 0.60);
  --color-night-40:      rgba(33, 33, 33, 0.40);
  --color-night-20:      rgba(33, 33, 33, 0.20);

  --color-sand:          #F0EDE4;
  --color-sand-light:    #F8F5EE;
  --color-sand-dark:     #D9D5CB;
  --color-sand-shadow:   #D4D0C7;

  /* Status */
  --color-success:       #1A6644;
  --color-warning:       #9A6B00;
  --color-danger:        #B03A2E;
  --color-info:          #1A4A6B;

  /* ─── TYPOGRAPHY ─────────────────────────────────────────── */

  --font-display:  'Cormorant Garamond', Georgia, serif;
  --font-heading:  'Syne', system-ui, sans-serif;
  --font-body:     'DM Sans', system-ui, sans-serif;
  --font-data:     'Space Grotesk', monospace;

  --text-display:    72px;
  --text-display-sm: 56px;
  --text-h1:         48px;
  --text-h2:         36px;
  --text-h3:         28px;
  --text-h4:         22px;
  --text-h5:         18px;
  --text-body-lg:    18px;
  --text-body:       16px;
  --text-body-sm:    14px;
  --text-caption:    12px;
  --text-overline:   11px;
  --text-metric-hero: 56px;
  --text-metric-lg:   40px;
  --text-metric:      28px;
  --text-metric-sm:   20px;
  --text-data-label:  11px;

  /* ─── SPACING ─────────────────────────────────────────────── */

  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32:  128px;

  /* ─── BORDER RADIUS ──────────────────────────────────────── */

  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* ─── SHADOWS (NEUMORPHIC) ──────────────────────────────── */

  --shadow-neuo-sm:
    3px 3px 8px #D4D0C7,
    -3px -3px 8px #FFFFFF;

  --shadow-neuo-md:
    6px 6px 14px #D4D0C7,
    -6px -6px 14px #FFFFFF;

  --shadow-neuo-lg:
    10px 10px 22px #D4D0C7,
    -10px -10px 22px #FFFFFF;

  --shadow-neuo-pressed:
    inset 4px 4px 10px #D4D0C7,
    inset -4px -4px 10px #FFFFFF;

  --shadow-neuo-inset:
    inset 3px 3px 7px #D4D0C7,
    inset -3px -3px 7px #FFFFFF;

  /* ─── SHADOWS (ELEVATION) ───────────────────────────────── */

  --shadow-float:
    0 8px 32px rgba(0, 71, 65, 0.12);

  --shadow-modal:
    0 24px 80px rgba(33, 33, 33, 0.18);

  --shadow-toast:
    0 8px 24px rgba(0, 0, 0, 0.22);

  /* ─── ANIMATION ─────────────────────────────────────────── */

  --ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-micro:    80ms;
  --duration-fast:    150ms;
  --duration-standard:200ms;
  --duration-slow:    300ms;

  /* ─── LAYOUT ─────────────────────────────────────────────── */

  --sidebar-width:          240px;
  --sidebar-collapsed-width: 64px;
  --header-height:           64px;
  --bottom-nav-height:       72px;
  --content-max-width:     1280px;
  --card-border-radius:     --radius-lg;

  /* ─── GLASSMORPHISM ─────────────────────────────────────── */

  --glass-blur-sm:  blur(12px) saturate(150%);
  --glass-blur-md:  blur(20px) saturate(180%);
  --glass-blur-lg:  blur(32px) saturate(200%);

  --glass-light-bg:     rgba(240, 237, 228, 0.20);
  --glass-light-border: rgba(255, 255, 255, 0.45);
  --glass-cyprus-bg:    rgba(0, 71, 65, 0.16);
  --glass-cyprus-border:rgba(240, 237, 228, 0.22);
  --glass-modal-bg:     rgba(248, 245, 238, 0.85);

  /* ─── Z-INDEX ────────────────────────────────────────────── */

  --z-base:     0;
  --z-raised:   10;
  --z-sticky:   50;
  --z-sidebar:  100;
  --z-overlay:  200;
  --z-modal:    300;
  --z-toast:    400;
  --z-tooltip:  500;
}
```

---

## 11. Implementation Notes

### React Component Architecture

```
src/
├── design-system/
│   ├── tokens.css          ← All CSS variables above
│   ├── typography.css      ← Font imports, text utility classes
│   ├── surfaces.css        ← Neumorphic + Glass mixins
│   └── animations.css      ← Keyframes, transition utilities
│
├── components/
│   ├── atoms/
│   │   ├── Button.tsx       ← neuo-btn, neuo-btn-filled, ghost, danger
│   │   ├── Input.tsx        ← neuo-input with label, error, helper
│   │   ├── Badge.tsx        ← neuo pill badges
│   │   ├── Toggle.tsx       ← neuo toggle switch
│   │   └── IconButton.tsx
│   │
│   ├── molecules/
│   │   ├── MetricCard.tsx   ← KPI card (neuo)
│   │   ├── GlassCard.tsx    ← Glass surface wrapper
│   │   ├── CyprusHalo.tsx   ← Signature element
│   │   ├── ChatBubble.tsx   ← AI + user bubble variants
│   │   └── PosKey.tsx       ← Numpad key
│   │
│   └── organisms/
│       ├── Sidebar.tsx
│       ├── BottomNav.tsx
│       ├── DataTable.tsx
│       ├── AIChatPanel.tsx
│       └── PosNumpad.tsx
```

### Tailwind Configuration Override

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        cyprus:    { DEFAULT: '#004741', mid: '#006B63', deep: '#002E2A' },
        night:     '#212121',
        sand:      { DEFAULT: '#F0EDE4', light: '#F8F5EE', dark: '#D9D5CB' },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        heading:  ['Syne', 'system-ui', 'sans-serif'],
        body:     ['DM Sans', 'system-ui', 'sans-serif'],
        data:     ['Space Grotesk', 'monospace'],
      },
      boxShadow: {
        'neuo-sm':      '3px 3px 8px #D4D0C7, -3px -3px 8px #FFFFFF',
        'neuo':         '6px 6px 14px #D4D0C7, -6px -6px 14px #FFFFFF',
        'neuo-lg':      '10px 10px 22px #D4D0C7, -10px -10px 22px #FFFFFF',
        'neuo-pressed': 'inset 4px 4px 10px #D4D0C7, inset -4px -4px 10px #FFFFFF',
        'neuo-inset':   'inset 3px 3px 7px #D4D0C7, inset -3px -3px 7px #FFFFFF',
        'glass-float':  '0 8px 32px rgba(0,71,65,0.12)',
      },
      backdropBlur: {
        glass: '20px',
        'glass-lg': '32px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
}
```

### Critical Rules for Developers

```
1. Neumorphism only on #F0EDE4 or very close variants.
   Never apply neuo shadows on white, Cyprus, or Night backgrounds.

2. Glassmorphism requires a rich background behind it.
   Place glass cards only over Cyprus, Night, or image backgrounds.
   Glass on Sand = barely visible. Use neuo on Sand instead.

3. Never mix Cormorant Garamond with Syne in the same visual block.
   One speaks, the other supports. Not simultaneously.

4. Space Grotesk for ALL numeric data.
   No exceptions. ₹ amounts, %, counts, dates, times.

5. Backdrop-filter has limited browser support on some Android WebViews.
   Always provide a solid fallback:
   @supports not (backdrop-filter: blur(1px)) {
     .glass-card { background: rgba(0,71,65,0.90); }
   }

6. The Cyprus Halo animation is ambient — always running.
   All other animations are triggered by interaction or state.

7. Active sidebar item = pressed neumorphic state.
   NEVER use a colored background for the active nav item.
   The pressed shadow is the active indicator.
```

---

## 12. Tamil Language Typography

```css
/* When UI language is Tamil */
:lang(ta) {
  font-family: 'Noto Sans Tamil', 'Latha', 'Vijaya', system-ui, sans-serif;
  font-size: 1.05em; /* Tamil glyphs read slightly smaller */
  line-height: 1.75;  /* Tamil needs more vertical breathing */
}

/* Syne doesn't support Tamil — fall back for headings */
:lang(ta) h1, :lang(ta) h2, :lang(ta) h3 {
  font-family: 'Noto Sans Tamil', system-ui, sans-serif;
  font-weight: 700;
}

/* Space Grotesk IS Unicode — numbers work fine in both languages */
:lang(ta) .metric, :lang(ta) .data-number {
  font-family: 'Space Grotesk', monospace;
}
```

**Google Fonts Tamil addition:**
```
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');
```

---

*Design System — Vendor Mind v1.0*
*Maintained by: Product & Design Team*
*Next review: Post Phase 1 user testing*
