'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
interface BannerCardProps {
  image: string;
  title?: string;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export const BannerCard = ({
  image,
  title,
  className,
  onClick,
  href,
}: BannerCardProps) => {
  return (
    <Link className="w-full h-full"
      href={href || (onClick ? '#' : '/store')}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          const element = document.getElementById('top-ups');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
          onClick();
        }
      }}>
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-3xl overflow-hidden group w-full h-full lg:min-h-35 shadow-sm hover:shadow-xl transition-all duration-500',
          onClick && 'cursor-pointer',
          className
        )}>
        <Image
          src={image}
          alt={title || 'Banner'}
          priority
          width={300}
          height={150}
          className="w-full h-full lg:object-cover object-contain"
        />

        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
};
