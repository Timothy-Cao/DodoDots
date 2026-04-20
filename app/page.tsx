'use client';
import Link from 'next/link';
import { MenuLayout } from '@/components/ui/MenuLayout';

export default function Home() {
  return (
    <MenuLayout title="DODODOTS">
      <Link href="/daily" prefetch><button>Daily</button></Link>
      <Link href="/tutorial" prefetch><button>Tutorial</button></Link>
      <button disabled>Campaign · soon</button>
      <button disabled>Builder · soon</button>
    </MenuLayout>
  );
}
