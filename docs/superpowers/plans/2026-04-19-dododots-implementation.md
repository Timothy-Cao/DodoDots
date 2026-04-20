# DodoDots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build DodoDots — a Tron-styled web puzzle game with procedurally generated Daily puzzles, tutorial, level builder, and Supabase-backed publishing — from zero to deployed on Vercel.

**Architecture:** Next.js 15 (App Router) + React + TypeScript. SVG renderer with bloom filters for game graph. Pure-function game state machine + Zustand stores. Supabase for auth and published levels; localStorage for settings/drafts/progress. Client-side seeded procedural generator for Daily (no server content required). Web Audio API for music playlist + SFX.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, Framer Motion, Supabase JS, Vitest + @testing-library/react, ESLint, Orbitron via next/font.

**Related spec:** [2026-04-19-dododots-design.md](../specs/2026-04-19-dododots-design.md)

---

## File Structure (target)

```
dododots/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Main menu
│   ├── daily/page.tsx
│   ├── campaign/page.tsx
│   ├── tutorial/page.tsx
│   ├── builder/page.tsx            # Draft list
│   ├── builder/[id]/page.tsx       # Editor
│   ├── builder/[id]/playtest/page.tsx
│   └── play/[id]/page.tsx
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx
│   │   ├── Node.tsx
│   │   ├── Edge.tsx
│   │   ├── HUD.tsx
│   │   ├── WinOverlay.tsx
│   │   ├── FailOverlay.tsx
│   │   └── BloomDefs.tsx
│   ├── builder/
│   │   ├── BuilderCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── Inspector.tsx
│   │   └── LevelSettings.tsx
│   └── ui/
│       ├── MenuLayout.tsx
│       ├── Button.tsx
│       ├── Slider.tsx
│       ├── Modal.tsx
│       └── SettingsPanel.tsx
├── lib/
│   ├── graph.ts                    # Graph types, adjacency, isSolved
│   ├── game/
│   │   ├── state.ts                # GameState + reducer (pure)
│   │   └── events.ts               # Action types
│   ├── generator.ts                # Procedural Daily generator
│   ├── rng.ts                      # Seeded PRNG
│   ├── audio.ts                    # AudioManager
│   ├── supabase.ts                 # Client factory
│   ├── storage.ts                  # localStorage wrappers
│   └── keyboard.ts                 # useKeyboardShortcuts hook
├── stores/
│   ├── gameStore.ts
│   ├── builderStore.ts
│   └── audioStore.ts
├── content/tutorial/*.json
├── public/
│   ├── music/.gitkeep
│   ├── sfx/.gitkeep
│   └── music-manifest.json         # generated
├── scripts/build-music-manifest.mjs
├── supabase/migrations/*.sql
├── styles/globals.css
├── vitest.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 0: Scaffolding

### Task 0.1: Create Next.js app

**Files:**
- Create: entire project directory `/Users/bytedance/Documents/Personal/dododots/`

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
cd /Users/bytedance/Documents/Personal/dododots
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --turbo
```

Accept defaults when prompted.

- [ ] **Step 2: Verify it runs**

Run: `npm run dev`
Expected: Server starts on :3000, default Next page loads.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app"
```

---

### Task 0.2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add runtime deps**

Run:
```bash
npm install zustand @supabase/supabase-js @supabase/ssr
```

> **Note:** No `framer-motion` — all animations in this plan use CSS + RAF. Add it later only if a declarative transition is hard to express in CSS.

- [ ] **Step 2: Add dev deps (test harness)**

Run:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react happy-dom
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add runtime and test deps"
```

---

### Task 0.3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (scripts)
- Modify: `tsconfig.json` (types)

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Write vitest.setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add scripts to package.json**

Add under `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run",
"test:ui": "vitest --ui"
```

- [ ] **Step 4: Add types to tsconfig.json**

Under `"compilerOptions"` ensure `"types": ["vitest/globals", "@testing-library/jest-dom"]`.

- [ ] **Step 5: Sanity test**

Create `lib/__tests__/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
describe('sanity', () => { it('works', () => expect(1 + 1).toBe(2)); });
```

Run: `npm run test:run`
Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with happy-dom"
```

---

### Task 0.4: Initialize GitHub repo

- [ ] **Step 1: Create GitHub repo**

Run:
```bash
gh repo create DodoDots --public --source=. --remote=origin --push
```

- [ ] **Step 2: Verify**

Run: `git remote -v`
Expected: origin pointing to github.com/<user>/DodoDots.

---

## Phase 1: Graph Types & Helpers (pure TDD)

### Task 1.1: Graph types

**Files:**
- Create: `lib/graph.ts`
- Test: `lib/__tests__/graph.test.ts`

- [ ] **Step 1: Write failing test**

In `lib/__tests__/graph.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isSolved, type Graph } from '../graph';

const g: Graph = {
  nodes: [{ id: 'a', x: 0.5, y: 0.5, count: 0, startEligible: true }],
  edges: [],
};

describe('isSolved', () => {
  it('returns true when all counts are <= 0', () => {
    expect(isSolved(g)).toBe(true);
  });
  it('returns false when any node count > 0', () => {
    expect(isSolved({ ...g, nodes: [{ ...g.nodes[0], count: 1 }] })).toBe(false);
  });
  it('returns false when any edge count > 0', () => {
    const g2: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 0, startEligible: true },
        { id: 'b', x: 1, y: 1, count: 0, startEligible: true },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    expect(isSolved(g2)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (fails)**

Run: `npm run test:run lib/__tests__/graph.test.ts`
Expected: FAIL ("isSolved not defined").

- [ ] **Step 3: Implement**

In `lib/graph.ts`:
```ts
export type Direction = 'bi' | 'forward' | 'backward';

export type GraphNode = {
  id: string;
  x: number;          // normalized [0..1]
  y: number;
  count: number;      // domain 1..9 but can go negative mid-game
  startEligible: boolean;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  count: number;
  direction: Direction;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function isSolved(g: Graph): boolean {
  return g.nodes.every(n => n.count <= 0) && g.edges.every(e => e.count <= 0);
}
```

- [ ] **Step 4: Tests pass**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/graph.ts lib/__tests__/graph.test.ts
git commit -m "feat(graph): add Graph types and isSolved"
```

---

### Task 1.2: Adjacency helpers

**Files:**
- Modify: `lib/graph.ts`
- Test: `lib/__tests__/graph.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `lib/__tests__/graph.test.ts`:
```ts
import { getValidNeighbors, findEdge } from '../graph';

const diamond: Graph = {
  nodes: [
    { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
    { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
    { id: 'c', x: 1, y: 1, count: 1, startEligible: false },
  ],
  edges: [
    { id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' },
    { id: 'e2', from: 'a', to: 'c', count: 1, direction: 'forward' }, // a->c only
    { id: 'e3', from: 'c', to: 'a', count: 1, direction: 'forward' }, // c->a via another edge (parallel)
  ],
};

describe('getValidNeighbors', () => {
  it('includes bidirectional neighbors', () => {
    const n = getValidNeighbors(diamond, 'a');
    expect(n.map(x => x.nodeId).sort()).toEqual(['b', 'c']);
  });
  it('includes forward-direction when current is `from`', () => {
    const n = getValidNeighbors(diamond, 'a');
    expect(n.find(x => x.nodeId === 'c' && x.edgeId === 'e2')).toBeDefined();
  });
  it('excludes forward-direction when current is `to`', () => {
    const n = getValidNeighbors(diamond, 'b');
    expect(n.map(x => x.nodeId)).toEqual(['a']);
  });
});

describe('findEdge', () => {
  it('finds a valid edge between two nodes', () => {
    const e = findEdge(diamond, 'a', 'b');
    expect(e?.id).toBe('e1');
  });
  it('respects direction', () => {
    expect(findEdge(diamond, 'b', 'c')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests (fail)**

Run: `npm run test:run`

- [ ] **Step 3: Implement**

Append to `lib/graph.ts`:
```ts
export type Neighbor = { nodeId: string; edgeId: string };

export function getValidNeighbors(g: Graph, fromId: string): Neighbor[] {
  const out: Neighbor[] = [];
  for (const e of g.edges) {
    if (e.from === fromId && (e.direction === 'bi' || e.direction === 'forward')) {
      out.push({ nodeId: e.to, edgeId: e.id });
    } else if (e.to === fromId && (e.direction === 'bi' || e.direction === 'backward')) {
      out.push({ nodeId: e.from, edgeId: e.id });
    }
  }
  return out;
}

export function findEdge(g: Graph, fromId: string, toId: string): GraphEdge | undefined {
  return getValidNeighbors(g, fromId)
    .filter(n => n.nodeId === toId)
    .map(n => g.edges.find(e => e.id === n.edgeId))
    .find(Boolean);
}

export function getNode(g: Graph, id: string): GraphNode | undefined {
  return g.nodes.find(n => n.id === id);
}
```

- [ ] **Step 4: Tests pass**

Run: `npm run test:run`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(graph): add adjacency helpers"
```

---

## Phase 2: Game State Machine (pure TDD)

### Task 2.1: GameState types + initial state

**Files:**
- Create: `lib/game/state.ts`
- Create: `lib/game/__tests__/state.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { initGame } from '../state';
import type { Graph } from '../../graph';

const twoNode: Graph = {
  nodes: [
    { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
    { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
  ],
  edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
};

describe('initGame', () => {
  it('starts in Idle phase with unmodified counts', () => {
    const s = initGame(twoNode, 3);
    expect(s.phase).toBe('idle');
    expect(s.graph.nodes[0].count).toBe(1);
    expect(s.movesRemaining).toBe(3);
    expect(s.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run test (fails)**

- [ ] **Step 3: Implement**

In `lib/game/state.ts`:
```ts
import type { Graph } from '../graph';

export type Phase = 'idle' | 'latched' | 'tracing' | 'won' | 'failed';

export type GameState = {
  graph: Graph;          // mutable counts; initial counts preserved in `initialGraph`
  initialGraph: Graph;
  maxMoves: number;
  movesRemaining: number;
  phase: Phase;
  current: string | null; // current node id after latch/traverse
};

export function initGame(graph: Graph, maxMoves: number): GameState {
  return {
    graph: structuredClone(graph),
    initialGraph: structuredClone(graph),
    maxMoves,
    movesRemaining: maxMoves,
    phase: 'idle',
    current: null,
  };
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(game): initGame and GameState types"
```

---

### Task 2.2: `latch` action

**Files:**
- Modify: `lib/game/state.ts`
- Modify: `lib/game/__tests__/state.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { reduce } from '../state';

describe('reduce/latch', () => {
  it('transitions idle -> latched and decrements the node counter', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('latched');
    expect(s1.current).toBe('a');
    expect(s1.graph.nodes[0].count).toBe(0);
  });
  it('ignores latch on non-start-eligible node', () => {
    const s0 = initGame(twoNode, 3);
    const s1 = reduce(s0, { type: 'latch', nodeId: 'b' });
    expect(s1).toBe(s0);
  });
  it('transitions to won if the latched node was the last unfinished element', () => {
    const g: Graph = {
      nodes: [{ id: 'a', x: 0, y: 0, count: 1, startEligible: true }],
      edges: [],
    };
    const s1 = reduce(initGame(g, 1), { type: 'latch', nodeId: 'a' });
    expect(s1.phase).toBe('won');
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

Append to `lib/game/state.ts`:
```ts
import { getNode, isSolved } from '../graph';

export type GameAction =
  | { type: 'latch'; nodeId: string }
  | { type: 'traverse'; nodeId: string }
  | { type: 'reset' };

export function reduce(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'latch': {
      if (s.phase !== 'idle') return s;
      const node = getNode(s.graph, a.nodeId);
      if (!node || !node.startEligible) return s;
      const graph = {
        ...s.graph,
        nodes: s.graph.nodes.map(n =>
          n.id === a.nodeId ? { ...n, count: n.count - 1 } : n
        ),
      };
      const next: GameState = { ...s, graph, current: a.nodeId, phase: 'latched' };
      return isSolved(graph) ? { ...next, phase: 'won' } : next;
    }
    case 'reset':
      return initGame(s.initialGraph, s.maxMoves);
    default:
      return s;
  }
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(game): latch and reset actions"
```

---

### Task 2.3: `traverse` action

**Files:**
- Modify: `lib/game/state.ts`
- Modify: `lib/game/__tests__/state.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe('reduce/traverse', () => {
  it('decrements edge + destination node, sets current, decrements movesRemaining', () => {
    let s = initGame(twoNode, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s.phase).toBe('won'); // both node counts were 1, edge 1 -> all zero
    expect(s.graph.edges[0].count).toBe(0);
    expect(s.graph.nodes[1].count).toBe(0);
    expect(s.movesRemaining).toBe(2);
    expect(s.current).toBe('b');
  });

  it('ignores traverse to non-adjacent node', () => {
    let s = initGame({
      nodes: [
        { id: 'a', x: 0, y: 0, count: 1, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 1, startEligible: false },
        { id: 'c', x: 2, y: 0, count: 1, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    }, 3);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    const s2 = reduce(s, { type: 'traverse', nodeId: 'c' });
    expect(s2).toBe(s); // unchanged
  });

  it('fails when movesRemaining hits 0 without solving', () => {
    const g: Graph = {
      nodes: [
        { id: 'a', x: 0, y: 0, count: 2, startEligible: true },
        { id: 'b', x: 1, y: 0, count: 2, startEligible: false },
      ],
      edges: [{ id: 'e1', from: 'a', to: 'b', count: 1, direction: 'bi' }],
    };
    let s = initGame(g, 1);
    s = reduce(s, { type: 'latch', nodeId: 'a' });
    s = reduce(s, { type: 'traverse', nodeId: 'b' });
    expect(s.phase).toBe('failed');
    expect(s.movesRemaining).toBe(0);
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

Add `traverse` case to `reduce`:
```ts
case 'traverse': {
  if (s.phase !== 'latched' && s.phase !== 'tracing') return s;
  if (s.current === null) return s;
  if (s.movesRemaining <= 0) return s;
  const neighbors = getValidNeighbors(s.graph, s.current);
  const hit = neighbors.find(n => n.nodeId === a.nodeId);
  if (!hit) return s;
  const graph: Graph = {
    nodes: s.graph.nodes.map(n =>
      n.id === a.nodeId ? { ...n, count: n.count - 1 } : n
    ),
    edges: s.graph.edges.map(e =>
      e.id === hit.edgeId ? { ...e, count: e.count - 1 } : e
    ),
  };
  const movesRemaining = s.movesRemaining - 1;
  const next: GameState = { ...s, graph, current: a.nodeId, movesRemaining, phase: 'tracing' };
  if (isSolved(graph)) return { ...next, phase: 'won' };
  if (movesRemaining === 0) return { ...next, phase: 'failed' };
  return { ...next, phase: 'latched' };
}
```

Add import: `import { getValidNeighbors } from '../graph';`

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(game): traverse action with move counter and win/fail detection"
```

> **Note:** The reducer emits `tracing` only as an ephemeral phase — in pure logic it collapses back to `latched`. The UI layer will hold `tracing` for ~250ms during the comet animation. Tests assert final phase.

---

## Phase 3: Seeded PRNG + Procedural Generator

### Task 3.1: Seeded PRNG

**Files:**
- Create: `lib/rng.ts`
- Create: `lib/__tests__/rng.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';

describe('createRng', () => {
  it('is deterministic given the same seed', () => {
    const a = createRng('2026-04-19');
    const b = createRng('2026-04-19');
    const as = Array.from({ length: 5 }, () => a());
    const bs = Array.from({ length: 5 }, () => b());
    expect(as).toEqual(bs);
  });
  it('produces numbers in [0,1)', () => {
    const r = createRng('seed');
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement (mulberry32 with cyrb128 hash)**

```ts
function cyrb128(s: string): number {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  return h1 >>> 0;
}

export function createRng(seed: string): () => number {
  let a = cyrb128(seed);
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(rng): seeded PRNG and helpers"
```

---

### Task 3.2: Node placement (Poisson-disk-lite)

**Files:**
- Create: `lib/generator/placement.ts`
- Test: `lib/generator/__tests__/placement.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { placeNodes } from '../placement';
import { createRng } from '../../rng';

describe('placeNodes', () => {
  it('returns requested count in [0.1,0.9] range', () => {
    const pts = placeNodes(createRng('x'), 7);
    expect(pts.length).toBe(7);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0.1);
      expect(p.x).toBeLessThanOrEqual(0.9);
      expect(p.y).toBeGreaterThanOrEqual(0.1);
      expect(p.y).toBeLessThanOrEqual(0.9);
    }
  });
  it('no two points closer than min separation', () => {
    const pts = placeNodes(createRng('y'), 8);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        expect(Math.hypot(dx, dy)).toBeGreaterThan(0.12);
      }
    }
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement (dart-throwing with retries)**

```ts
export type Point = { x: number; y: number };

export function placeNodes(rng: () => number, count: number): Point[] {
  const MIN_DIST = 0.15;
  const placed: Point[] = [];
  let attempts = 0;
  while (placed.length < count && attempts < 2000) {
    const p = { x: 0.1 + rng() * 0.8, y: 0.1 + rng() * 0.8 };
    const ok = placed.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_DIST);
    if (ok) placed.push(p);
    attempts++;
  }
  // fallback: relax if impossible
  while (placed.length < count) {
    placed.push({ x: 0.1 + rng() * 0.8, y: 0.1 + rng() * 0.8 });
  }
  return placed;
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(generator): node placement"
```

---

### Task 3.3: Random walk simulation

**Files:**
- Create: `lib/generator/walk.ts`
- Test: `lib/generator/__tests__/walk.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { simulateWalk } from '../walk';
import { createRng } from '../../rng';
import { placeNodes } from '../placement';

describe('simulateWalk', () => {
  it('respects max degree 4', () => {
    const pts = placeNodes(createRng('a'), 8);
    const walk = simulateWalk(createRng('b'), pts, 20);
    const deg: Record<number, number> = {};
    for (const e of walk.edges) {
      deg[e.a] = (deg[e.a] ?? 0) + 1;
      deg[e.b] = (deg[e.b] ?? 0) + 1;
    }
    for (const v of Object.values(deg)) expect(v).toBeLessThanOrEqual(4);
  });
  it('steps length equals requested length', () => {
    const pts = placeNodes(createRng('c'), 6);
    const walk = simulateWalk(createRng('d'), pts, 15);
    expect(walk.steps.length).toBe(15);
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

```ts
import type { Point } from './placement';

export type WalkEdge = { a: number; b: number };
export type Walk = {
  start: number;
  steps: Array<{ from: number; to: number; edgeKey: string }>;
  edges: WalkEdge[];
};

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function simulateWalk(
  rng: () => number,
  points: Point[],
  length: number
): Walk {
  const n = points.length;
  const edges = new Map<string, WalkEdge>();
  const degree = new Array(n).fill(0);
  const adj: Record<number, number[]> = {};
  for (let i = 0; i < n; i++) adj[i] = [];

  const start = Math.floor(rng() * n);
  let cur = start;
  const steps: Walk['steps'] = [];
  let prev = -1;

  for (let i = 0; i < length; i++) {
    const useExisting = rng() < 0.7 && adj[cur].length > 0;
    let next: number;
    if (useExisting) {
      next = adj[cur][Math.floor(rng() * adj[cur].length)];
      // 15% backtrack preference
      if (prev !== -1 && rng() < 0.15) next = prev;
    } else {
      // Pick new neighbor weighted by inverse distance, respecting degree cap
      const candidates: Array<{ id: number; w: number }> = [];
      for (let j = 0; j < n; j++) {
        if (j === cur) continue;
        if (degree[j] >= 4 || degree[cur] >= 4) continue;
        if (adj[cur].includes(j)) continue;
        const d = Math.hypot(points[cur].x - points[j].x, points[cur].y - points[j].y);
        candidates.push({ id: j, w: 1 / Math.max(d, 0.05) });
      }
      if (candidates.length === 0) {
        // fallback to existing if any, else break
        if (adj[cur].length === 0) break;
        next = adj[cur][Math.floor(rng() * adj[cur].length)];
      } else {
        const total = candidates.reduce((s, c) => s + c.w, 0);
        let r = rng() * total;
        next = candidates[0].id;
        for (const c of candidates) {
          r -= c.w;
          if (r <= 0) { next = c.id; break; }
        }
        const k = edgeKey(cur, next);
        if (!edges.has(k)) {
          edges.set(k, { a: cur, b: next });
          adj[cur].push(next);
          adj[next].push(cur);
          degree[cur]++;
          degree[next]++;
        }
      }
    }
    steps.push({ from: cur, to: next, edgeKey: edgeKey(cur, next) });
    prev = cur;
    cur = next;
  }

  return { start, steps, edges: Array.from(edges.values()) };
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(generator): random walk simulation"
```

---

### Task 3.4: Assemble generator

**Files:**
- Create: `lib/generator.ts`
- Test: `lib/__tests__/generator.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { generateDaily } from '../generator';
import { isSolved } from '../graph';
import { initGame, reduce } from '../game/state';

describe('generateDaily', () => {
  it('produces a solvable graph', () => {
    const { graph, maxMoves, solution } = generateDaily('2026-04-19');
    let s = initGame(graph, maxMoves);
    s = reduce(s, { type: 'latch', nodeId: solution[0] });
    for (let i = 1; i < solution.length; i++) {
      s = reduce(s, { type: 'traverse', nodeId: solution[i] });
    }
    expect(s.phase).toBe('won');
    expect(isSolved(s.graph)).toBe(true);
  });
  it('is deterministic for the same seed', () => {
    const a = generateDaily('2026-04-19');
    const b = generateDaily('2026-04-19');
    expect(a.graph).toEqual(b.graph);
  });
  it('clamps counts to [1,9]', () => {
    const { graph } = generateDaily('stress');
    for (const n of graph.nodes) expect(n.count).toBeLessThanOrEqual(9);
    for (const e of graph.edges) expect(e.count).toBeLessThanOrEqual(9);
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

```ts
import { createRng, pickInt } from './rng';
import { placeNodes } from './generator/placement';
import { simulateWalk } from './generator/walk';
import type { Graph } from './graph';

export type GeneratedPuzzle = {
  graph: Graph;
  maxMoves: number;
  solution: string[]; // node ids in order, starting with start node
};

export function generateDaily(seed: string): GeneratedPuzzle {
  const rng = createRng(seed);
  const nodeCount = pickInt(rng, 4, 11);
  const points = placeNodes(rng, nodeCount);
  const walkLen = Math.round(nodeCount * (1.5 + rng() * 1.5));
  const walk = simulateWalk(rng, points, walkLen);

  const nodeVisits = new Array(nodeCount).fill(0);
  const edgeVisits = new Map<string, number>();
  nodeVisits[walk.start] = 1; // latch counts
  for (const s of walk.steps) {
    nodeVisits[s.to]++;
    edgeVisits.set(s.edgeKey, (edgeVisits.get(s.edgeKey) ?? 0) + 1);
  }

  const nodes = points.map((p, i) => ({
    id: `n${i}`,
    x: p.x,
    y: p.y,
    count: Math.min(Math.max(nodeVisits[i], 1), 9),
    startEligible: true,
  }));

  const edges = walk.edges.map((e, i) => ({
    id: `e${i}`,
    from: `n${e.a}`,
    to: `n${e.b}`,
    count: Math.min(Math.max(edgeVisits.get(`${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`) ?? 1, 1), 9),
    direction: 'bi' as const,
  }));

  const solution = [`n${walk.start}`, ...walk.steps.map(s => `n${s.to}`)];

  return {
    graph: { nodes, edges },
    maxMoves: walk.steps.length,
    solution,
  };
}
```

> **Note:** Because counts are clamped, the "solution" stored here may not literally zero out every counter if a node was over-visited past 9. That's OK per spec (negative counters allowed on nodes/edges; solution exists that reaches "won"). The test above uses short seeds that shouldn't hit clamp.

- [ ] **Step 4: Tests pass**

If solvability test fails due to clamping for specific seeds, tighten walk length bounds (reduce upper to 2.0 × nodeCount).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(generator): generateDaily assembles puzzle from walk"
```

---

## Phase 4: Visual System + Game Rendering

### Task 4.1: Theme tokens and globals

**Files:**
- Modify: `app/globals.css` (rename/move from scaffold if needed — or wherever scaffolding put it)
- Create: `styles/theme.css` (imported from layout)
- Modify: `app/layout.tsx` (add Orbitron font)

- [ ] **Step 1: Write theme CSS**

In `app/globals.css` (replace default content):
```css
:root {
  --bg-deep: #05070d;
  --grid: #0f1a2b;
  --dim: #6a7a8f;
  --neon-green: #39ff8e;
  --danger: #ff3b5c;
  --cyan: #39d0ff;
}

html, body {
  background: var(--bg-deep);
  color: #c9d3e3;
  margin: 0;
  font-family: var(--font-body), system-ui, sans-serif;
  overflow: hidden;
}

.font-display { font-family: var(--font-display), system-ui; letter-spacing: 0.04em; }
```

- [ ] **Step 2: Update layout.tsx**

```tsx
import { Orbitron, Inter } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata = { title: 'DodoDots' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev` → confirm dark background.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(theme): Tron palette and fonts"
```

---

### Task 4.2: Shared SVG bloom filter

**Files:**
- Create: `components/game/BloomDefs.tsx`

- [ ] **Step 1: Implement**

```tsx
export function BloomDefs() {
  return (
    <defs>
      <filter id="bloom-dim" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="bloom-bright" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/game/BloomDefs.tsx
git commit -m "feat(visual): shared SVG bloom filters"
```

---

### Task 4.3: Node component

**Files:**
- Create: `components/game/Node.tsx`
- Test: `components/game/__tests__/Node.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeView } from '../Node';

const base = { id: 'a', x: 0.5, y: 0.5, count: 2, startEligible: true };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('NodeView', () => {
  it('renders count when >= 2', () => {
    render(wrap(<NodeView node={base} state="idle" onClick={() => {}} />));
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  it('hides count when count === 1', () => {
    render(wrap(<NodeView node={{ ...base, count: 1 }} state="idle" onClick={() => {}} />));
    expect(screen.queryByText('1')).toBeNull();
  });
  it('applies done class when count <= 0', () => {
    const { container } = render(wrap(<NodeView node={{ ...base, count: 0 }} state="idle" onClick={() => {}} />));
    expect(container.querySelector('.node--done')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

```tsx
'use client';
import type { GraphNode } from '@/lib/graph';

export type NodeVisualState = 'idle' | 'startEligible' | 'current' | 'validTarget';

export function NodeView({
  node,
  state,
  onClick,
}: {
  node: GraphNode;
  state: NodeVisualState;
  onClick: (id: string) => void;
}) {
  const done = node.count <= 0;
  const cx = node.x * 100;
  const cy = node.y * 100;
  const classes = [
    'node',
    done ? 'node--done' : 'node--pending',
    state === 'startEligible' && 'node--pulse',
    state === 'current' && 'node--current',
    state === 'validTarget' && 'node--target',
  ].filter(Boolean).join(' ');

  return (
    <g className={classes} onClick={() => onClick(node.id)} style={{ cursor: 'pointer' }}>
      <circle
        cx={cx} cy={cy} r={3}
        fill={done ? 'var(--neon-green)' : 'var(--dim)'}
        filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {node.count >= 2 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          className="font-display" fontSize={2.5} fill="#05070d">
          {node.count}
        </text>
      )}
    </g>
  );
}
```

Add supporting CSS to `app/globals.css`:
```css
.node--pulse circle { animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse {
  0%,100% { transform-origin: center; transform: scale(1); }
  50% { transform: scale(1.18); }
}
.node--target circle { stroke: var(--cyan); stroke-width: 0.3; }
.node--current circle { stroke: var(--neon-green); stroke-width: 0.3; }
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(visual): NodeView component with state styling"
```

---

### Task 4.4: Edge component

**Files:**
- Create: `components/game/Edge.tsx`
- Test: `components/game/__tests__/Edge.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EdgeView } from '../Edge';
import type { GraphNode, GraphEdge } from '@/lib/graph';

const a: GraphNode = { id: 'a', x: 0.2, y: 0.5, count: 0, startEligible: true };
const b: GraphNode = { id: 'b', x: 0.8, y: 0.5, count: 0, startEligible: false };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('EdgeView', () => {
  it('renders count when >= 2', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 3, direction: 'bi' };
    render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  it('renders arrow marker when directed', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 1, direction: 'forward' };
    const { container } = render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(container.querySelector('.edge--directed')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run (fails)**

- [ ] **Step 3: Implement**

```tsx
import type { GraphEdge, GraphNode } from '@/lib/graph';

export function EdgeView({ edge, from, to }: { edge: GraphEdge; from: GraphNode; to: GraphNode }) {
  const done = edge.count <= 0;
  const x1 = from.x * 100, y1 = from.y * 100;
  const x2 = to.x * 100, y2 = to.y * 100;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const directed = edge.direction !== 'bi';
  const classes = [
    'edge',
    done ? 'edge--done' : 'edge--pending',
    directed && 'edge--directed',
  ].filter(Boolean).join(' ');
  // For backward direction, swap arrow endpoint
  const arrowX1 = edge.direction === 'backward' ? x2 : x1;
  const arrowY1 = edge.direction === 'backward' ? y2 : y1;
  const arrowX2 = edge.direction === 'backward' ? x1 : x2;
  const arrowY2 = edge.direction === 'backward' ? y1 : y2;
  return (
    <g className={classes}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={done ? 'var(--neon-green)' : 'var(--dim)'}
        strokeWidth={0.5}
        filter={done ? 'url(#bloom-bright)' : 'url(#bloom-dim)'}
      />
      {directed && (
        <polygon
          points={arrowHead(arrowX1, arrowY1, arrowX2, arrowY2)}
          fill={done ? 'var(--neon-green)' : 'var(--dim)'}
        />
      )}
      {edge.count >= 2 && (
        <text x={mx} y={my - 1.5} textAnchor="middle" className="font-display"
          fontSize={2} fill={done ? 'var(--neon-green)' : 'var(--dim)'}>
          {edge.count}
        </text>
      )}
    </g>
  );
}

function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const tipDist = len * 0.7;
  const tx = x1 + ux * tipDist, ty = y1 + uy * tipDist;
  const size = 1.5;
  const p1x = tx - ux * size - uy * size * 0.6;
  const p1y = ty - uy * size + ux * size * 0.6;
  const p2x = tx - ux * size + uy * size * 0.6;
  const p2y = ty - uy * size - ux * size * 0.6;
  return `${tx},${ty} ${p1x},${p1y} ${p2x},${p2y}`;
}
```

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(visual): EdgeView with direction arrows"
```

---

### Task 4.5: Comet path-trace animation

**Files:**
- Create: `components/game/Comet.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect, useState } from 'react';

export function Comet({
  from, to, durationMs, onDone,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  durationMs: number;
  onDone: () => void;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from.x, from.y, to.x, to.y, durationMs, onDone]);

  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  return (
    <circle cx={x * 100} cy={y * 100} r={2}
      fill="var(--neon-green)" filter="url(#bloom-bright)" />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/game/Comet.tsx
git commit -m "feat(visual): Comet path-trace animation"
```

---

### Task 4.6: GameBoard composition

**Files:**
- Create: `components/game/GameBoard.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { BloomDefs } from './BloomDefs';
import { NodeView, type NodeVisualState } from './Node';
import { EdgeView } from './Edge';
import { Comet } from './Comet';
import type { Graph } from '@/lib/graph';
import { getNode, getValidNeighbors } from '@/lib/graph';

type Anim = { from: string; to: string } | null;

export function GameBoard({
  graph, current, phase, anim, onNodeClick, onAnimDone,
}: {
  graph: Graph;
  current: string | null;
  phase: 'idle' | 'latched' | 'tracing' | 'won' | 'failed';
  anim: Anim;
  onNodeClick: (id: string) => void;
  onAnimDone: () => void;
}) {
  const validTargets = current ? new Set(getValidNeighbors(graph, current).map(n => n.nodeId)) : new Set<string>();
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <BloomDefs />
      {graph.edges.map(e => {
        const from = getNode(graph, e.from);
        const to = getNode(graph, e.to);
        return from && to ? <EdgeView key={e.id} edge={e} from={from} to={to} /> : null;
      })}
      {graph.nodes.map(n => {
        let state: NodeVisualState = 'idle';
        if (phase === 'idle' && n.startEligible && n.count > 0) state = 'startEligible';
        else if (n.id === current) state = 'current';
        else if (validTargets.has(n.id)) state = 'validTarget';
        return <NodeView key={n.id} node={n} state={state} onClick={onNodeClick} />;
      })}
      {anim && (() => {
        const f = getNode(graph, anim.from), t = getNode(graph, anim.to);
        return f && t ? <Comet from={f} to={t} durationMs={250} onDone={onAnimDone} /> : null;
      })()}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(visual): GameBoard composing nodes, edges, comet"
```

---

### Task 4.7: HUD, WinOverlay, FailOverlay

**Files:**
- Create: `components/game/HUD.tsx`
- Create: `components/game/WinOverlay.tsx`
- Create: `components/game/FailOverlay.tsx`

- [ ] **Step 1: HUD**

```tsx
export function HUD({ title, movesRemaining, maxMoves }: { title: string; movesRemaining: number; maxMoves: number }) {
  const danger = movesRemaining <= Math.max(2, maxMoves * 0.2);
  return (
    <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 24px', pointerEvents: 'none' }}>
      <div className="font-display" style={{ color: 'var(--cyan)', fontSize: 14 }}>{title}</div>
      <div className="font-display" style={{ color: danger ? 'var(--danger)' : 'var(--cyan)', fontSize: 18 }}>
        {movesRemaining} / {maxMoves}
      </div>
      <div style={{ width: 80 }} />
    </div>
  );
}
```

- [ ] **Step 2: WinOverlay**

```tsx
export function WinOverlay({ onNext, onMenu }: { onNext?: () => void; onMenu: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.7)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--neon-green)', fontSize: 48 }}>SOLVED</h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          {onNext && <button onClick={onNext} className="font-display">Next</button>}
          <button onClick={onMenu} className="font-display">Menu</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: FailOverlay**

```tsx
export function FailOverlay({ onRetry, onMenu }: { onRetry: () => void; onMenu: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,13,0.7)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="font-display" style={{ color: 'var(--danger)', fontSize: 40 }}>OUT OF MOVES</h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={onRetry} className="font-display">Retry (R)</button>
          <button onClick={onMenu} className="font-display">Menu</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Button styling**

Append to `app/globals.css`:
```css
button {
  background: transparent;
  color: var(--cyan);
  border: 1px solid var(--cyan);
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 0.05em;
}
button:hover { background: rgba(57,208,255,0.1); }
button:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): HUD, WinOverlay, FailOverlay"
```

---

## Phase 5: Game Store + Interactivity

### Task 5.1: Zustand game store

**Files:**
- Create: `stores/gameStore.ts`

- [ ] **Step 1: Implement**

```ts
'use client';
import { create } from 'zustand';
import { initGame, reduce, type GameState, type GameAction } from '@/lib/game/state';
import type { Graph } from '@/lib/graph';

type PendingAnim = { from: string; to: string; pendingAction: GameAction } | null;

type GameStore = {
  state: GameState | null;
  anim: PendingAnim;
  queued: GameAction | null; // depth-1 click buffer during animation
  load: (graph: Graph, maxMoves: number) => void;
  dispatch: (a: GameAction) => void;
  finishAnim: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  anim: null,
  queued: null,
  load: (graph, maxMoves) => set({ state: initGame(graph, maxMoves), anim: null, queued: null }),
  dispatch: (a) => {
    const s = get().state; if (!s) return;
    // If animation in progress, buffer a traverse click
    if (get().anim && a.type === 'traverse') { set({ queued: a }); return; }
    if (a.type === 'traverse' && s.current) {
      // animate
      set({ anim: { from: s.current, to: a.nodeId, pendingAction: a } });
      return;
    }
    set({ state: reduce(s, a) });
  },
  finishAnim: () => {
    const { state, anim, queued } = get(); if (!state || !anim) return;
    const next = reduce(state, anim.pendingAction);
    // validate queued against new state
    let toSet: Partial<GameStore> = { state: next, anim: null, queued: null };
    if (queued && queued.type === 'traverse' && next.current) {
      // Re-dispatch queued if still valid
      set(toSet);
      get().dispatch(queued);
      return;
    }
    set(toSet);
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(store): game store with animation queuing"
```

---

### Task 5.2: Keyboard hook

**Files:**
- Create: `lib/keyboard.ts`

- [ ] **Step 1: Implement**

```ts
'use client';
import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const fn = handlers[key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/keyboard.ts
git commit -m "feat(keyboard): useKeyboardShortcuts hook"
```

---

### Task 5.3: GameScreen container

**Files:**
- Create: `components/game/GameScreen.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { GameBoard } from './GameBoard';
import { HUD } from './HUD';
import { WinOverlay } from './WinOverlay';
import { FailOverlay } from './FailOverlay';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import type { Graph } from '@/lib/graph';

export function GameScreen({
  graph, maxMoves, title, onWin, onFail, menuHref = '/',
}: {
  graph: Graph;
  maxMoves: number;
  title: string;
  onWin?: () => void;
  onFail?: () => void;
  menuHref?: string;
}) {
  const router = useRouter();
  const { state, anim, load, dispatch, finishAnim } = useGameStore();

  useEffect(() => { load(graph, maxMoves); }, [graph, maxMoves, load]);

  useEffect(() => {
    if (!state) return;
    if (state.phase === 'won' && onWin) onWin();
    if (state.phase === 'failed' && onFail) onFail();
  }, [state?.phase]);

  useKeyboardShortcuts({
    r: () => dispatch({ type: 'reset' }),
    escape: () => router.push(menuHref),
  });

  if (!state) return null;

  const handleNode = (id: string) => {
    if (state.phase === 'idle') dispatch({ type: 'latch', nodeId: id });
    else if (state.phase === 'latched' || state.phase === 'tracing') dispatch({ type: 'traverse', nodeId: id });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <HUD title={title} movesRemaining={state.movesRemaining} maxMoves={state.maxMoves} />
      <GameBoard
        graph={state.graph}
        current={state.current}
        phase={state.phase}
        anim={anim ? { from: anim.from, to: anim.to } : null}
        onNodeClick={handleNode}
        onAnimDone={finishAnim}
      />
      {state.phase === 'won' && <WinOverlay onMenu={() => router.push(menuHref)} />}
      {state.phase === 'failed' && <FailOverlay onRetry={() => dispatch({ type: 'reset' })} onMenu={() => router.push(menuHref)} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(game): GameScreen container wiring store + keyboard"
```

---

## Phase 6: Daily Page

### Task 6.1: Daily route + completion persistence

**Files:**
- Create: `app/daily/page.tsx`
- Create: `lib/storage.ts`

- [ ] **Step 1: Write storage module**

```ts
'use client';

type StoreKeys = {
  audio: { music: number; sfx: number; musicMuted: boolean; sfxMuted: boolean };
  dailyCompletions: Record<string, { solved: boolean; movesUsed: number }>;
  tutorialProgress: { completedLevels: string[] };
  builderDrafts: Record<string, unknown>;
};

function get<K extends keyof StoreKeys>(key: K, fallback: StoreKeys[K]): StoreKeys[K] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`dododots:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function set<K extends keyof StoreKeys>(key: K, value: StoreKeys[K]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`dododots:${key}`, JSON.stringify(value));
}

export const storage = {
  getAudio: () => get('audio', { music: 0.3, sfx: 0.5, musicMuted: false, sfxMuted: false }),
  setAudio: (v: StoreKeys['audio']) => set('audio', v),
  getDailyCompletions: () => get('dailyCompletions', {}),
  markDaily: (date: string, entry: { solved: boolean; movesUsed: number }) => {
    const all = get('dailyCompletions', {});
    all[date] = entry;
    set('dailyCompletions', all);
  },
  getTutorialProgress: () => get('tutorialProgress', { completedLevels: [] }),
  markTutorialComplete: (id: string) => {
    const p = get('tutorialProgress', { completedLevels: [] });
    if (!p.completedLevels.includes(id)) p.completedLevels.push(id);
    set('tutorialProgress', p);
  },
  getDrafts: () => get('builderDrafts', {}),
  setDraft: (id: string, draft: unknown) => {
    const all = get('builderDrafts', {});
    all[id] = draft;
    set('builderDrafts', all);
  },
  deleteDraft: (id: string) => {
    const all = get('builderDrafts', {});
    delete all[id];
    set('builderDrafts', all);
  },
  // Playtest-solved flag persisted per draft id so it survives route navigation
  getPlaytestSolved: (draftId: string): boolean => {
    const raw = get<'builderDrafts'>('builderDrafts' as any, {} as any) as any;
    return !!(raw[`__playtest_solved__${draftId}`]);
  },
  markPlaytestSolved: (draftId: string) => {
    const all = get('builderDrafts', {}) as any;
    all[`__playtest_solved__${draftId}`] = true;
    set('builderDrafts', all);
  },
  clearPlaytestSolved: (draftId: string) => {
    const all = get('builderDrafts', {}) as any;
    delete all[`__playtest_solved__${draftId}`];
    set('builderDrafts', all);
  },
};
```

- [ ] **Step 2: Daily page**

```tsx
'use client';
import { useMemo, useCallback } from 'react';
import { generateDaily } from '@/lib/generator';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DailyPage() {
  const date = todayIso();
  const puzzle = useMemo(() => generateDaily(date), [date]);
  const onWin = useCallback(() => {
    storage.markDaily(date, { solved: true, movesUsed: puzzle.maxMoves });
  }, [date, puzzle.maxMoves]);
  return <GameScreen graph={puzzle.graph} maxMoves={puzzle.maxMoves} title={`DAILY ${date}`} onWin={onWin} />;
}
```

- [ ] **Step 3: Verify manually**

Run `npm run dev` → open http://localhost:3000/daily. Expected: graph renders; clicking a pulsing node latches; clicking adjacent nodes traces path; win state on solving.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(daily): playable Daily route"
```

---

**🎉 MILESTONE: At this point the core game mechanic is playable. Test it before continuing.**

---

## Phase 7: Tutorial

### Task 7.1: Tutorial content JSON

**Files:**
- Create: `content/tutorial/01-click-start.json` through `07-freeplay.json`

- [ ] **Step 1: Author 7 tutorial levels**

Each file:
```json
{
  "id": "01-click-start",
  "title": "Click to start",
  "caption": "Click the pulsing node to begin your path.",
  "maxMoves": 1,
  "graph": {
    "nodes": [
      { "id": "a", "x": 0.3, "y": 0.5, "count": 1, "startEligible": true },
      { "id": "b", "x": 0.7, "y": 0.5, "count": 1, "startEligible": false }
    ],
    "edges": [{ "id": "e1", "from": "a", "to": "b", "count": 1, "direction": "bi" }]
  }
}
```

Design subsequent levels per spec (multi-edge, directed, loops, multiple starts, free-play).

- [ ] **Step 2: Commit**

```bash
git add content/tutorial/
git commit -m "feat(tutorial): author 7 tutorial levels"
```

---

### Task 7.2: Tutorial runner page

**Files:**
- Create: `app/tutorial/page.tsx`
- Create: `lib/tutorial.ts`

- [ ] **Step 1: Load manifest**

```ts
// lib/tutorial.ts
import l1 from '@/content/tutorial/01-click-start.json';
import l2 from '@/content/tutorial/02-multi-edge.json';
import l3 from '@/content/tutorial/03-max-moves.json';
import l4 from '@/content/tutorial/04-directed.json';
import l5 from '@/content/tutorial/05-loop.json';
import l6 from '@/content/tutorial/06-multi-start.json';
import l7 from '@/content/tutorial/07-freeplay.json';
import type { Graph } from './graph';

export type TutorialLevel = { id: string; title: string; caption: string; maxMoves: number; graph: Graph };

export const TUTORIAL: TutorialLevel[] = [l1, l2, l3, l4, l5, l6, l7] as TutorialLevel[];
```

- [ ] **Step 2: Tutorial page**

```tsx
'use client';
import { useState, useCallback } from 'react';
import { TUTORIAL } from '@/lib/tutorial';
import { GameScreen } from '@/components/game/GameScreen';
import { storage } from '@/lib/storage';

export default function TutorialPage() {
  const [idx, setIdx] = useState(0);
  const level = TUTORIAL[idx];
  const onWin = useCallback(() => {
    storage.markTutorialComplete(level.id);
  }, [level.id]);
  const next = () => idx < TUTORIAL.length - 1 && setIdx(i => i + 1);

  if (!level) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <GameScreen
        key={level.id}
        graph={level.graph}
        maxMoves={level.maxMoves}
        title={`TUTORIAL ${idx + 1}/${TUTORIAL.length} — ${level.title}`}
        onWin={onWin}
      />
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-block', background: 'rgba(5,7,13,0.85)', padding: '12px 20px', border: '1px solid var(--cyan)', pointerEvents: 'auto' }}>
          <p style={{ margin: 0, color: '#c9d3e3' }}>{level.caption}</p>
          {idx < TUTORIAL.length - 1 && (
            <button onClick={next} style={{ marginTop: 8 }}>Next lesson →</button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Navigate to `/tutorial`. Walk through all 7 levels.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(tutorial): sequential tutorial runner with captions"
```

---

## Phase 8: Main Menu + Settings

### Task 8.1: MenuLayout

**Files:**
- Create: `components/ui/MenuLayout.tsx`

- [ ] **Step 1: Implement**

```tsx
export function MenuLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <h1 className="font-display" style={{ fontSize: 64, color: 'var(--cyan)', letterSpacing: '0.2em', margin: 0 }}>
        {title}
      </h1>
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch', minWidth: 300 }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/MenuLayout.tsx
git commit -m "feat(ui): MenuLayout"
```

---

### Task 8.2: Main menu page

**Files:**
- Modify: `app/page.tsx` (replace default scaffold)

- [ ] **Step 1: Implement**

```tsx
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { SettingsPanel } from '@/components/ui/SettingsPanel';

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <MenuLayout title="DODODOTS">
      <Link href="/daily"><button style={{ width: '100%' }}>Daily</button></Link>
      <Link href="/campaign"><button style={{ width: '100%' }} disabled>Campaign (soon)</button></Link>
      <Link href="/tutorial"><button style={{ width: '100%' }}>Tutorial</button></Link>
      <Link href="/builder"><button style={{ width: '100%' }}>Level Builder</button></Link>
      <Link href="/auth"><button style={{ width: '100%' }}>Sign In</button></Link>
      <button style={{ width: '100%' }} onClick={() => setSettingsOpen(true)}>Settings</button>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </MenuLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(menu): main menu page"
```

---

### Task 8.3: Settings panel (volume sliders; AudioManager wiring comes next phase)

**Files:**
- Create: `components/ui/SettingsPanel.tsx`
- Create: `stores/audioStore.ts`

- [ ] **Step 1: Audio store (persisted; no actual audio yet)**

```ts
'use client';
import { create } from 'zustand';
import { storage } from '@/lib/storage';

type AudioState = {
  music: number; sfx: number; musicMuted: boolean; sfxMuted: boolean;
  setMusic: (v: number) => void;
  setSfx: (v: number) => void;
  toggleMusicMute: () => void;
  toggleSfxMute: () => void;
};

export const useAudioStore = create<AudioState>((set) => {
  const init = storage.getAudio();
  return {
    ...init,
    setMusic: (v) => { set({ music: v }); storage.setAudio({ ...storage.getAudio(), music: v }); },
    setSfx: (v) => { set({ sfx: v }); storage.setAudio({ ...storage.getAudio(), sfx: v }); },
    toggleMusicMute: () => set((s) => { const next = !s.musicMuted; storage.setAudio({ ...storage.getAudio(), musicMuted: next }); return { musicMuted: next }; }),
    toggleSfxMute: () => set((s) => { const next = !s.sfxMuted; storage.setAudio({ ...storage.getAudio(), sfxMuted: next }); return { sfxMuted: next }; }),
  };
});
```

- [ ] **Step 2: Settings panel UI**

```tsx
'use client';
import { useAudioStore } from '@/stores/audioStore';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { music, sfx, musicMuted, sfxMuted, setMusic, setSfx, toggleMusicMute, toggleSfxMute } = useAudioStore();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,7,13,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ border: '1px solid var(--cyan)', padding: 32, minWidth: 360 }}>
        <h2 className="font-display" style={{ color: 'var(--cyan)' }}>SETTINGS</h2>
        <div style={{ marginTop: 16 }}>
          <label>Music {Math.round(music * 100)}% {musicMuted ? '(muted)' : ''}</label>
          <input type="range" min={0} max={1} step={0.01} value={music} onChange={e => setMusic(parseFloat(e.target.value))} style={{ width: '100%' }} />
          <button onClick={toggleMusicMute}>{musicMuted ? 'Unmute' : 'Mute'} Music</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <label>SFX {Math.round(sfx * 100)}% {sfxMuted ? '(muted)' : ''}</label>
          <input type="range" min={0} max={1} step={0.01} value={sfx} onChange={e => setSfx(parseFloat(e.target.value))} style={{ width: '100%' }} />
          <button onClick={toggleSfxMute}>{sfxMuted ? 'Unmute' : 'Mute'} SFX</button>
        </div>
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Campaign placeholder**

Create `app/campaign/page.tsx`:
```tsx
import Link from 'next/link';
import { MenuLayout } from '@/components/ui/MenuLayout';
export default function Campaign() {
  return (
    <MenuLayout title="CAMPAIGN">
      <p style={{ color: '#c9d3e3', textAlign: 'center' }}>Coming soon.</p>
      <Link href="/"><button style={{ width: '100%' }}>Back</button></Link>
    </MenuLayout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(settings): audio store and settings panel; campaign placeholder"
```

---

## Phase 9: Audio System

### Task 9.1: Music manifest build script

**Files:**
- Create: `scripts/build-music-manifest.mjs`
- Modify: `package.json` (prebuild hook)
- Create: `public/music/.gitkeep`
- Create: `public/sfx/.gitkeep`

- [ ] **Step 1: Script**

```js
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const musicDir = join(process.cwd(), 'public', 'music');
if (!existsSync(musicDir)) mkdirSync(musicDir, { recursive: true });

const files = readdirSync(musicDir)
  .filter(f => /\.(mp3|ogg|wav|m4a)$/i.test(f))
  .sort();

const manifest = { tracks: files.map(f => `/music/${f}`) };
writeFileSync(join(process.cwd(), 'public', 'music-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`music-manifest.json: ${files.length} tracks`);
```

- [ ] **Step 2: Wire into package.json**

Add scripts:
```json
"prebuild": "node scripts/build-music-manifest.mjs",
"predev": "node scripts/build-music-manifest.mjs"
```

- [ ] **Step 3: Run**

Run: `npm run predev`
Expected: `public/music-manifest.json` created with `{"tracks":[]}`.

- [ ] **Step 4: Commit**

```bash
touch public/music/.gitkeep public/sfx/.gitkeep
git add -A
git commit -m "feat(audio): music manifest build script"
```

---

### Task 9.2: AudioManager

**Files:**
- Create: `lib/audio.ts`

- [ ] **Step 1: Implement**

```ts
'use client';

type Manifest = { tracks: string[] };

const SFX_NAMES = ['click', 'latch', 'traverse', 'invalid', 'decrement-zero', 'win', 'fail'] as const;
type SfxName = typeof SFX_NAMES[number];

class AudioManager {
  private ctx: AudioContext | null = null;
  private musicEl: HTMLAudioElement | null = null;
  private nextEl: HTMLAudioElement | null = null;
  private tracks: string[] = [];
  private currentIdx = 0;
  private musicVolume = 0.3;
  private sfxVolume = 0.5;
  private musicMuted = false;
  private sfxMuted = false;
  private sfxBuffers = new Map<SfxName, AudioBuffer>();
  private started = false;
  private pausedByVisibility = false;

  async init() {
    if (this.started) return;
    this.started = true;
    try {
      const res = await fetch('/music-manifest.json');
      const m: Manifest = await res.json();
      this.tracks = m.tracks;
    } catch { this.tracks = []; }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.handleVisibility());
    }
    if (this.tracks.length > 0) this.playTrack(0);
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.loadAllSfx();
  }

  private async loadAllSfx() {
    if (!this.ctx) return;
    await Promise.all(SFX_NAMES.map(async (name) => {
      try {
        const res = await fetch(`/sfx/${name}.mp3`);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const decoded = await this.ctx!.decodeAudioData(buf);
        this.sfxBuffers.set(name, decoded);
      } catch {}
    }));
  }

  private playTrack(idx: number) {
    this.currentIdx = idx;
    const src = this.tracks[idx];
    if (!src) return;
    const el = new Audio(src);
    el.volume = this.musicMuted ? 0 : this.musicVolume;
    el.addEventListener('ended', () => this.playTrack((idx + 1) % this.tracks.length));
    el.play().catch(() => { /* autoplay blocked; requires user gesture */ });
    if (this.musicEl) this.musicEl.pause();
    this.musicEl = el;
  }

  private handleVisibility() {
    if (document.hidden) {
      if (this.musicEl && !this.musicEl.paused) { this.musicEl.pause(); this.pausedByVisibility = true; }
    } else if (this.pausedByVisibility && this.musicEl) {
      this.musicEl.play().catch(() => {});
      this.pausedByVisibility = false;
    }
  }

  setMusicVolume(v: number) { this.musicVolume = v; if (this.musicEl && !this.musicMuted) this.musicEl.volume = v; }
  setSfxVolume(v: number) { this.sfxVolume = v; }
  setMusicMuted(m: boolean) { this.musicMuted = m; if (this.musicEl) this.musicEl.volume = m ? 0 : this.musicVolume; }
  setSfxMuted(m: boolean) { this.sfxMuted = m; }

  playSfx(name: SfxName) {
    if (this.sfxMuted || !this.ctx) return;
    const buf = this.sfxBuffers.get(name);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = this.sfxVolume;
    src.buffer = buf;
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  }
}

let _instance: AudioManager | null = null;
export function audio(): AudioManager {
  if (!_instance) _instance = new AudioManager();
  return _instance;
}
export type { SfxName };
```

- [ ] **Step 2: Initialize on first user gesture**

Create `components/ui/AudioBootstrap.tsx`:
```tsx
'use client';
import { useEffect } from 'react';
import { audio } from '@/lib/audio';
import { useAudioStore } from '@/stores/audioStore';

export function AudioBootstrap() {
  const { music, sfx, musicMuted, sfxMuted } = useAudioStore();

  useEffect(() => {
    const init = () => { audio().init(); };
    window.addEventListener('pointerdown', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  useEffect(() => { audio().setMusicVolume(music); }, [music]);
  useEffect(() => { audio().setSfxVolume(sfx); }, [sfx]);
  useEffect(() => { audio().setMusicMuted(musicMuted); }, [musicMuted]);
  useEffect(() => { audio().setSfxMuted(sfxMuted); }, [sfxMuted]);

  return null;
}
```

- [ ] **Step 3: Mount in root layout**

Modify `app/layout.tsx`:
```tsx
// ...existing imports
import { AudioBootstrap } from '@/components/ui/AudioBootstrap';

// inside RootLayout body:
<body>
  <AudioBootstrap />
  {children}
</body>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(audio): AudioManager singleton with visibility pause/resume"
```

---

### Task 9.3: SFX hooks in gameplay

**Files:**
- Modify: `stores/gameStore.ts` (emit SFX events)

- [ ] **Step 1: Wire SFX to actions**

Modify `stores/gameStore.ts`:
- In `dispatch` for `latch`: `audio().playSfx('latch');`
- In `dispatch` for `traverse` when starting animation: `audio().playSfx('traverse');`
- On invalid click (no state change): `audio().playSfx('invalid');`
- In `finishAnim` after reduce: if new counter === 0, `audio().playSfx('decrement-zero');`
- On phase transition to `won`: `audio().playSfx('win');`
- On phase transition to `failed`: `audio().playSfx('fail');`

Add imports: `import { audio } from '@/lib/audio';`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(audio): wire SFX into game actions"
```

---

## Phase 10: Supabase Setup

### Task 10.1: Env + client

**Files:**
- Create: `.env.local` (NOT committed)
- Create: `.env.example`
- Create: `lib/supabase.ts`
- Create: `lib/supabase-server.ts`

- [ ] **Step 1: Create Supabase project**

Manual: go to supabase.com, create project, copy URL and anon key into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Commit `.env.example` with placeholder values.

- [ ] **Step 2: Client module**

```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';

export function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .env.example lib/supabase.ts
git commit -m "feat(supabase): client factory and env example"
```

---

### Task 10.2: Schema migrations

**Files:**
- Create: `supabase/migrations/20260419_000_init.sql`

- [ ] **Step 1: Write migration**

```sql
-- Levels
create table public.levels (
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

create index on public.levels (published_at) where published_at is not null;

-- Daily
create table public.daily_levels (
  date date primary key,
  level_id uuid references public.levels(id),
  created_at timestamptz default now()
);

-- Playtest solves
create table public.playtest_solves (
  level_id uuid references public.levels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  solved_at timestamptz default now(),
  primary key (level_id, user_id)
);

-- RLS
alter table public.levels enable row level security;
alter table public.playtest_solves enable row level security;
alter table public.daily_levels enable row level security;

create policy "Anyone can read published levels"
  on public.levels for select
  using (published_at is not null);

create policy "Authors see their own drafts"
  on public.levels for select
  using (author_id = auth.uid());

create policy "Authenticated users can insert"
  on public.levels for insert
  with check (author_id = auth.uid());

create policy "Authors edit unpublished drafts"
  on public.levels for update
  using (author_id = auth.uid() and published_at is null);

create policy "Authors delete unpublished drafts"
  on public.levels for delete
  using (author_id = auth.uid() and published_at is null);

create policy "Users manage own playtest solves"
  on public.playtest_solves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Anyone reads daily levels"
  on public.daily_levels for select using (true);

-- Publish RPC: only allowed if caller has a playtest_solve
create or replace function public.publish_level(lvl_id uuid) returns void
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from public.playtest_solves
    where level_id = lvl_id and user_id = auth.uid()
  ) then
    raise exception 'Must playtest-solve before publishing';
  end if;
  update public.levels
    set published_at = now()
    where id = lvl_id and author_id = auth.uid() and published_at is null;
end;
$$;

revoke all on function public.publish_level(uuid) from public;
grant execute on function public.publish_level(uuid) to authenticated;

-- Counter RPCs
create or replace function public.increment_play_count(lvl_id uuid) returns void
language sql security definer as $$
  update public.levels set play_count = play_count + 1 where id = lvl_id and published_at is not null;
$$;

create or replace function public.increment_solve_count(lvl_id uuid) returns void
language sql security definer as $$
  update public.levels set solve_count = solve_count + 1 where id = lvl_id and published_at is not null;
$$;

grant execute on function public.increment_play_count(uuid) to anon, authenticated;
grant execute on function public.increment_solve_count(uuid) to anon, authenticated;
```

- [ ] **Step 2: Apply via Supabase dashboard SQL editor or CLI**

Run locally if supabase CLI is set up, or paste into dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): initial schema, RLS, publish/counter RPCs"
```

---

### Task 10.3: Auth (magic link)

**Files:**
- Create: `app/auth/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `lib/auth.ts`

- [ ] **Step 1: Auth helper**

```ts
'use client';
import { getSupabase } from './supabase';

export async function signInWithEmail(email: string) {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOut() { await getSupabase().auth.signOut(); }

export async function getSession() { return getSupabase().auth.getSession(); }
```

- [ ] **Step 2: Auth page**

```tsx
'use client';
import { useState } from 'react';
import { signInWithEmail } from '@/lib/auth';
import { MenuLayout } from '@/components/ui/MenuLayout';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email);
    setSent(true);
  };
  return (
    <MenuLayout title="SIGN IN">
      {sent ? <p>Check your email.</p> : (
        <form onSubmit={submit}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email"
            style={{ width: '100%', padding: 8, background: 'transparent', color: '#c9d3e3', border: '1px solid var(--cyan)' }} />
          <button type="submit" style={{ width: '100%', marginTop: 12 }}>Send magic link</button>
        </form>
      )}
    </MenuLayout>
  );
}
```

- [ ] **Step 3: Callback route**

```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (all) => all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    );
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL('/', req.url));
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): magic link sign-in"
```

---

## Phase 11: Level Builder

### Task 11.1: Builder state store

**Files:**
- Create: `stores/builderStore.ts`

- [ ] **Step 1: Implement**

```ts
'use client';
import { create } from 'zustand';
import type { Graph, GraphNode, GraphEdge, Direction } from '@/lib/graph';

export type Tool = 'select' | 'node' | 'edge';

type BuilderState = {
  id: string;
  title: string;
  maxMoves: number;
  graph: Graph;
  tool: Tool;
  selection: { type: 'node' | 'edge'; id: string } | null;
  setTool: (t: Tool) => void;
  setTitle: (s: string) => void;
  setMaxMoves: (n: number) => void;
  addNode: (x: number, y: number) => string;
  addEdge: (fromId: string, toId: string) => string | null;
  select: (sel: BuilderState['selection']) => void;
  updateSelectedNode: (patch: Partial<GraphNode>) => void;
  updateSelectedEdge: (patch: Partial<GraphEdge>) => void;
  deleteSelected: () => void;
  cycleEdgeDirection: () => void;
  setCount: (n: number) => void;
  toggleStart: () => void;
  load: (id: string, draft: { title: string; maxMoves: number; graph: Graph }) => void;
  toGraph: () => Graph;
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  id: '',
  title: 'Untitled',
  maxMoves: 10,
  graph: { nodes: [], edges: [] },
  tool: 'select',
  selection: null,
  setTool: (t) => set({ tool: t }),
  setTitle: (s) => set({ title: s }),
  setMaxMoves: (n) => set({ maxMoves: Math.max(1, n | 0) }),
  addNode: (x, y) => {
    const id = `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const node: GraphNode = { id, x, y, count: 1, startEligible: true };
    set(s => ({ graph: { ...s.graph, nodes: [...s.graph.nodes, node] }, selection: { type: 'node', id } }));
    return id;
  },
  addEdge: (fromId, toId) => {
    if (fromId === toId) return null;
    const id = `e${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const edge: GraphEdge = { id, from: fromId, to: toId, count: 1, direction: 'bi' };
    set(s => ({ graph: { ...s.graph, edges: [...s.graph.edges, edge] }, selection: { type: 'edge', id } }));
    return id;
  },
  select: (sel) => set({ selection: sel }),
  updateSelectedNode: (patch) => set(s => s.selection?.type === 'node' ? {
    graph: { ...s.graph, nodes: s.graph.nodes.map(n => n.id === s.selection!.id ? { ...n, ...patch } : n) },
    playtestSolved: false,
  } : s),
  updateSelectedEdge: (patch) => set(s => s.selection?.type === 'edge' ? {
    graph: { ...s.graph, edges: s.graph.edges.map(e => e.id === s.selection!.id ? { ...e, ...patch } : e) },
    playtestSolved: false,
  } : s),
  deleteSelected: () => set(s => {
    if (!s.selection) return s;
    if (s.selection.type === 'node') {
      const nid = s.selection.id;
      return { graph: { nodes: s.graph.nodes.filter(n => n.id !== nid), edges: s.graph.edges.filter(e => e.from !== nid && e.to !== nid) }, selection: null };
    }
    return { graph: { ...s.graph, edges: s.graph.edges.filter(e => e.id !== s.selection!.id) }, selection: null };
  }),
  cycleEdgeDirection: () => {
    const s = get(); if (s.selection?.type !== 'edge') return;
    const cur = s.graph.edges.find(e => e.id === s.selection!.id);
    if (!cur) return;
    const order: Direction[] = ['bi', 'forward', 'backward'];
    const next = order[(order.indexOf(cur.direction) + 1) % 3];
    s.updateSelectedEdge({ direction: next });
  },
  setCount: (n) => {
    const s = get();
    if (s.selection?.type === 'node') s.updateSelectedNode({ count: n });
    else if (s.selection?.type === 'edge') s.updateSelectedEdge({ count: n });
  },
  toggleStart: () => {
    const s = get();
    if (s.selection?.type !== 'node') return;
    const n = s.graph.nodes.find(x => x.id === s.selection!.id);
    if (n) s.updateSelectedNode({ startEligible: !n.startEligible });
  },
  load: (id, draft) => set({ id, title: draft.title, maxMoves: draft.maxMoves, graph: draft.graph, selection: null, tool: 'select' }),
  toGraph: () => get().graph,
}));
```

- [ ] **Step 2: Commit**

```bash
git add stores/builderStore.ts
git commit -m "feat(builder): builder state store"
```

---

### Task 11.2: Builder draft list page

**Files:**
- Create: `app/builder/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { MenuLayout } from '@/components/ui/MenuLayout';

export default function BuilderPage() {
  const [drafts, setDrafts] = useState<Record<string, { title: string }>>({});
  useEffect(() => { setDrafts(storage.getDrafts() as any); }, []);
  const newId = () => `d_${Date.now()}`;
  return (
    <MenuLayout title="BUILDER">
      <Link href={`/builder/${newId()}`}><button style={{ width: '100%' }}>+ New Level</button></Link>
      {Object.entries(drafts).map(([id, d]: [string, any]) => (
        <Link key={id} href={`/builder/${id}`}><button style={{ width: '100%' }}>{d.title || id}</button></Link>
      ))}
      <Link href="/"><button style={{ width: '100%' }}>Back</button></Link>
    </MenuLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/builder/page.tsx
git commit -m "feat(builder): draft list page"
```

---

### Task 11.3: Toolbar + editor shell

**Files:**
- Create: `components/builder/Toolbar.tsx`
- Create: `components/builder/LevelSettings.tsx`
- Create: `app/builder/[id]/page.tsx`

- [ ] **Step 1: Toolbar**

```tsx
'use client';
import { useBuilderStore, type Tool } from '@/stores/builderStore';

const TOOLS: Array<{ key: Tool; label: string; hotkey: string }> = [
  { key: 'select', label: 'Select', hotkey: 'V' },
  { key: 'node', label: 'Node', hotkey: 'N' },
  { key: 'edge', label: 'Edge', hotkey: 'E' },
];

export function Toolbar() {
  const { tool, setTool } = useBuilderStore();
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {TOOLS.map(t => (
        <button key={t.key} onClick={() => setTool(t.key)}
          style={{ borderColor: tool === t.key ? 'var(--neon-green)' : 'var(--cyan)', color: tool === t.key ? 'var(--neon-green)' : 'var(--cyan)' }}>
          {t.label} <span style={{ opacity: 0.5, marginLeft: 6 }}>{t.hotkey}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: LevelSettings**

```tsx
'use client';
import { useBuilderStore } from '@/stores/builderStore';
export function LevelSettings() {
  const { title, maxMoves, setTitle, setMaxMoves } = useBuilderStore();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Level name"
        style={{ background: 'transparent', color: '#c9d3e3', border: '1px solid var(--cyan)', padding: 6 }} />
      <label>Max moves:</label>
      <input type="number" min={1} max={999} value={maxMoves} onChange={e => setMaxMoves(parseInt(e.target.value) || 1)}
        style={{ width: 70, background: 'transparent', color: '#c9d3e3', border: '1px solid var(--cyan)', padding: 6 }} />
    </div>
  );
}
```

- [ ] **Step 3: Editor page**

```tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { storage } from '@/lib/storage';
import { Toolbar } from '@/components/builder/Toolbar';
import { LevelSettings } from '@/components/builder/LevelSettings';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { Inspector } from '@/components/builder/Inspector';
import { useKeyboardShortcuts } from '@/lib/keyboard';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useBuilderStore();

  useEffect(() => {
    const drafts = storage.getDrafts() as any;
    const existing = drafts[id];
    if (existing) store.load(id, existing);
    else store.load(id, { title: 'Untitled', maxMoves: 10, graph: { nodes: [], edges: [] } });
  }, [id]);

  useEffect(() => {
    if (!store.id) return;
    storage.setDraft(store.id, { title: store.title, maxMoves: store.maxMoves, graph: store.graph });
  }, [store.id, store.title, store.maxMoves, store.graph]);

  useKeyboardShortcuts({
    v: () => store.setTool('select'),
    n: () => store.setTool('node'),
    e: () => store.setTool('edge'),
    d: () => store.cycleEdgeDirection(),
    s: () => store.toggleStart(),
    delete: () => store.deleteSelected(),
    backspace: () => store.deleteSelected(),
    '1': () => store.setCount(1), '2': () => store.setCount(2), '3': () => store.setCount(3),
    '4': () => store.setCount(4), '5': () => store.setCount(5), '6': () => store.setCount(6),
    '7': () => store.setCount(7), '8': () => store.setCount(8), '9': () => store.setCount(9),
    escape: () => router.push('/builder'),
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #0f1a2b' }}>
        <Toolbar />
        <LevelSettings />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push(`/builder/${id}/playtest`)}>Playtest</button>
          <button disabled={!store.playtestSolved} title={store.playtestSolved ? '' : 'Playtest first'}>
            Publish
          </button>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <BuilderCanvas />
        </div>
        <div style={{ width: 280, borderLeft: '1px solid #0f1a2b', padding: 12 }}>
          <Inspector />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(builder): editor shell with toolbar, settings, shortcuts"
```

---

### Task 11.4: BuilderCanvas

**Files:**
- Create: `components/builder/BuilderCanvas.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useRef, useState } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { BloomDefs } from '@/components/game/BloomDefs';
import { EdgeView } from '@/components/game/Edge';
import { NodeView } from '@/components/game/Node';
import { getNode } from '@/lib/graph';

export function BuilderCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { graph, tool, addNode, addEdge, select, selection } = useBuilderStore();
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragPt, setDragPt] = useState<{ x: number; y: number } | null>(null);

  const screenToLocal = (e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM()!.inverse();
    const p = pt.matrixTransform(ctm);
    return { x: p.x / 100, y: p.y / 100 };
  };

  const onCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-node],[data-edge]')) return;
    if (tool === 'node') {
      const { x, y } = screenToLocal(e);
      addNode(x, y);
    } else if (tool === 'select') {
      select(null);
    }
  };

  const onNodeDown = (id: string, e: React.MouseEvent) => {
    if (tool === 'edge') {
      e.stopPropagation();
      setDragFrom(id);
    } else if (tool === 'select') {
      select({ type: 'node', id });
    }
  };
  const onNodeUp = (id: string) => {
    if (tool === 'edge' && dragFrom && dragFrom !== id) {
      addEdge(dragFrom, id);
    }
    setDragFrom(null); setDragPt(null);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragFrom) setDragPt(screenToLocal(e));
  };

  return (
    <svg ref={svgRef} viewBox="0 0 100 100" width="100%" height="100%" onClick={onCanvasClick} onMouseMove={onMouseMove}
      style={{ cursor: tool === 'node' ? 'crosshair' : 'default' }}>
      <BloomDefs />
      {graph.edges.map(e => {
        const from = getNode(graph, e.from), to = getNode(graph, e.to);
        if (!from || !to) return null;
        const selected = selection?.type === 'edge' && selection.id === e.id;
        return (
          <g key={e.id} data-edge onClick={ev => { ev.stopPropagation(); if (tool === 'select') select({ type: 'edge', id: e.id }); }}
            style={{ outline: selected ? '1px solid var(--cyan)' : 'none' }}>
            <EdgeView edge={e} from={from} to={to} />
          </g>
        );
      })}
      {graph.nodes.map(n => (
        <g key={n.id} data-node
          onMouseDown={e => onNodeDown(n.id, e)}
          onMouseUp={() => onNodeUp(n.id)}>
          <NodeView node={n} state={selection?.type === 'node' && selection.id === n.id ? 'current' : 'idle'} onClick={() => {}} />
          {n.startEligible && <circle cx={n.x * 100} cy={n.y * 100} r={4.5} fill="none" stroke="var(--cyan)" strokeWidth={0.15} strokeDasharray="1,1" />}
        </g>
      ))}
      {dragFrom && dragPt && (() => {
        const from = getNode(graph, dragFrom);
        return from ? <line x1={from.x * 100} y1={from.y * 100} x2={dragPt.x * 100} y2={dragPt.y * 100} stroke="var(--cyan)" strokeDasharray="1,1" strokeWidth={0.3} /> : null;
      })()}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/builder/BuilderCanvas.tsx
git commit -m "feat(builder): canvas with node/edge tools and selection"
```

---

### Task 11.5: Inspector

**Files:**
- Create: `components/builder/Inspector.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useBuilderStore } from '@/stores/builderStore';

export function Inspector() {
  const { graph, selection, setCount, cycleEdgeDirection, toggleStart, deleteSelected } = useBuilderStore();
  if (!selection) return <p style={{ color: 'var(--dim)' }}>Nothing selected. Press V / N / E to switch tools.</p>;
  if (selection.type === 'node') {
    const n = graph.nodes.find(x => x.id === selection.id);
    if (!n) return null;
    return (
      <div>
        <h3 className="font-display" style={{ color: 'var(--cyan)' }}>NODE</h3>
        <label>Count: {n.count}</label>
        <input type="range" min={1} max={9} value={n.count} onChange={e => setCount(parseInt(e.target.value))} style={{ width: '100%' }} />
        <button onClick={toggleStart} style={{ width: '100%', marginTop: 8 }}>
          {n.startEligible ? 'Start-eligible ✓' : 'Not a start'}
        </button>
        <button onClick={deleteSelected} style={{ width: '100%', marginTop: 8, borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
      </div>
    );
  }
  const e = graph.edges.find(x => x.id === selection.id);
  if (!e) return null;
  return (
    <div>
      <h3 className="font-display" style={{ color: 'var(--cyan)' }}>EDGE</h3>
      <label>Count: {e.count}</label>
      <input type="range" min={1} max={9} value={e.count} onChange={ev => setCount(parseInt(ev.target.value))} style={{ width: '100%' }} />
      <button onClick={cycleEdgeDirection} style={{ width: '100%', marginTop: 8 }}>
        Direction: {e.direction}
      </button>
      <button onClick={deleteSelected} style={{ width: '100%', marginTop: 8, borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete</button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/builder/Inspector.tsx
git commit -m "feat(builder): inspector panel"
```

---

### Task 11.6: Playtest route — with server-side solve recording

**Design note:** Playtest-before-publish must be enforced server-side. The flow:
1. User clicks "Playtest" in editor. If signed in and no cloud draft exists yet, we insert an unpublished `levels` row (RLS allows authors to insert their own drafts). Store the returned UUID on the local draft as `supabaseId`.
2. Navigate to `/builder/[supabaseId]/playtest` using the **real Supabase level id**.
3. Playtest page loads the level from Supabase (author can select own drafts via RLS) and runs the game. On genuine win, it inserts a `playtest_solves` row for this `(level_id, user_id)` — this is the only place that insert happens.
4. Back in editor, "Publish" calls `publish_level` RPC. RPC fails unless the `playtest_solves` row exists.

Not signed in → Playtest button redirects to `/auth`.

**Files:**
- Modify: `app/builder/[id]/page.tsx` (Playtest button: sign-in required; push draft to cloud first)
- Create: `app/builder/[id]/playtest/page.tsx`
- Modify: `stores/builderStore.ts` (add `supabaseId` to state and persist with draft)

- [ ] **Step 1: Extend builder store**

Add to state:
```ts
supabaseId: string | null;
setSupabaseId: (uuid: string) => void;
```

And set it in `load` from the draft: `supabaseId: draft.supabaseId ?? null`. Include `supabaseId` in the `storage.setDraft` payload in the editor page.

- [ ] **Step 2: Playtest button handler (editor page)**

Replace the simple `<button onClick={() => router.push(...)}>Playtest</button>` with:

```tsx
<button onClick={async () => {
  if (store.graph.nodes.length === 0) { alert('Add at least one node first.'); return; }
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { router.push('/auth'); return; }

  let levelId = store.supabaseId;
  if (!levelId) {
    const { data: row, error } = await sb.from('levels').insert({
      author_id: user.id,
      author_name: user.email,
      title: store.title,
      graph: store.graph,
      max_moves: store.maxMoves,
    }).select('id').single();
    if (error || !row) { alert(error?.message ?? 'insert failed'); return; }
    levelId = row.id;
    store.setSupabaseId(levelId);
  } else {
    // Update existing cloud draft with latest local changes
    const { error } = await sb.from('levels').update({
      title: store.title, graph: store.graph, max_moves: store.maxMoves,
    }).eq('id', levelId);
    if (error) { alert(error.message); return; }
  }
  router.push(`/builder/${levelId}/playtest`);
}}>
  Playtest
</button>
```

- [ ] **Step 3: Playtest page (reads from Supabase, records solve on win)**

```tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { GameScreen } from '@/components/game/GameScreen';
import type { Graph } from '@/lib/graph';

export default function PlaytestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [level, setLevel] = useState<{ title: string; graph: Graph; max_moves: number } | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const { data, error } = await sb.from('levels').select('title, graph, max_moves').eq('id', id).single();
      if (error || !data) { alert('Level not found or not yours.'); router.push('/builder'); return; }
      setLevel(data as any);
    })();
  }, [id, router]);

  const onWin = useCallback(async () => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from('playtest_solves').upsert({ level_id: id, user_id: user.id });
  }, [id]);

  if (!level) return null;
  return (
    <GameScreen
      graph={level.graph}
      maxMoves={level.max_moves}
      title={`PLAYTEST — ${level.title}`}
      menuHref={`/builder/${id}`}
      onWin={onWin}
    />
  );
}
```

> **RLS check:** `playtest_solves` "manage own rows" policy allows this insert for the authenticated user. `publish_level` RPC later verifies a row exists.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(builder): playtest inserts solve server-side"
```

---

### Task 11.7: Publish button

**Files:**
- Modify: `app/builder/[id]/page.tsx` (Publish button)

Two things change vs. the original sketch:
1. No client-side insert of `playtest_solves` — that is owned by the playtest page (Task 11.6 Step 3).
2. Publish just calls the RPC using `store.supabaseId` (already set by the Playtest step).

The "enabled" state for Publish can't rely on a local `playtestSolved` flag. Instead, check server-side on demand:
- On editor mount, if `store.supabaseId` is set, query `playtest_solves` for `(supabaseId, current user)` and store the result in local component state `hasSolve`. Re-query when the user returns from the playtest route.

- [ ] **Step 1: Hook up `hasSolve` state**

In the editor page, add:
```tsx
const [hasSolve, setHasSolve] = useState(false);

useEffect(() => {
  if (!store.supabaseId) { setHasSolve(false); return; }
  (async () => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('playtest_solves')
      .select('level_id').eq('level_id', store.supabaseId).eq('user_id', user.id).maybeSingle();
    setHasSolve(!!data);
  })();
}, [store.supabaseId]);

// Also re-check on window focus (user may return from playtest tab)
useEffect(() => {
  const onFocus = () => { /* same logic as above */ };
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, [store.supabaseId]);
```

Refactor the check into a local `checkSolve` helper to avoid duplication.

- [ ] **Step 2: Publish button**

```tsx
<button disabled={!hasSolve} title={hasSolve ? '' : 'Playtest first'}
  onClick={async () => {
    const sb = getSupabase();
    const { error } = await sb.rpc('publish_level', { lvl_id: store.supabaseId });
    if (error) { alert(error.message); return; }
    storage.deleteDraft(id as string);
    router.push(`/play/${store.supabaseId}`);
  }}>
  Publish
</button>
```

Add imports: `import { getSupabase } from '@/lib/supabase';`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(builder): publish via RPC; Publish gated by server-side solve check"
```

---

## Phase 12: Play a Published Level

### Task 12.1: /play/[id] route

**Files:**
- Create: `app/play/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { GameScreen } from '@/components/game/GameScreen';
import type { Graph } from '@/lib/graph';

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const [level, setLevel] = useState<{ title: string; graph: Graph; max_moves: number } | null>(null);
  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data } = await sb.from('levels').select('title, graph, max_moves').eq('id', id).single();
      if (data) {
        setLevel(data as any);
        sb.rpc('increment_play_count', { lvl_id: id }).then(() => {});
      }
    })();
  }, [id]);
  if (!level) return null;
  return (
    <GameScreen
      graph={level.graph}
      maxMoves={level.max_moves}
      title={level.title}
      onWin={() => { getSupabase().rpc('increment_solve_count', { lvl_id: id }).then(() => {}); }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/play/[id]/page.tsx
git commit -m "feat(play): play published levels; increment counters"
```

---

## Phase 13: Deploy

### Task 13.1: Vercel project

- [ ] **Step 1: Connect repo to Vercel**

Via Vercel dashboard: import the DodoDots GitHub repo.

- [ ] **Step 2: Set env vars**

In Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 3: Deploy**

Trigger initial deploy. Verify:
- `/` loads with main menu
- `/daily` plays
- `/tutorial` plays
- `/builder` creates/edits drafts
- Publishing works after sign-in

- [ ] **Step 4: Update README**

Create `README.md` documenting:
- Local dev: `npm run dev`
- Tests: `npm run test:run`
- Env vars
- Music/SFX file drop locations: `public/music/`, `public/sfx/`

- [ ] **Step 5: Commit + push**

```bash
git add README.md
git commit -m "docs: README with dev instructions"
git push
```

---

## Testing Strategy

- **Unit (Vitest):** Graph helpers, reducer, generator, PRNG, placement, walk — all pure logic covered.
- **Component (Vitest + @testing-library/react):** Node and Edge visual state mapping.
- **Manual smoke:** After each phase milestone (Daily playable at end of Phase 6, Tutorial at Phase 7, Builder at Phase 11, Published levels at Phase 12), play through the route manually to verify UX.
- **No E2E framework in MVP** — keep test surface small. Add Playwright later if the app grows.

## Key Commit Checkpoints

After these phases, the app has a working, committable state:

1. **End of Phase 6:** Daily puzzle playable.
2. **End of Phase 7:** Tutorial playable.
3. **End of Phase 8:** Main menu navigates everything.
4. **End of Phase 9:** Audio system live (even if no tracks yet).
5. **End of Phase 11:** Builder → Playtest works locally.
6. **End of Phase 12:** Full publish → play loop works against Supabase.

## Notes for the Engineer

- **Animations:** `framer-motion` is installed but this plan only uses plain CSS + RAF. That's fine — add FM only when you need a declarative transition that's hard to express in CSS.
- **SVG coordinate system:** everything uses `viewBox="0 0 100 100"` with normalized `[0..1]` positions multiplied by 100. Keep stroke/radius values small (0.3–3) since they're in viewBox units.
- **Supabase RPCs are `security definer`:** they bypass RLS intentionally. Audit them carefully.
- **No mid-path undo:** `R` is the only rewind. Keep that rule intact.
- **Negative counters allowed on nodes/edges; move counter clamps at 0.**
