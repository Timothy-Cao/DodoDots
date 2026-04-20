'use client';
import Link from 'next/link';
import { MenuLayout } from '@/components/ui/MenuLayout';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { SolvedCalendar } from '@/components/ui/SolvedCalendar';

export default function Home() {
  return (
    <MenuLayout title="DODODOTS">
      <StreakBadge />
      <Link href="/daily" prefetch><button>Daily</button></Link>
      <Link href="/tutorial" prefetch><button>Tutorial</button></Link>
      <button disabled>Campaign · soon</button>
      <button disabled>Builder · soon</button>
      <SolvedCalendar />
    </MenuLayout>
  );
}
