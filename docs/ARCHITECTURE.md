# DodoDots — Architecture

File map, module responsibilities, and boundaries. Read this before modifying a file you haven't touched.

## Layered structure

```
┌─ UI layer ──────────────────────────────────┐
│  app/*        (routes)                      │
│  components/  (React/SVG components)         │
└─────────────────────────────────────────────┘
            ↓ consumes
┌─ State layer ───────────────────────────────┐
│  stores/gameStore.ts   (Zustand wrapper)    │
└─────────────────────────────────────────────┘
            ↓ calls
┌─ Pure logic layer ──────────────────────────┐
│  lib/game/state.ts   (reducer)              │
│  lib/graph.ts        (types + helpers)      │
│  lib/generator.ts    (puzzle gen)           │
│  lib/rng.ts          (seeded PRNG)          │
│  lib/storage.ts      (localStorage)          │
│  lib/keyboard.ts     (keybinds hook)         │
└─────────────────────────────────────────────┘
```

**Rule:** Lower layers never import higher layers. Pure logic never imports React, Zustand, or `next/navigation`.

## File Responsibilities

### `app/`

- `layout.tsx` — Root layout. Loads Orbitron + Inter fonts via `next/font/google`, wires CSS variables.
- `globals.css` — Tailwind v4 import + Tron palette tokens + animation keyframes (`node-pulse`, `halo-pulse`, `commit-ring`, `edge-flash`, `edge-fail`, `win-wave`).
- `page.tsx` — Next.js scaffold placeholder. **Replace with main menu (Phase 8).**
- `daily/page.tsx` — Only live gameplay route. Generates today's puzzle, passes to `GameScreen`, persists completion via `storage.markDaily`.

### `components/game/`

- `BloomDefs.tsx` — Shared SVG `<defs>` with `bloom-dim` and `bloom-bright` filters. Rendered once per `<svg>` viewport.
- `Node.tsx` — Renders one graph node. Handles: pip layout (counts 1–2), numeral fallback (3+), visual states (idle/startable/current/valid-target/snap), breadcrumb tint, idle-dim opacity, commit-ring animation, start-eligible halo pulse.
- `Edge.tsx` — Renders one graph edge. Handles: pip layout along edge line, visual states, direction arrow head, flash animation, failed-edge red state.
- `GameBoard.tsx` — Composes the `<svg>` viewport + bloom defs + all edges + all nodes. Computes:
  - `eligibleStarts` set
  - `validTargets` set (filtered to non-locked)
  - `snapTargetId` / `snapEdgeId` (nearest valid neighbor to mouse)
  - Per-node `isVisited`, `isStartableInIdle`, `dimInIdle`, `pulse`
  - Per-edge `isVisited`, `flash`, `isFailed`
  - Win cascade animation (BFS-like distance ordering from last `current`)
  - Schedules `onCommitAnimationDone` 200ms after `lastCommit` changes
- `HUD.tsx` — Top bar: title + moves-used counter (red + "(par N)" if over).
- `WinOverlay.tsx` — "SOLVED" + moves-used + optional "Perfect!" + Menu button.
- `FailOverlay.tsx` — "UNREACHABLE EDGE" + explainer + Retry / Menu.
- `GameScreen.tsx` — Top-level container. Subscribes to `gameStore`, wires keyboard (`R`, `Z`, `Esc`), delays overlay rendering for fail/win animations.
- `Comet.tsx` — **DEAD CODE.** Leftover from v0's moving-ball animation. Safe to delete.

### `components/ui/`

(Empty today — `MenuLayout`, `Button`, etc. come in Phase 8.)

### `components/builder/`

(Empty today — Phase 11.)

### `lib/graph.ts`

Types and pure helpers for the graph domain. No state, no React.

- `Direction`, `GraphNode`, `GraphEdge`, `Graph`, `Neighbor` — types
- `isSolved(g)` — all counts ≤ 0
- `getValidNeighbors(g, fromId)` — array of `{nodeId, edgeId}` respecting direction
- `findEdge(g, fromId, toId)` — the edge you'd traverse, respecting direction
- `getNode(g, id)` — lookup
- `hasUnreachableEdge(g)`, `findUnreachableEdge(g)` — fail-condition detection

### `lib/game/state.ts`

Pure state reducer. No side effects, no React.

- `Phase`, `GameState`, `GameAction` — types
- `initGame(graph, maxMoves)` — fresh state from a graph
- `reduce(state, action)` — pure transition. Handles `latch`, `traverse`, `reset`.
- Returns previous reference (`=== s`) for no-ops — store relies on this for undo detection.

### `lib/generator.ts` + `lib/generator/`

- `lib/generator.ts` — `generateDaily(seed, options?)` entry. Orchestrates placement + walk + graph construction. Caps counts to 2. Filters unvisited nodes.
- `lib/generator/placement.ts` — `placeNodes(rng, count)`. Poisson-disk sampling with fallback + relaxation pass for even spacing.
- `lib/generator/walk.ts` — `simulateWalk(rng, points, length)`. Capped random walk (max 2 visits per node, max 2 per edge). Returns `{start, steps, edges}`.

### `lib/rng.ts`

- `createRng(seed)` — returns deterministic `() => number` in `[0,1)`. Uses cyrb128 hash + mulberry32.
- `pickInt(rng, min, max)`, `pickOne(rng, arr)` — helpers.

### `lib/storage.ts`

Namespaced localStorage wrappers, keyed under `dododots:*`:

- `getAudio / setAudio` — music/sfx volumes and mutes
- `getDailyCompletions / markDaily(date, {solved, movesUsed})`
- `getTutorialProgress / markTutorialComplete(id)`
- `getDrafts / setDraft(id, draft) / deleteDraft(id)` — builder drafts (future)

SSR-safe (returns fallback when `window` undefined).

### `lib/keyboard.ts`

`useKeyboardShortcuts(handlers)` — React hook. Keys are lowercased; handler receives no args. Attaches on mount, cleans up on unmount. `e.preventDefault()` called for any matched key.

### `stores/gameStore.ts`

Single Zustand store for gameplay.

State shape:
```ts
{
  state: GameState | null;
  history: GameState[];
  lastCommit: { nodeId: string; edgeId: string; at: number } | null;
}
```

Actions:
- `load(graph, maxMoves)` — initialize from graph; clears history + lastCommit
- `dispatch(action)` — pushes to history (on `latch`/`traverse`), invokes reducer; after successful `traverse`, sets `lastCommit` with the resolved edge id
- `undo()` — pops history
- `clearLastCommit()` — called after commit-ring animation completes

## Control Flow (a click)

1. User clicks a node in `<svg>`.
2. `NodeView.onClick` fires; passes `nodeId` up.
3. `GameBoard.onNodeClick` → `GameScreen`'s `handleNode`.
4. `handleNode` inspects `state.phase`; calls `dispatch({type:'latch'|'traverse', nodeId})`.
5. Store captures pre-action `state` to `history`, calls `reduce(state, action)`, compares reference.
6. If reference changed, extracts the traversed edge id via `getValidNeighbors`, sets `lastCommit`.
7. React re-renders with new state.
8. `GameBoard` computes `pulse=true` for the destination node + `flash=true` for the edge; schedules `clearLastCommit` in 200ms.
9. `Node` / `Edge` render with commit-ring / edge-flash CSS animations.
10. 200ms later, `clearLastCommit` runs, animations unmount.

## Data Flow

All game state flows from `gameStore` → `GameScreen` → `GameBoard` → `NodeView`/`EdgeView`. There is **no component-level state** for game rules (only ephemeral UI state like mouse position in `GameBoard`).

`initialGraph` is preserved on the reducer state and threaded through to `GameBoard` so breadcrumb computation (`isVisited`) is a pure derivation, not a cache.

## Testing

- `npm run test:run` — single run (CI-style)
- `npm run test` — watch mode

**Unit tests (thorough):** `lib/graph`, `lib/game/state`, `lib/generator/*`, `lib/rng`.

**Component tests (light):** `Node`, `Edge` — check state→markup mapping. Intentionally skip animation/timing assertions.

**No E2E framework yet.** If we add one, likely Playwright.

**Test file conventions:** `__tests__/X.test.ts(x)` next to the module under test.

## Styling Approach

- **CSS variables** (`--bg-deep`, `--neon-green`, etc.) for the palette. Defined in `app/globals.css`.
- **Tailwind v4** for layout-only utilities (via `@import "tailwindcss"`). Not used heavily — most styles are inline or CSS-class based because SVG doesn't compose with Tailwind cleanly.
- **CSS animations** for all motion (not Framer Motion). Kept in `globals.css`. Why: simpler, no runtime cost, and all motion is short/declarative.
- **Inline styles** for dynamic per-element values (positions, opacity, animation-delay).

## Routing (current + future)

| Route | Status | Purpose |
|---|---|---|
| `/` | placeholder | Main menu (Phase 8) |
| `/daily` | ✅ live | Today's procedurally generated puzzle |
| `/campaign` | not built | Placeholder page (Phase 8) |
| `/tutorial` | not built | Sequential hand-authored lessons (Phase 7) |
| `/builder` | not built | Draft list (Phase 11) |
| `/builder/[id]` | not built | Editor (Phase 11) |
| `/builder/[id]/playtest` | not built | Enforced solve for publish gate |
| `/play/[id]` | not built | Play a published community level |
| `/auth` | not built | Magic-link sign-in |
| `/auth/callback` | not built | Supabase OAuth callback |

See `docs/superpowers/plans/2026-04-19-dododots-implementation.md` for the full build-out plan.

## Deployment

- **Vercel** auto-deploys from `main` on `github.com/Timothy-Cao/DodoDots`.
- No env vars needed today (Supabase deferred). When added: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Build: `npm run build`.
