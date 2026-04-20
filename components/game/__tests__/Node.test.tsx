import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeView } from '../Node';

const base = { id: 'a', x: 0.5, y: 0.5, count: 2, startEligible: true };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('NodeView', () => {
  it('renders 2 pips when count === 2', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={base} state="idle" onClick={() => {}} />));
    expect(getAllByTestId('pip').length).toBe(2);
  });
  it('renders 1 pip when count === 1', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 1 }} state="idle" onClick={() => {}} />));
    expect(getAllByTestId('pip').length).toBe(1);
  });
  it('renders no pips when count === 0', () => {
    const { queryAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 0 }} state="idle" onClick={() => {}} />));
    expect(queryAllByTestId('pip').length).toBe(0);
  });
  it('applies done class when count <= 0', () => {
    const { container } = render(wrap(<NodeView node={{ ...base, count: 0 }} state="idle" onClick={() => {}} />));
    expect(container.querySelector('.node--done')).not.toBeNull();
  });
});
