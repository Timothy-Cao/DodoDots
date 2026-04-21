# DodoDots — TODO

Prioritized backlog. **When working a task, move it to "In Progress"; when done, mark `[x]` and leave dated.** Keep this file fresh — it's the next agent's memory.

Format: `[ ] TITLE` (one-liner) → **Why** (short rationale) → **How** (sketch). If blocked, add `BLOCKED: reason`.

---

## P0 — Next session should start here

### Gameplay feel

- [x] 2026-04-20 — **Add SFX** — zero-asset Web Audio API synth in `lib/sfx.ts`: latch, traverse, complete (element hits 0), win (C-E-G chord), fail, undo, invalid. Wired into `gameStore.dispatch` and `undo`. AudioContext unlocked on first pointerdown in GameScreen.
- [x] 2026-04-20 — **First-play onboarding hint** — `<FirstPlayHint>` pill fades after 4.5s or first pointerdown; gated on `dododots:hasPlayed` in localStorage.
- [x] 2026-04-20 — **Background grid pattern** — full-viewport CSS grid on `html` element (40px, 5% alpha cyan lines). SVG `<pattern>` rect removed; CSS is single source of truth.

### Interaction polish

- [x] 2026-04-20 — **Pointer cursor on eligible starts** — hit-target circle sets cursor:pointer for clickable nodes, cursor:default for locked/unreachable.
- [x] 2026-04-20 — **Disable text selection in gameplay area** — `user-select:none` + `-webkit-user-select:none` on `body` in globals.css.
- [x] 2026-04-20 — **Trackpad/touch support** — switched to `onPointerMove`/`onPointerLeave` on GameBoard; touch skips snap preview (finger occlusion). Nodes use `onPointerDown` hit targets.

### Content

- [x] 2026-04-20 — **Main menu at `/`** — minimal Tron-styled menu with Daily, Tutorial, and disabled stubs for Campaign and Builder.

---

## P1 — Soon, before community content

### Builder + persistence (big)

- [ ] **Level builder** — see Phase 11 of the implementation plan. Supabase schema + auth + RPCs are already specified.
- [x] 2026-04-20 — **Tutorial** — `/tutorial` route with 4 hand-authored levels (click, path, revisit, think-ahead). Caption bar + Next/Finish progression. Solvability verified in `lib/__tests__/tutorial.test.ts`.

### Quality / smoothness

- [ ] **Undo visual feedback** — when you press `Z`, briefly flash the "undone" node/edge in cyan so the player sees what happened.
- [ ] **Redo (`Shift+Z` or `Y`)** — if we tracked history, we can trivially track a redo stack too.
- [x] 2026-04-20 — **Graph fit-to-viewport** — dynamic viewBox now matches container aspect ratio via ResizeObserver in `GameBoard.tsx`. Nodes project to full play area on both portrait and landscape.
- [ ] **Puzzle thumbnail on win overlay** — show the solved graph inline under "SOLVED" instead of just the text. Great for screenshots/sharing.

### Generator quality

- [ ] **Reject trivial puzzles.** If the walk is shorter than 6 steps, generate a different seed offset. Players don't want a 2-move "daily."
- [ ] **Difficulty tiers** — internal category (easy/med/hard) derived from nodeCount × walk-complexity. Expose as a ★ rating on the HUD.
- [ ] **Seed offset for bad seeds** — if the walk stalls (early termination due to caps) and the result is too short, increment seed and retry.

---

## P2 — Nice to have

### Done in 2026-04-20 polish + retention pass (recap)

- [x] 2026-04-20 — **Auto-curve overlapping edges** — `lib/layout.ts` computes signed curvature per edge from segment crossings (away-from-other-midpoint heuristic) and small-angle fan-outs from shared nodes (< ~25.8°). `Edge.tsx` renders bezier `<path>` when curvature ≠ 0; tick marks placed on the curve via `bezierPoint`/`bezierTangent`. CSS animations extended to both `line` and `path` selectors. **Curved + directed arrows still TODO** (generator only emits bidirectional today).

- [x] 2026-04-20 — **Placement no longer pins nodes to corners** — Lloyd-ish spring relaxation around `MIN_DIST*1.5`. Verified: each generated puzzle now has interior nodes.
- [x] 2026-04-20 — **Snap visual is distinct from done** — snap target is cyan (not green) with dashed pulsing halo on nodes and a "chasing ants" stroke-dashoffset animation on edges.
- [x] 2026-04-20 — **First-play hint dismisses only on valid latch or timeout** — listens to `gameStore` phase transition, not blanket `pointerdown`.
- [x] 2026-04-20 — **Pip grammar unified** — all pips are filled circles for nodes / perpendicular ticks for edges. Grey = remaining, neon green = consumed. Count-1 reads as clearly as count-2.
- [x] 2026-04-20 — **HUD label** — moves counter shows `MOVES · N` / `OVER PAR M` (was bare digit).
- [x] 2026-04-20 — **Streak tracking + 30-day calendar** — `storage.updateStreakOnSolve`, `<StreakBadge>`, `<SolvedCalendar>` on main menu.
- [x] 2026-04-20 — **Share result** — `lib/share.ts` with star rating + Web Share API + clipboard fallback. Wired into `WinOverlay` for Daily.
- [x] 2026-04-20 — **PWA installable + offline after first visit** — `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`, `public/sw.js`, `<ServiceWorkerRegistrar>`.
- [x] 2026-04-20 — **SEO basics** — `app/robots.ts`, `app/sitemap.ts`, expanded metadata + OpenGraph + Twitter card in `app/layout.tsx`.
- [x] 2026-04-20 — **Synthesized SFX (no assets)** — Web Audio API oscillator-based: latch, traverse, complete, win (chord), fail, undo, invalid. Respects `storage.audio.sfx` volume + mute.

### Visual

- [ ] **Dim visited edges slightly more** once both endpoints are done. Right now they stay green; they could fade to a muted green to let unfinished regions pop.
- [ ] **Subtle particle layer** behind the graph. Few drifting dots. Adds life without noise.
- [ ] **Smooth transform on graph reflow** when the viewport resizes. Small touch; currently it just snaps.
- [ ] **Win-cascade direction hint** — the wave should visibly originate from the *last node clicked* (it already does, but strengthen the motion so players register it).

### UX

- [ ] **Best-score tracking** per daily date. Store in `dailyCompletions` (`bestMoves` field). Show "Your best: N" on re-play.
- [x] 2026-04-20 — **Share result** — `lib/share.ts` with Web Share API + clipboard fallback. Star rating (1–4 stars based on moves/par ratio). Share button on daily win overlay, inline 'Copied!' feedback for clipboard path.
- [x] 2026-04-20 — **Streak counter** — `storage.getStreak` / `updateStreakOnSolve`. `<StreakBadge>` on main menu (hidden when streak=0). 30-day `<SolvedCalendar>` grid also on main menu.
- [ ] **Keyboard shortcut legend** — small `?` button in HUD that shows `R, Z, Esc` list on hover.

### Accessibility

- [ ] **Colorblind safe mode.** Current green/red/grey is probably problematic for deuteranopia. Add a toggle to shift green → cyan-white, red → orange-white.
- [ ] **Reduced motion support** — `@media (prefers-reduced-motion)` to disable pulses and win cascade.
- [ ] **Keyboard-only navigation** — arrow keys to move between nodes + enter to click. For accessibility and power users.

### Dead code / cleanup

- [x] 2026-04-19 — ~~Delete `components/game/Comet.tsx`~~ — already removed in polish pass.
- [x] 2026-04-19 — ~~Audit `stores/gameStore.ts` for leftover anim/queued state~~ — verified clean.
- [ ] **CSS animations in `globals.css` are accumulating** — consider splitting into `styles/animations.css` when it grows past ~40 lines.

---

## P3 — Research / long tail

- [ ] **Directional edges in generator** — once the builder allows them, teach the generator to use them sparingly for variety.
- [ ] **Edge curvature when two nodes share multiple edges.** Current rendering overlaps them into a single line visually.
- [ ] **Solve-hint mode** — shows the next step. Locked unless the player requests it. Affects score.
- [ ] **Campaign structure** — decide: linear unlock, world map, or free select?
- [ ] **Community level moderation** — once publishing exists, how do we handle spam/inappropriate content?
- [ ] **Procedural campaign** — can the generator produce a sequence of increasing-difficulty puzzles with curriculum? (Might replace hand-authored campaign entirely.)
- [x] 2026-04-20 — **Mobile UX pass** — viewport meta, safe-area CSS, touch-action:none on SVG, 44pt hit targets on nodes, haptic vibrate(8ms) on traverse, ActionBar (Undo/Reset/Menu), responsive HUD with clamp(), 48px overlay buttons.

---

## Investigation / verification needed

See [QA.md](QA.md) for the full check list. Summary of what to verify before a production push:

- [ ] Click + snap on small viewports (375px wide mobile)
- [ ] Windows Chrome / Firefox / Safari compatibility (SVG filters have known flakes)
- [ ] Performance on 20+ node puzzles (builder can create these)
- [ ] Keyboard layouts: AZERTY, Dvorak — does `R`/`Z` still feel natural?
- [ ] Does the commit-ring animation cause repaint lag on low-end hardware?
- [ ] Seeded PRNG determinism across Node / browser / different builds

---

## Completed

- [x] 2026-04-20 — Visual: unified filled-pip grammar — node pips always filled (grey=remaining, green=consumed); edge pips replaced with perpendicular tick marks (line segments) for visual grammar distinction
- [x] 2026-04-20 — Visual: full-viewport CSS grid background; SVG grid rect removed
- [x] 2026-04-20 — HUD moves counter labeled "MOVES · N" (was bare number)
- [x] 2026-04-20 — Streak tracking: `getStreak`/`updateStreakOnSolve` in storage; StreakBadge + SolvedCalendar on main menu
- [x] 2026-04-20 — Share button on daily win overlay via Web Share API + clipboard fallback with star rating
- [x] 2026-04-20 — SFX: zero-asset synth system (7 sounds), wired into game store and GameScreen

- [x] 2026-04-20 — Mobile foundation: viewport, safe-area CSS, .game-svg touch-action:none, 44pt hit targets, pointer events, haptic feedback
- [x] 2026-04-20 — ActionBar (Undo/Reset/Menu) floating pill at bottom of every GameScreen
- [x] 2026-04-20 — Responsive HUD (clamp font-size/padding) + 48px overlay buttons safe for notches
- [x] 2026-04-20 — FirstPlayHint on /daily (one-time, dismissed on first tap)
- [x] 2026-04-20 — Main menu at / with Daily, Tutorial, Campaign stub, Builder stub
- [x] 2026-04-20 — Tutorial: 4 hand-authored levels + /tutorial route + solvability tests
- [x] 2026-04-19 — Scaffolded Next.js 16 project + dependencies + Vitest
- [x] 2026-04-19 — Graph types, adjacency helpers, isSolved
- [x] 2026-04-19 — Pure game state machine (latch, traverse, reset)
- [x] 2026-04-19 — Seeded PRNG (cyrb128 + mulberry32)
- [x] 2026-04-19 — Procedural Daily generator with capped walk
- [x] 2026-04-19 — SVG renderer (NodeView, EdgeView, BloomDefs, GameBoard)
- [x] 2026-04-19 — HUD, WinOverlay, FailOverlay (initial versions)
- [x] 2026-04-19 — Zustand game store with animation queueing (later removed)
- [x] 2026-04-19 — `useKeyboardShortcuts` hook
- [x] 2026-04-19 — `/daily` route with localStorage completion persistence
- [x] 2026-04-19 — Pushed to GitHub + auto-deploy to Vercel
- [x] 2026-04-19 — Rule tightening: node-locking at 0, unreachable-edge auto-fail
- [x] 2026-04-19 — Generator capped to counts ≤ 2 (1s and 2s only for now)
- [x] 2026-04-19 — Placement relaxation for even spacing
- [x] 2026-04-19 — Ghost-line snap preview (later simplified to in-graph edge highlight)
- [x] 2026-04-19 — Polish pass: pips instead of numerals, commit pulse ring, edge flash, path breadcrumb, undo (`Z`), dropped max-moves hard-fail, win cascade wave, stranded-edge red flash
