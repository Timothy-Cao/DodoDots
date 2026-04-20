# DodoDots — QA Checklist

Things to verify manually or with tooling before calling the game "done." This complements unit tests, which cover pure logic — the list here is for interaction, visual, performance, and cross-browser concerns that tests don't catch.

Add to this list as new features land. Tick items as you verify.

---

## Gameplay Correctness

### Basic loop
- [ ] Opening `/daily` shows a graph with at least one pulsing start-eligible node.
- [ ] Clicking a pulsing node latches; non-pulsing clicks do nothing.
- [ ] Clicking an adjacent node traverses; the counter on that node and edge decrements by 1.
- [ ] Clicking a non-adjacent node during latched state produces no change (no error, no state change, no visual).
- [ ] Clicking a locked (count=0) node during latched state produces no change.
- [ ] Winning triggers the cascade animation before the overlay.
- [ ] Cascade visually originates from the last-clicked node and radiates outward.
- [ ] WinOverlay shows "Solved in N moves" with optional "Perfect!" at par.

### Fail modes
- [ ] If all edges still have count>0 but both endpoints are locked, the game auto-fails.
- [ ] On auto-fail, the stranded edge flashes red for ~700ms before the overlay appears.
- [ ] Fail overlay explains why (unreachable edge) rather than just "you lost."
- [ ] Running out of `maxMoves` does NOT end the game (rule change 2026-04-19).
- [ ] Over-par move count shows red in HUD with "(par N)" suffix.

### Undo / Reset
- [ ] Pressing `Z` pops one step; state and current node restore to pre-action.
- [ ] Pressing `Z` with no history does nothing (no error).
- [ ] Pressing `R` fully resets to initial graph state.
- [ ] Undo after reset does nothing (history cleared).

### Generator determinism
- [ ] Loading `/daily` twice on the same date produces the identical graph.
- [ ] Changing the client clock produces a different graph (one per date).
- [ ] Generated puzzles are always solvable (the solution array actually wins).
- [ ] No generated puzzle contains counts > 2 today.
- [ ] Generated graphs have no stranded islands (all nodes reachable).

---

## Visual / Feel

### Commit feedback
- [ ] Every successful traverse fires a 180ms expanding ring from the destination node.
- [ ] Edge briefly flashes brighter on traverse.
- [ ] No commit animation on invalid clicks.
- [ ] No lingering animations after 300ms post-click.

### Breadcrumb
- [ ] Visited-but-not-done nodes have a cyan tint distinct from pending (grey) and done (neon green).
- [ ] Visited edges have the same tint distinction.
- [ ] Pips inside a node visually show "consumed" vs "remaining."

### Idle hierarchy
- [ ] In idle phase, start-eligible nodes have a strong cyan halo pulse.
- [ ] In idle phase, non-eligible nodes are visibly dimmer (target: ~30% opacity).
- [ ] Upon latching, all nodes return to normal opacity; valid targets get a pulse.

### Snap preview
- [ ] Moving the mouse near a valid neighbor causes that node to visibly "snap"-highlight.
- [ ] The edge between current and snap target is highlighted.
- [ ] Moving outside any snap range does NOT freeze the snap (should reset when far).

### Tron palette
- [ ] No off-palette colors introduced.
- [ ] All glowing elements use the `bloom-dim` or `bloom-bright` filter.
- [ ] Backgrounds: `#05070d`. Text: `#c9d3e3`. Never pure white or pure black.

### Typography
- [ ] HUD uses Orbitron.
- [ ] Body copy uses Inter.
- [ ] No font flashing (FOUC) on initial load.

---

## Performance

- [ ] Puzzle with 11 nodes renders at 60fps (DevTools Performance tab).
- [ ] Hover movement doesn't thrash React renders (profile mouse-move spam).
- [ ] Commit-ring animation doesn't trigger full-page reflow.
- [ ] On a mid-range laptop, first paint of `/daily` under 1s.
- [ ] Generator runs synchronously in <10ms for 6–8 node puzzles.
- [ ] No memory leaks after 30 puzzle plays (check DevTools Memory).

---

## Cross-Browser

- [ ] Chrome (latest macOS / Windows)
- [ ] Firefox (latest macOS / Windows)
- [ ] Safari (latest macOS / iOS)
- [ ] Edge (latest Windows)
- [ ] SVG filters render consistently on all four (known to be flakey on old Safari).
- [ ] `getScreenCTM` for mouse-to-SVG coords works on all four (known to differ).

---

## Responsive / Device

- [ ] 1920×1080 desktop — graph fills viewport nicely
- [ ] 1366×768 laptop — HUD not clipped
- [ ] iPad 1024×768 — touch interaction at least plausible
- [ ] iPhone 13 Pro 390×844 — minimum viable readability
- [ ] 4K displays — doesn't look tiny (SVG should scale fine but verify)

**Known issue:** No `onTouchStart` / `onPointerMove` handling; mobile is unsupported. Document as TODO, don't fix yet.

---

## Keyboard / Input

- [ ] `R` works
- [ ] `Z` works (new)
- [ ] `Esc` returns to `/`
- [ ] Keyboard shortcuts don't fire when typing in `<input>` (no inputs yet, but when auth/builder come online, ensure scope)
- [ ] AZERTY / Dvorak layouts — `R` and `Z` positions feel OK (or consider physical-key binding)
- [ ] No accidental page refresh on hotkey

---

## Accessibility (deferred, but track)

- [ ] Colorblind-safe mode (green/red distinction) — **P2 TODO**
- [ ] Reduced motion preference honored — **P2 TODO**
- [ ] Keyboard-only navigation — **P2 TODO**
- [ ] Screen reader friendly HUD — not a priority but test with VoiceOver once

---

## Integration Points (future)

When these features come online, add their checks:

- [ ] Supabase auth flow (magic link + OAuth callback)
- [ ] Level builder publish → RPC chain
- [ ] Audio: music loop, SFX timing, volume persistence
- [ ] Tutorial progression + completion flags
- [ ] `/play/[id]` — fetches published level, increments `play_count` / `solve_count`

---

## Known Issues / Watchlist

- SVG filter `feGaussianBlur` may perform poorly on very old GPUs. Fallback to no-filter if we see complaints.
- `document.visibilitychange` music-pause handling (once audio ships) may have race conditions on mobile Safari — test thoroughly.
- Seeded PRNG uses `Math.imul` which is fine on all modern engines but worth a note.
- Tailwind v4's import syntax is new; upgrades might break the theme file.

---

## How to run this checklist

1. For each section relevant to your change, check the items and tick.
2. If you find an issue, file it in [TODO.md](TODO.md) with a specific repro.
3. If an item is no longer relevant, strike it through (`~~text~~`) with a dated note.
4. Don't delete items — they're historical record.
