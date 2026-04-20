# DodoDots — Design Spec

**Date:** 2026-04-19
**Status:** Draft
**Repo:** `DodoDots` (to be created on GitHub, deployed to Vercel)

## Summary

DodoDots is a web-based puzzle game — a variant of Hamiltonian path / Eulerian circuit puzzles played on a graph of nodes and edges. Each node and edge has a counter; the player latches onto a start node, then clicks a sequence of adjacent nodes to trace a path, decrementing counters of each edge and node traversed. Win condition: all counters reach 0 within a max-moves budget.

The game ships with a Tron-inspired dark visual aesthetic, emphasizing beautifully animated path tracing as the core gameplay moment.

## Goals

- **Test core mechanics fast** — procedurally generated Daily puzzles unblock playtesting without requiring level-design effort.
- **Give players tools** — Level builder lets anyone design and publish puzzles, with a playtest-before-publish gate.
- **Feel premium** — Tron-style neon aesthetic, smooth SVG-based animations, satisfying audio.
- **Ship lean** — Campaign is deferred; only the shell is scaffolded.

## Non-Goals (MVP)

- Campaign content (deferred; route renders "coming soon")
- Curated daily levels (generator is client-side; `daily_levels` table is schema-only until curation begins)
- Mobile-optimized UX (desktop-first; mobile works but is not tuned)
- Leaderboards, streaks, social features
- Mid-path undo (restart is full-level via `R`)

## Tech Stack

- **Next.js 15 (App Router) + React + TypeScript**
- **Vercel** hosting
- **Supabase** — Postgres + Auth (email magic link + Google); RLS enforced
- **SVG rendering** for game graph (with `feGaussianBlur` bloom filters)
- **Framer Motion** for declarative element animations; custom `requestAnimationFrame` loop for path-tracing comet animation
- **Zustand** for client state (game, builder, audio)
- **Web Audio API** for music/SFX
- `next/font` — Orbitron or Rajdhani for HUD/counters

## Routes

| Route | Purpose |
|---|---|
| `/` | Main menu (Daily, Campaign, Tutorial, Builder, Settings) |
| `/daily` | Today's procedurally generated puzzle (deterministic seed from date) |
| `/campaign` | Placeholder "Coming Soon" page |
| `/tutorial` | Sequential tutorial (5–7 mini-levels) |
| `/builder` | Level builder (list of drafts + new-level button) |
| `/builder/[id]` | Editor for a specific draft |
| `/builder/[id]/playtest` | Playtest a draft — successful solve unlocks Publish |
| `/play/[id]` | Play a published community level |

## Core Gameplay

### State machine

1. **Idle** — Eligible start nodes pulse in sync. Non-start nodes inert. Clicking a start node → Latched.
2. **Latched** — Start node decrements once. Adjacent nodes (filtered by edge direction) pulse as valid next clicks. `R` unlatches → Idle. `Esc` → Menu.
3. **Tracing** — On valid adjacent node click: comet animates along the edge (~250ms). Edge counter + destination node counter decrement on arrival. Move counter decrements. Next clicks queued (depth 1); extras dropped. A queued click is re-validated on dequeue (if the queued target is not adjacent to the new current node, discard silently — no invalid feedback, since the user was queuing optimistically). Invalid targets clicked while in Tracing with queue empty: subtle SFX + shake, no state change.
4. **Won** — All counters reach 0. Win animation (sequenced bloom + ambient particles), then "Next" / "Menu" prompt. For builder playtest: marks the level as playtest-solved for this user.
5. **Failed** — Move counter hits 0 and not solved. Red tint on move counter + "Retry (R) / Menu (Esc)" modal.

### Counter → visual state

| Counter | Node | Edge |
|---|---|---|
| ≥ 2 | Gray fill, number centered, dim glow | Gray stroke, number at midpoint |
| 1 | Gray fill, no number, dim glow | Gray stroke, no number |
| 0 | Neon green fill, bright bloom | Neon green stroke, intense bloom |
| < 0 | Stays green, subtle pulse to signal over-traversal | Same |

### Controls

- Click: latch start / extend path
- `R`: unlatch + restart level (fully; no mid-path undo)
- `Esc`: return to previous menu
- `Space`: pause (freezes animation)

### Move counter

- Top-center HUD; starts at level's `max_moves`, decrements per traversal.
- Move counter **clamps at 0** (cannot go negative). Reaching 0 without solving triggers **Failed** state immediately — no further moves accepted.
- Node and edge counters **may go negative** (per user's initial spec; revisit later).

## Procedural Daily Generator

Client-side, deterministic from date seed (`YYYY-MM-DD` → seeded PRNG). Lives in `lib/generator.ts`.

Algorithm:
1. Pick node count ∈ [4, 11].
2. Place nodes via Poisson-disk sampling in normalized viewport (`x, y ∈ [0.1, 0.9]`) for even spacing.
3. Pick a start node uniformly.
4. Simulate a random walk of length `L = round(nodeCount × rand(1.5, 3.0))`:
   - At each step, with 70% probability traverse an existing edge from current node (uniform over edges); otherwise create a new edge to a random node (prefer unconnected neighbors, weighted by inverse spatial distance).
   - **Constraint:** never add an edge that would push any node's degree above 4.
   - Occasional (~15%) forced backtrack to previous node for variety.
5. Count visit frequency per node and edge → those become the `count` values, **clamped to the range [1, 9]** to match the builder's count domain (if a node is visited 10+ times, clamp to 9 — solution path still exists, puzzle just has some over-traversal slack).
6. `max_moves = L` (length of simulated walk).
7. All edges bidirectional; all nodes start-eligible (for MVP generator; tuning later). Tutorials use hand-authored JSON and may set `startEligible: false` on specific nodes to teach the concept.

Output: `Graph` JSON (same shape as builder output). Completions persisted to localStorage keyed by date.

## Level Builder

### UX — Figma-style toolbar

Top toolbar: **Select (V)** | **Node (N)** | **Edge (E)**. Select is default.

- **Node tool:** click empty canvas to drop a node at that position.
- **Edge tool:** drag from one node to another to create an edge. Dragging onto empty space or the source node cancels.
- **Select tool:** click any node or edge to select. Inspector panel (right sidebar) shows properties for the selected element.

### Inspector properties

**Node:**
- Count: slider / number input (1–9)
- Start-eligible: toggle

**Edge:**
- Count: slider / number input (1–9)
- Direction: three-state toggle (bi / forward / backward, where forward = `from → to`)

### Keyboard shortcuts (anywhere in builder)

- `V / N / E`: switch tool
- `1`–`9`: set count on selected element
- `D`: cycle direction of selected edge
- `S`: toggle start-eligible on selected node
- `Delete` / `Backspace`: remove selected element (and cascading incident edges if node)

### Level settings panel

Separate compact panel (top-right or collapsible): **Level name**, **Max moves** (number input).

### Publish flow

1. **Playtest** button → navigates to `/builder/[id]/playtest` running current graph.
2. On successful solve, `playtest_solves` row inserted server-side; user returns to builder.
3. **Publish** button enabled only when a valid playtest-solve exists for current user + level. Publishing sets `published_at = now()`.
4. Editing a published level: edits only allowed on unpublished drafts. To change a published level, author clones it to a new draft.

## Data Model (Supabase)

### Tables

```sql
-- Users managed by Supabase Auth

create table levels (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  title text not null,
  graph jsonb not null,
  max_moves int not null,
  created_at timestamptz default now(),
  published_at timestamptz,
  play_count int default 0,
  solve_count int default 0
);

create table daily_levels (
  date date primary key,
  level_id uuid references levels(id),
  created_at timestamptz default now()
);

create table playtest_solves (
  level_id uuid references levels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  solved_at timestamptz default now(),
  primary key (level_id, user_id)
);
```

### Graph JSON schema

```ts
type Graph = {
  nodes: Array<{
    id: string;
    x: number;             // normalized [0..1]
    y: number;
    count: number;         // 1..9
    startEligible: boolean;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    count: number;         // 1..9
    direction: "bi" | "forward" | "backward";
  }>;
};
```

### RLS policies

- `levels`:
  - `select`: anyone where `published_at is not null`; author always.
  - `insert`: requires `auth.uid() = author_id`.
  - `update / delete`: author only, and only while `published_at is null` (or updating `play_count`/`solve_count` which are bumped by RPC).
- `playtest_solves`:
  - `select / insert`: user can only touch their own rows.
- **Publish RPC** (`publish_level(level_id)`): server-side function that atomically asserts the caller has a `playtest_solves` row for this level, then sets `published_at`.
- **Counter RPCs** (`increment_play_count(level_id)`, `increment_solve_count(level_id)`): server-side functions that bump counters on published levels. Only these RPCs can mutate `play_count` / `solve_count`; the base `update` policy on `levels` excludes these columns (or grants bypass via `security definer` on the RPC).

### Local-only (localStorage)

- Audio settings (`music_volume`, `sfx_volume`, mute flags)
- Tutorial completion flags
- Daily completion history (`{date: {solved: bool, moves_used: int}}`)
- Builder drafts (until the user signs in and syncs)

## Audio System

### Structure

- `public/music/` — add `.mp3`/`.ogg` files; build script generates `music-manifest.json` listing files in sorted order
- `public/sfx/` — individual SFX files: `click.mp3`, `latch.mp3`, `traverse.mp3`, `invalid.mp3`, `decrement-zero.mp3`, `win.mp3`, `fail.mp3`
- `scripts/build-music-manifest.mjs` — runs in `prebuild`, scans `public/music/`, writes manifest to `public/music-manifest.json`

### `AudioManager` behavior

- Loads manifest on first interaction (browser autoplay policy); plays in listed order, loops after last track.
- **Crossfade** ~500ms between tracks.
- **Tab visibility**: pauses on `document.visibilitychange` → hidden; resumes on visible. Same for page blur/focus.
- **Volume**:
  - `setMusicVolume(0..1)`, `setSfxVolume(0..1)`
  - Defaults: **music 0.30, sfx 0.50**
  - Mute toggles independent of volume levels
  - Persisted to localStorage, restored on load
- **Empty manifest**: no-op gracefully.

### Settings UI

Accessible from main menu (gear icon or "Settings" menu item). Two sliders + two mute toggles. Live preview (adjusting music volume updates in real time).

## Visual System

### Palette

| Token | Hex | Purpose |
|---|---|---|
| `--bg-deep` | `#05070d` | Page background |
| `--grid` | `#0f1a2b` | Subtle grid lines |
| `--dim` | `#6a7a8f` | Inactive nodes/edges, dim numbers |
| `--neon-green` | `#39ff8e` | Completed (count=0) elements |
| `--danger` | `#ff3b5c` | Failed state, move-counter warning |
| `--cyan` | `#39d0ff` | UI chrome (buttons, accents) |

### Background

Subtle parallax grid pattern (SVG `<pattern>`), faint animated scanline overlay (CSS), slow-drifting particles (optional, behind graph).

### Glow system

One shared SVG `<filter id="bloom">` with `feGaussianBlur` + `feMerge`. Intensity varies by counter state via CSS custom property driving `stdDeviation`. Completed elements get 2x blur + brighter merge.

### Typography

`next/font` loading Orbitron (counters, HUD) and a clean sans for body text.

### Key animations

- **Start-eligible pulse:** 1.2s ease-in-out scale + glow loop; all start-eligible nodes phase-synced.
- **Path trace comet:** radial-gradient circle interpolates along SVG edge `d` attribute over ~250ms (via RAF + `SVGGeometryElement.getPointAtLength`). Behind it, edge stroke fills with neon for the traveled portion (using `stroke-dashoffset`). On arrival: node bloom pulse + counter number flip.
- **Decrement-to-zero:** gray→neon crossfade over ~300ms with a one-shot bloom flare.
- **Win:** sequenced bloom across all elements, then ambient loop.

## Tutorial

Static JSON in `content/tutorial/*.json` (reuses `Graph` schema + adds `caption` field for each tutorial step). Sequential 5–7 mini-levels introducing one concept each:

1. Click start → click adjacent → win (2 nodes)
2. Multi-edge single node, count > 1
3. Max-moves constraint
4. Directed edge
5. Loop back for double decrement
6. Multiple start-eligible nodes, only one works
7. Free-play mini-puzzle

Completion tracked in localStorage. No Supabase.

## Project Structure

```
dododots/
├── app/
│   ├── page.tsx                    # Main menu
│   ├── daily/page.tsx
│   ├── campaign/page.tsx           # Placeholder
│   ├── tutorial/page.tsx
│   ├── builder/page.tsx
│   ├── builder/[id]/page.tsx
│   ├── builder/[id]/playtest/page.tsx
│   └── play/[id]/page.tsx
├── components/
│   ├── game/                       # GameBoard, Node, Edge, HUD, WinOverlay, FailOverlay
│   ├── builder/                    # Toolbar, Inspector, Canvas, LevelSettings
│   └── ui/                         # Button, Slider, Modal, MenuLayout, SettingsPanel
├── lib/
│   ├── game/                       # State machine, validation, animation helpers
│   ├── generator.ts                # Procedural Daily generator
│   ├── graph.ts                    # Graph types + adjacency/validation helpers
│   ├── audio.ts                    # AudioManager
│   ├── supabase.ts                 # Client
│   ├── storage.ts                  # localStorage wrappers
│   └── rng.ts                      # Seeded PRNG
├── content/tutorial/*.json
├── public/
│   ├── music/.gitkeep
│   ├── sfx/
│   └── music-manifest.json         # generated
├── scripts/build-music-manifest.mjs
├── supabase/migrations/*.sql
├── styles/globals.css
├── next.config.ts
└── package.json
```

## Open Questions / Future Work

- Campaign: world/chapter grouping introducing mechanics progressively (deferred per user decision).
- Whether to penalize negative counters — current rule: allowed. Revisit after playtesting.
- Daily leaderboard, streaks, sharing.
- Mobile touch optimization.
- Builder: snap-to-grid for node placement, curved edges when two nodes have multiple edges between them, undo/redo.
- Moderation for published community levels.
- Crossfade/curated transitions for daily (A → D hybrid model from brainstorm).

## Key Constraints

- **Desktop-first.** Mobile works but isn't tuned.
- **Must have playtest-solve before publish** — enforced server-side in `publish_level` RPC.
- **Audio defaults: music 0.30, sfx 0.50.** Persisted to localStorage.
- **Pause music on tab hidden; resume on visible.**
- **Graph coords normalized [0..1]** — viewport resize-safe.
