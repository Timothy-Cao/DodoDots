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
