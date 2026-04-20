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
