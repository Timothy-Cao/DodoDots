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
    const all: any = get('builderDrafts', {});
    all[id] = draft;
    set('builderDrafts', all);
  },
  deleteDraft: (id: string) => {
    const all: any = get('builderDrafts', {});
    delete all[id];
    set('builderDrafts', all);
  },
  getHasPlayed: (): boolean => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('dododots:hasPlayed') === '1';
  },
  markHasPlayed: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dododots:hasPlayed', '1');
  },

  getStreak: (): { count: number; lastSolvedDate: string | null } => {
    if (typeof window === 'undefined') return { count: 0, lastSolvedDate: null };
    try {
      const raw = localStorage.getItem('dododots:streak');
      return raw ? JSON.parse(raw) : { count: 0, lastSolvedDate: null };
    } catch {
      return { count: 0, lastSolvedDate: null };
    }
  },

  updateStreakOnSolve: (todayIso: string): { count: number; lastSolvedDate: string | null } => {
    if (typeof window === 'undefined') return { count: 0, lastSolvedDate: null };
    const prev = storage.getStreak();
    if (prev.lastSolvedDate === todayIso) return prev; // already counted today
    const yesterday = new Date(new Date(todayIso).getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const count = prev.lastSolvedDate === yesterdayIso ? prev.count + 1 : 1;
    const next = { count, lastSolvedDate: todayIso };
    localStorage.setItem('dododots:streak', JSON.stringify(next));
    return next;
  },
};
