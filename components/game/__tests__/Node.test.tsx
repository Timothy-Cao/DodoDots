import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeView } from '../Node';

const base = { id: 'a', x: 0.5, y: 0.5, count: 2, startEligible: true };

function wrap(ui: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{ui}</svg>;
}

describe('NodeView', () => {
  it('renders 1 ring when count === 1', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 1 }} state="idle" onClick={() => {}} initialCount={1} />));
    expect(getAllByTestId('ring').length).toBe(1);
  });
  it('renders 2 rings when count === 2', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={base} state="idle" onClick={() => {}} initialCount={2} />));
    expect(getAllByTestId('ring').length).toBe(2);
  });
  it('renders 3 rings when count === 3', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 3 }} state="idle" onClick={() => {}} initialCount={3} />));
    expect(getAllByTestId('ring').length).toBe(3);
  });
  it('renders rings when count === 0 (done, using initialCount)', () => {
    const { getAllByTestId } = render(wrap(<NodeView node={{ ...base, count: 0 }} state="idle" onClick={() => {}} initialCount={2} />));
    // done node still shows layers from initialCount
    expect(getAllByTestId('ring').length).toBe(2);
  });
  it('applies done class when count <= 0', () => {
    const { container } = render(wrap(<NodeView node={{ ...base, count: 0 }} state="idle" onClick={() => {}} />));
    expect(container.querySelector('.node--done')).not.toBeNull();
  });
  it('applies pending class when count > 0', () => {
    const { container } = render(wrap(<NodeView node={base} state="idle" onClick={() => {}} />));
    expect(container.querySelector('.node--pending')).not.toBeNull();
  });
});
