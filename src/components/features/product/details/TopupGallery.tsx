'use client';

import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface TopupGalleryProps {
  main_image: { id: number; image: string; is_main: boolean } | undefined;
  name: string;
}

export const TopupGallery = ({ main_image, name }: TopupGalleryProps) => {
  const image = (main_image && main_image?.image) || '/placeholder-product.png';
  return (
    <div className="flex flex-col w-full">
      <div className="relative group aspect-16/12 lg:aspect-3/4 w-full rounded-2xl overflow-hidden bg-transparent">
        <Image
          src={getImageUrl(image)}
          alt={name}
          fill
          className=" object-contain transition-transform duration-500 group-hover:scale-105"
          priority
          unoptimized
        />
      </div>
    </div>
  );
};
