'use client';

import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface ProductGalleryProps {
  images: { id: number; image: string; is_main: boolean }[] | undefined;
  name: string;
}

export const ProductGallery = ({ images, name }: ProductGalleryProps) => {
  const image = (images && images?.find((img) => img.is_main)?.image) || '/placeholder-product.png';
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
      <div className="grid grid-cols-2 gap-2">
        {images &&
          images?.length > 1 &&
          images?.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-16/12 lg:aspect-3/4 w-full rounded-2xl overflow-hidden bg-transparent cursor-pointer">
              <Image
                src={getImageUrl(img.image)}
                alt={name}
                fill
                className="object-contain max-w-full"
                priority
                unoptimized
              />
            </div>
          ))}
      </div>
    </div>
  );
};
