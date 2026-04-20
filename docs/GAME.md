# DodoDots — Game Design

This document captures the *why* behind DodoDots: the design philosophy, the player experience we're aiming for, and the reasoning behind each rule. Read this before proposing mechanical changes.

## What the game is

DodoDots is a graph-traversal puzzle. You see a graph. Each node and edge has a small number. Pick a start node; then click a sequence of adjacent nodes, tracing a path. Each traversal decrements the counters of the edge and the node you land on. Win when every counter reaches zero.

Mechanically it's a variant of classic Hamiltonian path / Eulerian circuit puzzles, but with a twist: counters > 1 require multiple traversals. The twist is what makes the solution space interesting — sometimes you need to loop back through a node two times, sometimes you can't.

## Reference class

We are pulling from:

- **Hexcells** (Matthew Brown) — minimalist flat UI, snappy commits, every click feels like a small victory.
- **The Witness** — line-drawing as pure verb; invalid paths are prevented, not punished.
- **Flow Free** — the visceral pleasure of a finished path lighting up.
- **Slitherlink / Nikoli puzzles** — glance-readable logical puzzles where the rules are tight.
- **Monument Valley** — aesthetic commitment; every frame is composed.

We are NOT trying to be:
- A flashy mobile gacha game
- A roguelite or RPG
- A multiplayer competitive thing
- A sandbox with dozens of mechanics

**The game is small, tight, and polished.** Every rule earns its keep. Every pixel serves the play.

## Core Verb

> **Tracing a path through constraints.**

That's it. That's the game. Every design decision should make this verb feel better.

- Making the UI glance-readable makes tracing faster.
- Adding commit pulses makes tracing satisfying.
- Undo makes tracing forgiving.
- Auto-fail on impossibility makes tracing focused.
- Pips (vs numerals) makes tracing feel physical.

If you want to add a mechanic, ask: **does this make tracing a path feel better?** If no, cut it.

## The 45-second loop

A well-designed puzzle plays out in roughly this shape:

1. **Setup (0–3s).** Player opens the puzzle. The graph's topology registers. Strong visual hierarchy makes the startable nodes obvious.
2. **Planning (3–15s).** Player mentally traces a route. Maybe two candidates.
3. **Execution (15–40s).** Player clicks through the path. Each click has a micro-commit pulse. Progress visible via the breadcrumb (cyan-tinted visited elements).
4. **Resolution (40–45s).** Win cascade — a wave of bloom radiates from the last click. "Solved in N moves" with optional "Perfect!" if at par. Player closes the tab satisfied.

Every part of the code should protect this arc. When something feels wrong, identify which of the four phases is getting hurt and fix it there.

## Design Principles

### 1. Glance-readable state

The player should always know in under one second:
- **What can I click right now?** (Snap target + halo; dim non-options)
- **Where have I been?** (Cyan-tinted breadcrumb)
- **What's left?** (Grey pending elements with pip counts; green done elements)
- **Am I doing well?** (Moves-used counter)

If state is ever ambiguous, the UI has failed, not the player.

### 2. Commit feedback is non-negotiable

Every successful click MUST produce visible + (eventually) audible feedback within 180ms. A click with no commit feedback feels broken, even if the state did change. We implement this via:
- Destination node: 180ms ring-pulse animation expanding outward
- Edge: brief stroke-brightness flash
- (Future) SFX: short blip

This is the single most important feel-detail in the game.

### 3. Prevent invalid moves; don't punish them

Good puzzle games make mistakes impossible or cheap. DodoDots:
- **Prevents**: clicking non-adjacent nodes (no-op, no state change)
- **Prevents**: clicking locked (count=0) nodes (no-op)
- **Makes cheap**: undo (`Z` — one-step back)
- **Makes cheap**: restart (`R` — full reset)
- **Auto-fails when puzzle is objectively impossible**: unreachable edge detection. Tells the player *why* (red flash on the stranded edge before overlay).

The move counter is a **score**, not a fail condition. This is intentional — counting down to zero creates anxiety without serving the puzzle.

### 4. Exploration over punishment

Because restarts and undo are cheap, players can explore. Try a path; if it fails, undo or restart. This is how humans solve puzzles — by trying, not by getting the first attempt right. Lean into this.

### 5. Tron aesthetic, disciplined palette

| Token | Hex | Meaning |
|---|---|---|
| `--bg-deep` | `#05070d` | Background, bottomless space |
| `--grid` | `#0f1a2b` | Grid lines (subtle, for future background pattern) |
| `--dim` | `#6a7a8f` | Inactive / pending elements |
| `--cyan` | `#39d0ff` | Chrome, HUD, in-progress state, affordances |
| `--neon-green` | `#39ff8e` | Completed elements, "done" signal, win celebration |
| `--danger` | `#ff3b5c` | Failure, danger, over-par warning. Use sparingly. |

**Rules:**
- No element is pure white. Text is `#c9d3e3` (soft blue-white).
- No element is pure black. The deep background is `#05070d` to give glows somewhere to land.
- **No new accent colors** without a rule to justify them.
- Every colored element should have a glow (via `feGaussianBlur` filter). This is the core Tron-ness.

### 6. Motion is short, local, purposeful

- **Commit ring:** 180ms. Anything longer feels like the game is playing instead of the player.
- **Idle pulse:** 1.4s ease-in-out — slow, breathy, doesn't distract.
- **Win cascade:** ~600ms wave — short enough that players don't wait, long enough to feel celebratory.
- **No long-running animations** between user actions. Instantaneous commits.

The banned-motion category:
- Travelling projectiles (comet/ball) from one node to another. Tried in v0; felt sluggish. Removed.
- Easing that takes > 200ms for commits.

### 7. Pips > numerals

Counts of 1 and 2 render as dots (pips), not digits. Pips convert arithmetic into consumption — each traversal visibly consumes a pip (filled green). Numerals are reserved for count ≥ 3 (we don't generate these yet; the builder may allow them).

### 8. The breadcrumb matters more than you think

When every element is either pending (grey) or done (green), mid-puzzle state is hard to read. The breadcrumb — cyan tint on visited-but-not-done elements — tells you "I've been here, I still need to come back." Without it, longer puzzles become disorienting.

### 9. Onboarding is zero-click

Eventually: a gentle "↑ click the glowing node" appears on first visit and fades. No modals, no tutorials before play. First-time players learn by doing.

## Rules (authoritative)

### Nodes

- Have a **count** in `[1, 9]` (generator currently produces 1 or 2).
- Have a **startEligible** flag (all true in generated; builder will let you pick).
- **Locked when count reaches 0.** Cannot be traversed *to* once locked.
- You CAN stay on and traverse FROM a locked node (latching reduces to 0 and you can still pick an adjacent unlocked node).

### Edges

- Have a **count** in `[1, 9]`.
- Have a **direction** in `{bi, forward, backward}`. Generator produces `bi` only today.
- `forward`: only traversable from `from` → `to`.
- `backward`: only traversable from `to` → `from`.
- **Unreachable when**: count > 0 AND both endpoints locked → game auto-fails.

### Actions

- **Latch (start click):** Only valid in `idle` phase, only on `startEligible` nodes with count > 0. Decrements the chosen node. Transitions to `latched`.
- **Traverse:** Only valid in `latched` or `tracing` phase. Target must be an unlocked valid neighbor (respecting direction). Decrements destination node and edge. `current` becomes the target.
- **Reset (`R`):** Full restart. Clears history, lastCommit, returns to idle with initial counts.
- **Undo (`Z`):** Pop one state from history. Returns to prior phase/counts/current.

### Win / Fail

- **Win (`won` phase)** when `isSolved(graph)`: every node count ≤ 0 AND every edge count ≤ 0.
- **Fail (`failed` phase)** when `findUnreachableEdge(graph)` returns non-null. `failedEdge` stores the edge id for UI highlight.
- **Move counter (`movesRemaining`) does NOT trigger fail.** It tracks usage for scoring.

## Difficulty Philosophy (current bootstrap)

For this early phase, Daily puzzles should be:
- **6–8 nodes** (not 4, not 11 — narrow variance)
- **Walk length 10–14** (enough for a couple of doubled-counter elements, not a marathon)
- **All counts in `{1, 2}`** (simple to parse, still interesting)
- **All edges bidirectional** (directionality introduced via builder/tutorial later)

This bootstraps predictable ~2-minute sessions. Variance will come from the builder.

## What's Explicitly OUT OF SCOPE

These are NOT the game. Don't build them unless the user asks:

- Competitive timing / leaderboards
- Multiplayer
- Hints that solve the puzzle for you
- IAPs, ads, accounts-for-play
- Animated characters or narrative
- Procedural generation of "tutorial" material — tutorials are hand-authored
- Mobile-first UX (desktop first, mobile is a later concern)
- A tutorial walkthrough video
- Social sharing buttons

## Open Design Questions (revisit when there's data)

- Should counters ≥ 3 render as nested pips, numerals, or both?
- When (if ever) should directional edges enter the Daily generator?
- Should par be visible before completion, or only as score on win?
- Should Daily have a streak / history calendar?
- What does `/campaign` look like — level select or linear unlock?

Don't build answers yet. Ship, observe, decide.
