import { getNode, type Graph, type GraphNode } from './graph';

export type Curvatures = Record<string, number>; // edgeId -> signed curvature in normalized [0..1] space

const CURVE_AMOUNT = 0.12;          // how much to bow per conflict
const MAX_CURVE = 0.22;             // cap so bezier doesn't loop
const FAN_ANGLE_THRESHOLD = 0.45;   // radians; ~25.8°

export function computeCurvatures(graph: Graph): Curvatures {
  const out: Curvatures = {};
  const edges = graph.edges;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i], b = edges[j];
      const aF = getNode(graph, a.from), aT = getNode(graph, a.to);
      const bF = getNode(graph, b.from), bT = getNode(graph, b.to);
      if (!aF || !aT || !bF || !bT) continue;

      const sharesNode = a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to;

      if (!sharesNode) {
        // Class 1: crossing
        if (segmentsCross(aF, aT, bF, bT)) {
          // Curve B perpendicular to itself, away from A's midpoint
          const sign = perpendicularSignAway(aF, aT, bF, bT);
          out[b.id] = clamp((out[b.id] || 0) + sign * CURVE_AMOUNT, -MAX_CURVE, MAX_CURVE);
        }
      } else {
        // Class 2: fan-out from shared node at small angle
        // Determine the shared node and the two "other" endpoints
        let shared: GraphNode | null = null;
        let aOther: GraphNode | null = null;
        let bOther: GraphNode | null = null;
        if (a.from === b.from) { shared = aF; aOther = aT; bOther = bT; }
        else if (a.from === b.to) { shared = aF; aOther = aT; bOther = bF; }
        else if (a.to === b.from) { shared = aT; aOther = aF; bOther = bT; }
        else if (a.to === b.to) { shared = aT; aOther = aF; bOther = bF; }
        if (!shared || !aOther || !bOther) continue;
        const aDx = aOther.x - shared.x, aDy = aOther.y - shared.y;
        const bDx = bOther.x - shared.x, bDy = bOther.y - shared.y;
        const aLen = Math.hypot(aDx, aDy), bLen = Math.hypot(bDx, bDy);
        if (aLen === 0 || bLen === 0) continue;
        const dot = (aDx * bDx + aDy * bDy) / (aLen * bLen);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (angle < FAN_ANGLE_THRESHOLD) {
          // Curve B away from A. Use cross-product sign to determine side.
          const cross = aDx * bDy - aDy * bDx;
          const sign = cross < 0 ? 1 : -1;
          // Curve magnitude scales with how small the angle is
          const intensity = (FAN_ANGLE_THRESHOLD - angle) / FAN_ANGLE_THRESHOLD; // 0..1
          out[b.id] = clamp((out[b.id] || 0) + sign * CURVE_AMOUNT * intensity, -MAX_CURVE, MAX_CURVE);
        }
      }
    }
  }
  return out;
}

// Returns sign such that curving b in this direction moves its midpoint AWAY from a's midpoint
function perpendicularSignAway(aF: GraphNode, aT: GraphNode, bF: GraphNode, bT: GraphNode): 1 | -1 {
  const bDx = bT.x - bF.x, bDy = bT.y - bF.y;
  const aMidX = (aF.x + aT.x) / 2, aMidY = (aF.y + aT.y) / 2;
  const bMidX = (bF.x + bT.x) / 2, bMidY = (bF.y + bT.y) / 2;
  // perpendicular to b: (-bDy, bDx) (left-hand normal)
  const perpX = -bDy, perpY = bDx;
  const toAfromB_X = aMidX - bMidX, toAfromB_Y = aMidY - bMidY;
  const dot = perpX * toAfromB_X + perpY * toAfromB_Y;
  // We want to curve OPPOSITE to where A is — so the sign that gives perp pointing AWAY from A
  return dot > 0 ? -1 : 1;
}

// Standard segment-segment intersection (strict interior, ignores shared endpoints)
export function segmentsCross(p1: GraphNode, p2: GraphNode, p3: GraphNode, p4: GraphNode): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return false; // collinear cases ignored — too rare to matter
}

function direction(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Bezier helpers — used by Edge component for curved rendering
export function bezierPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const it = 1 - t;
  return {
    x: it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
    y: it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y,
  };
}

export function bezierTangent(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
  const it = 1 - t;
  const tx = 2 * it * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const ty = 2 * it * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  const len = Math.hypot(tx, ty) || 1;
  return { x: tx / len, y: ty / len };
}

// Compute the bezier control point given endpoints and a signed curvature
export function bezierControl(
  p0: { x: number; y: number },
  p2: { x: number; y: number },
  curvature: number,
  _vbW: number,
  _vbH: number,
): { x: number; y: number } {
  // Compute in viewBox space (already scaled coords)
  const dx = p2.x - p0.x, dy = p2.y - p0.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length;
  // Perpendicular (left normal in screen coords)
  const px = -uy, py = ux;
  // Magnitude proportional to edge length
  const mag = curvature * length;
  return {
    x: (p0.x + p2.x) / 2 + px * mag,
    y: (p0.y + p2.y) / 2 + py * mag,
  };
}
