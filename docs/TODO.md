# DodoDots — TODO

Prioritized backlog. **When working a task, move it to "In Progress"; when done, mark `[x]` and leave dated.** Keep this file fresh — it's the next agent's memory.

Format: `[ ] TITLE` (one-liner) → **Why** (short rationale) → **How** (sketch). If blocked, add `BLOCKED: reason`.

---

## P0 — Next session should start here

### Gameplay feel

- [ ] **Add minimal SFX** (click latch, traverse commit, win, fail). The AudioManager scaffold exists in the plan (Phase 9) but isn't implemented yet. MVP: single `<audio>` tags triggered on events, no mixing. Volume from localStorage (`storage.getAudio`).
- [ ] **First-play onboarding hint** on `/daily`: ghost arrow + "Click a glowing node to begin" that fades after 3s or first click. Gated on `localStorage.getItem('dododots:has-played')`.
- [ ] **Background grid pattern** via SVG `<pattern>` — subtle 5% alpha grid lines over the deep background. Sells the Tron feel; currently missing.

### Interaction polish

- [ ] **Pointer cursor on eligible starts.** Currently pointer on all nodes. Make non-eligible nodes `cursor: default`.
- [ ] **Disable text selection in gameplay area.** Accidental double-click selection breaks the vibe. `user-select: none` on `GameBoard`.
- [ ] **Trackpad/touch support.** `onMouseMove` only; add `onPointerMove` / basic touch handling so mobile is at least not broken.

### Content

- [ ] **Main menu at `/`** (Phase 8 of the plan). Replace the Next.js scaffold placeholder. Links: Daily, Tutorial (disabled), Builder (disabled), Campaign (coming soon), Settings.

---

## P1 — Soon, before community content

### Builder + persistence (big)

- [ ] **Level builder** — see Phase 11 of the implementation plan. Supabase schema + auth + RPCs are already specified.
- [ ] **Tutorial** (Phase 7 of the plan). 5–7 hand-authored lessons teaching the mechanics.

### Quality / smoothness

- [ ] **Undo visual feedback** — when you press `Z`, briefly flash the "undone" node/edge in cyan so the player sees what happened.
- [ ] **Redo (`Shift+Z` or `Y`)** — if we tracked history, we can trivially track a redo stack too.
- [ ] **Graph fit-to-viewport.** Right now the SVG viewBox is 0–100 and nodes live in 0.1–0.9. If a puzzle happens to cluster to one corner (generator edge case), wasted space is ugly. Auto-pan/zoom or tighter bounding.
- [ ] **Puzzle thumbnail on win overlay** — show the solved graph inline under "SOLVED" instead of just the text. Great for screenshots/sharing.

### Generator quality

- [ ] **Reject trivial puzzles.** If the walk is shorter than 6 steps, generate a different seed offset. Players don't want a 2-move "daily."
- [ ] **Difficulty tiers** — internal category (easy/med/hard) derived from nodeCount × walk-complexity. Expose as a ★ rating on the HUD.
- [ ] **Seed offset for bad seeds** — if the walk stalls (early termination due to caps) and the result is too short, increment seed and retry.

---

## P2 — Nice to have

### Visual

- [ ] **Dim visited edges slightly more** once both endpoints are done. Right now they stay green; they could fade to a muted green to let unfinished regions pop.
- [ ] **Subtle particle layer** behind the graph. Few drifting dots. Adds life without noise.
- [ ] **Smooth transform on graph reflow** when the viewport resizes. Small touch; currently it just snaps.
- [ ] **Win-cascade direction hint** — the wave should visibly originate from the *last node clicked* (it already does, but strengthen the motion so players register it).

### UX

- [ ] **Best-score tracking** per daily date. Store in `dailyCompletions` (`bestMoves` field). Show "Your best: N" on re-play.
- [ ] **Share result** — generate a URL (`/daily?date=2026-04-19&seed=x`) or a screenshot. Decide: is sharing part of the product or out of scope?
- [ ] **Streak counter** — N days in a row you've solved daily. Displayed on main menu once menu exists.
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
- [ ] **Mobile-first UX pass** — touch-optimized controls, responsive layout, haptic feedback.

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
