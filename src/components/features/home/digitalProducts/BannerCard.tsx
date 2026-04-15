'use client';

import Image from 'next/image';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import Link from 'next/link';
interface BannerCardProps {
  image: string;
  title?: string;
  buttonText?: string;
  className?: string;
  textPosition?: 'bottom' | 'center';
  onClick?: () => void;
  href?: string;
}

export const BannerCard = ({
  image,
  title,
  buttonText,
  className,
  textPosition = 'bottom',
  onClick,
  href,
}: BannerCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-3xl overflow-hidden group w-full h-full min-h-37.5 shadow-sm hover:shadow-xl transition-all duration-500',
        onClick && 'cursor-pointer',
        className
      )}>
      <Image
        src={image}
        alt={title || 'Banner'}
        priority
        width={300}
        height={150}
        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
      />

      {/* Dynamic Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

      <div
        className={cn(
          'absolute inset-0 p-8 flex flex-col items-center',
          textPosition === 'bottom' ? 'justify-end' : 'justify-center'
        )}>
        {buttonText && (
          <div onClick={(e) => onClick && e.stopPropagation()}>
            <Link
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
              <Button className="bg-white text-black hover:bg-neutral-200 rounded-xl px-10 py-3 text-xs font-black shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest border-none">
                {buttonText}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
