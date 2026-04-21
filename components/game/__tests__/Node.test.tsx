import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeView } from '../Node';

const base = { id: 'a', x: 0.5, y: 0.5, count: 2, startEligible: true };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('NodeView', () => {
  it('renders a single ring regardless of the node count field', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 1 }} state="idle" onClick={() => {}} />));
    expect(getAllByTestId('ring').length).toBe(1);
  });
  it('still renders a single ring for higher count values', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 3 }} state="idle" onClick={() => {}} />));
    expect(getAllByTestId('ring').length).toBe(1);
  });
  it('applies done class when forceDone is set (e.g. on win)', () => {
    const { container } = render(wrap(<NodeView node={base} state="idle" onClick={() => {}} forceDone />));
    expect(container.querySelector('.node--done')).not.toBeNull();
  });
  it('applies pending class while not done', () => {
    const { container } = render(wrap(<NodeView node={base} state="idle" onClick={() => {}} />));
    expect(container.querySelector('.node--pending')).not.toBeNull();
  });
});
