export type ShareData = {
  date: string;
  movesUsed: number;
  optimal: number;
};

function pips(movesUsed: number, optimal: number): string {
  const ratio = movesUsed / optimal;
  if (ratio <= 1) return '⭐⭐⭐⭐';
  if (ratio <= 1.2) return '⭐⭐⭐';
  if (ratio <= 1.5) return '⭐⭐';
  return '⭐';
}

export function buildShareText(d: ShareData, url: string): string {
  return `DodoDots ${d.date}\n${pips(d.movesUsed, d.optimal)}  ${d.movesUsed}/${d.optimal} moves\n${url}`;
}

export async function shareResult(data: ShareData): Promise<'shared' | 'copied' | 'failed'> {
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://dodo-dots.vercel.app';
  const text = buildShareText(data, url);
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as { share: (data: { text: string; title: string }) => Promise<void> }).share({ title: 'DodoDots', text });
      return 'shared';
    } catch {
      // fall through to clipboard
    }
  }
  if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  return 'failed';
}
