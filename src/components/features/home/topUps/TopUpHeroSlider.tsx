'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import Image from 'next/image';
import { cn, getImageUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Product } from '@/types';
import { topupService } from '@/services/topup.service';

export const TopUpHeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['topupsHero'],
    queryFn: () =>
      topupService.publicTopupsList({
        filter: 'is_featured=true',
      }),
  });

  const products = pageData?.results ?? [];
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  // Auto-play
  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, products.length, nextSlide]);

  if (isLoading)
    return (
      <Skeleton className="relative w-full h-full min-h-70 overflow-hidden rounded-3xl group" />
    );

  if (error || !products.length)
    return (
      <div className="relative w-full h-full min-h-70 overflow-hidden rounded-3xl group flex items-center justify-center bg-muted/20">
        <p className="text-center text-muted-foreground">
          {error ? 'Error loading products' : 'No products found'}
        </p>
      </div>
    );

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl shadow-md group">
      {products.map((item: Product, index: number) => (
        <div
          key={item.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}>
          {item?.product?.main_image && typeof item?.product.main_image !== 'string' ? (
            <Image
              src={getImageUrl(item?.product.main_image?.image)}
              alt={item?.name || 'TopUp'}
              fill
              priority={index === 0}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col items-center justify-end pb-12 text-center text-white p-6">
            <h2 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter drop-shadow-2xl capitalize">
              {item?.product?.name}
            </h2>
            <Link href={`/topup/${item.product?.slug}`}>
              <Button className="bg-white text-black hover:bg-white/90 rounded-full px-12 py-6 text-xl font-black uppercase">
                Top Up Now
              </Button>
            </Link>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 cursor-pointer rounded-full backdrop-blur-sm lg:opacity-0 group-hover:lg:opacity-100 transition-opacity">
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 cursor-pointer rounded-full backdrop-blur-sm lg:opacity-0 group-hover:lg:opacity-100 transition-opacity">
            <ChevronRight size={32} />
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {products.map((_: Product, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all cursor-pointer',
                  index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
