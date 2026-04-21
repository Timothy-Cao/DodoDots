export const GRID_STEP = 0.1;
export const GRID_MIN = 0.1;
export const GRID_MAX = 0.9;

export function snapToGrid(x: number, y: number): { x: number; y: number } {
  const sx = Math.round((x - GRID_MIN) / GRID_STEP) * GRID_STEP + GRID_MIN;
  const sy = Math.round((y - GRID_MIN) / GRID_STEP) * GRID_STEP + GRID_MIN;
  return {
    x: Math.max(GRID_MIN, Math.min(GRID_MAX, parseFloat(sx.toFixed(1)))),
    y: Math.max(GRID_MIN, Math.min(GRID_MAX, parseFloat(sy.toFixed(1)))),
  };
}

export function gridPoints(): Array<{ x: number; y: number }> {
  const out = [];
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      out.push({ x: GRID_MIN + i * GRID_STEP, y: GRID_MIN + j * GRID_STEP });
    }
  }
  return out;
}
