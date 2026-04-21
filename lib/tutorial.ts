import l1 from '@/content/tutorial/01-line.json';
import l2 from '@/content/tutorial/02-start.json';
import l3 from '@/content/tutorial/03-multi.json';
import type { Graph } from './graph';

export type TutorialLevel = {
  id: string;
  title: string;
  caption: string;
  maxMoves: number;
  graph: Graph;
};

export const TUTORIAL: TutorialLevel[] = [l1, l2, l3] as TutorialLevel[];
