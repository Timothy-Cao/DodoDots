import l1 from '@/content/tutorial/01-click.json';
import l2 from '@/content/tutorial/02-path.json';
import l3 from '@/content/tutorial/03-revisit.json';
import l4 from '@/content/tutorial/04-puzzle.json';
import type { Graph } from './graph';

export type TutorialLevel = {
  id: string;
  title: string;
  caption: string;
  maxMoves: number;
  graph: Graph;
};

export const TUTORIAL: TutorialLevel[] = [l1, l2, l3, l4] as TutorialLevel[];
