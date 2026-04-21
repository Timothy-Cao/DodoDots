import l01 from '@/content/campaign/01-level-1.json';
import l02 from '@/content/campaign/02-level-2.json';
import l03 from '@/content/campaign/03-level-3.json';
import type { Level } from './level-format';

export const CAMPAIGN: Level[] = [l01, l02, l03] as Level[];

export function getCampaignLevel(id: string): Level | undefined {
  return CAMPAIGN.find(l => l.id === id);
}
