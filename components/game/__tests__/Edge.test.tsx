import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EdgeView } from '../Edge';
import type { GraphNode, GraphEdge } from '@/lib/graph';

const a: GraphNode = { id: 'a', x: 0.2, y: 0.5, count: 0, startEligible: true };
const b: GraphNode = { id: 'b', x: 0.8, y: 0.5, count: 0, startEligible: false };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('EdgeView', () => {
  it('renders 2 pips when count === 2', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 2, direction: 'bi' };
    const { getAllByTestId } = render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(getAllByTestId('pip').length).toBe(2);
  });
  it('renders 1 pip when count === 1', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 1, direction: 'bi' };
    const { getAllByTestId } = render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(getAllByTestId('pip').length).toBe(1);
  });
  it('renders no pips when count === 0', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 0, direction: 'bi' };
    const { queryAllByTestId } = render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(queryAllByTestId('pip').length).toBe(0);
  });
  it('renders arrow marker when directed', () => {
    const e: GraphEdge = { id: 'e', from: 'a', to: 'b', count: 1, direction: 'forward' };
    const { container } = render(wrap(<EdgeView edge={e} from={a} to={b} />));
    expect(container.querySelector('.edge--directed')).not.toBeNull();
  });
});
