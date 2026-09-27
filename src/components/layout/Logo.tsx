'use client';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logo.png';
export const Logo = () => {
  return (
    <Link href="/" className="font-bold text-xl uppercase flex items-center gap-2 w-20 md:w-24 shrink-0 overflow-hidden">
      <Image
        src={logo}
        alt="Logo"
        width={100}
        height={50}
        className="object-contain scale-[1.7] md:scale-180"
        style={{ width: '100%', height: 'auto' }}
        priority
      />
    </Link>
  );
};
