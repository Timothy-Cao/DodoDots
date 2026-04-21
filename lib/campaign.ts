import l01 from '@/content/campaign/01-first-steps.json';
import l02 from '@/content/campaign/02-three-in-a-row.json';
import l03 from '@/content/campaign/03-the-triangle.json';
import l04 from '@/content/campaign/04-the-square.json';
import l05 from '@/content/campaign/05-branching-out.json';
import l06 from '@/content/campaign/06-pentagon.json';
import l07 from '@/content/campaign/07-the-bowtie.json';
import l08 from '@/content/campaign/08-the-hexagon.json';
import l09 from '@/content/campaign/09-pentagon-plus-cross.json';
import l10 from '@/content/campaign/10-double-diamond.json';
import type { Level } from './level-format';

export const CAMPAIGN: Level[] = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10] as Level[];

export function getCampaignLevel(id: string): Level | undefined {
  return CAMPAIGN.find(l => l.id === id);
}
