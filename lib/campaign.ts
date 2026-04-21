import l01 from '@/content/campaign/01-untitled.json';
import type { Level } from './level-format';

export const CAMPAIGN: Level[] = [l01] as Level[];

export function getCampaignLevel(id: string): Level | undefined {
  return CAMPAIGN.find(l => l.id === id);
}
