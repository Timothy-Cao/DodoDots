<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DodoDots — Agent Handoff

This is the single entry point for any AI agent (or human) picking up DodoDots cold. Read this file first. Deep details live in `docs/`.

## What is DodoDots

A Tron-styled browser puzzle game. You trace a path through a graph of nodes and edges; each node/edge has a counter that decrements when traversed. Win when every counter reaches 0. A variant of Hamiltonian-path / Eulerian-circuit puzzles.

- **Live:** auto-deploys to Vercel from `main` on [github.com/Timothy-Cao/DodoDots](https://github.com/Timothy-Cao/DodoDots)
- **Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Zustand, Vitest, SVG rendering
- **Core routes live today:** `/daily` (procedurally generated puzzle of the day)
- **Routes planned but not built:** `/`, `/campaign`, `/tutorial`, `/builder`, `/builder/[id]`, `/builder/[id]/playtest`, `/play/[id]`, `/auth`

## Quick Reference

| What | Where |
|---|---|
| Spec (design doc) | [`docs/superpowers/specs/2026-04-19-dododots-design.md`](docs/superpowers/specs/2026-04-19-dododots-design.md) |
| Implementation plan | [`docs/superpowers/plans/2026-04-19-dododots-implementation.md`](docs/superpowers/plans/2026-04-19-dododots-implementation.md) |
| Game design philosophy | [`docs/GAME.md`](docs/GAME.md) |
| Architecture + file map | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Open TODOs (prioritized) | [`docs/TODO.md`](docs/TODO.md) |
| QA checklist | [`docs/QA.md`](docs/QA.md) |

## Commands

```bash
npm run dev         # dev server on :3000
npm run build       # production build
npm run test        # vitest watch
npm run test:run    # vitest single run (use in CI and pre-push)
npx tsc --noEmit    # type check without emit
```

## Design Philosophy (compressed — full version in `docs/GAME.md`)

1. **The core verb is tracing a path.** Every ounce of polish goes into making one click feel great and the sequence feel like a rhythm.
2. **Glance-readable state.** The player should always know, in under a second: what can I click, where have I been, what's left.
3. **Prevent invalid moves; don't punish them.** Snap-to-target, dim unreachable options, auto-fail only when the puzzle is objectively impossible.
4. **Commit pulse on every action.** 180ms feedback ring + edge flash + (future) SFX. Dopamine on every click.
5. **Tron aesthetic, disciplined palette:** deep near-black bg, dim grey for pending, cyan for in-progress/HUD chrome, neon green for done, red only for danger/failure.
6. **Exploration > punishment.** Restart (`R`) is cheap; undo (`Z`) is cheaper; move counter is a score, not a fail condition.

## Core Rules (current, authoritative)

- Counts on nodes and edges are the **number of times that element must be traversed**.
- Starting (latching on) a node **decrements its counter by 1**.
- Clicking an adjacent node traverses that edge: **decrements the edge and the destination node**.
- A node at count 0 is **locked** — cannot be traversed *to*. You CAN traverse *from* your current node even if it's at 0.
- Node counters **clamp at 0** (no negatives).
- Edge counters can technically go negative but normally hit 0 and stay (locked target prevents retraversal).
- Win: `isSolved(graph)` — every node and edge count ≤ 0.
- Fail: `findUnreachableEdge(graph)` returns non-null — an edge has count > 0 but both endpoints are locked. Game stores `failedEdge` for UI highlight.
- Move counter: tracks moves used. **NOT a fail condition**. Shown in HUD; turns red if over par. "Par" = `maxMoves` from the puzzle (which equals walk length from the generator).
- Keyboard: `click`, `R` (reset), `Z` (undo one step), `Esc` (back to menu).

## Generator (Daily, today's only content)

Lives in `lib/generator.ts`. Seeded from date (`YYYY-MM-DD`). Algorithm:
1. Poisson-disk sample 6–8 points in `[0.1, 0.9]²`, then relax via repulsion for even spacing.
2. Pick start uniformly.
3. Simulate a random walk of length `round(nodeCount × (1.4 + rand×0.4))`.
4. Walk caps: each node max 2 visits, each edge max 2 visits. Refuses to exceed → walk may end short.
5. Filter out unvisited nodes (avoids stranded islands).
6. Counts = actual visit frequency → always 1 or 2.
7. All edges bidirectional, all nodes start-eligible. Directionality and start restrictions come from the builder later.

Output: `{ graph: Graph; maxMoves: number; solution: string[] }` (solution is the walk itself — guaranteed solvable).

## Architecture Snapshot

```
app/
  layout.tsx          # Orbitron + Inter fonts; root
  globals.css         # Tron palette tokens + animation keyframes
  daily/page.tsx      # Only playable route today

components/game/
  GameBoard.tsx       # SVG viewport; composes nodes/edges; snap target + breadcrumb + pulse + win cascade
  Node.tsx            # Pip rendering, state visuals, commit ring
  Edge.tsx            # Pip rendering, state visuals, flash, failed-edge red
  HUD.tsx             # Moves-used counter + title
  WinOverlay.tsx      # Score display with par
  FailOverlay.tsx     # "Unreachable edge" explainer
  BloomDefs.tsx       # Shared SVG <filter> defs for glow
  GameScreen.tsx      # Container: keyboard, state wiring, delayed overlays
  Comet.tsx           # LEGACY — no longer used; may be removed

lib/
  graph.ts            # Graph types + isSolved, getValidNeighbors, findUnreachableEdge
  game/state.ts       # Pure reducer (initGame, reduce, GameAction)
  generator.ts        # generateDaily entry point
  generator/
    placement.ts      # Poisson-disk + relaxation
    walk.ts           # Capped random walk
  rng.ts              # Seeded PRNG (cyrb128 + mulberry32)
  keyboard.ts         # useKeyboardShortcuts hook
  storage.ts          # localStorage wrappers (audio, dailyCompletions, tutorialProgress, drafts)

stores/
  gameStore.ts        # Zustand: state + history (undo) + lastCommit (pulse)
```

Full details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Status

- **Phase 0–6 of the plan shipped:** scaffolding, Graph module, game reducer, PRNG, generator, SVG visuals, store, GameScreen, Daily route.
- **Polish pass 1 shipped (2026-04-19):** pips instead of numerals, commit pulse, path breadcrumb, win cascade, undo, dropped move-counter hard-fail, stronger idle hierarchy, stranded-edge red flash.
- **Not yet shipped:** main menu, tutorial, builder, audio, Supabase auth/levels, `/play/[id]`, campaign placeholder. See [`docs/TODO.md`](docs/TODO.md).

## Working Principles For Future Agents

- **Before changing the rules:** read `docs/GAME.md` first. The rules are a carefully balanced system; changing node-locking or the fail condition ripples into the generator, builder, and UX.
- **Before changing visuals:** respect the disciplined palette. Grey = pending, cyan = progress/chrome, neon green = done, red = danger. Don't introduce new accent colors without intent.
- **Before adding new actions or state:** verify the core verb remains "trace a path." If a feature doesn't make tracing more satisfying, question it.
- **Tests stay green.** `npm run test:run` before every commit. Pure logic (reducer, generator, graph helpers) has thorough unit coverage — preserve it.
- **TDD is enforced for pure logic.** Components get lighter tests (state→markup). Don't test animations or timing.
- **Commit granularity:** one conceptual change per commit. Messages follow `feat(scope): what` pattern.
- **No hardcoded env values.** Supabase comes later; keep `process.env.NEXT_PUBLIC_SUPABASE_*` references guarded.

## Known Gotchas

- **Next.js 16, Tailwind v4.** Not the versions your training data might default to. Check `node_modules/next/dist/docs/` if surprised.
- **`gh` on this machine** is node-gh not GitHub CLI. Real binary: `/opt/homebrew/Cellar/gh/2.89.0/bin/gh`.
- **Pre-commit hook** scans for hardcoded values; may warn but generally shouldn't block. If it blocks, inspect and proceed thoughtfully.
- **The `Comet.tsx` component is dead code** — the old moving-ball animation was removed. Safe to delete.
- **Play session state is lost on route nav.** Builder drafts use localStorage; Daily uses in-memory. Don't assume persistence unless wired explicitly.
- **There's no main menu yet.** Pressing `Esc` on `/daily` currently routes to `/`, which is the Next.js scaffold placeholder.

## When You Finish Work

Update `docs/TODO.md` — add new TODOs, close completed ones, bump priorities if you learned something. Update `docs/QA.md` if you added something that should be verified. The docs are the memory for the next agent.
