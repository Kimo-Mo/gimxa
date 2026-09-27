import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { Platform } from '@/types';
import { Skeleton } from '@/components/ui';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { Gamepad2, Monitor, Smartphone, Joystick, ChevronLeft, ChevronRight } from 'lucide-react';

const GamingPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05] z-0">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="gaming-xo-pattern"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* X symbol */}
          <path
            d="M20 20 L30 30 M30 20 L20 30"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* O symbol */}
          <circle cx="60" cy="25" r="5" stroke="currentColor" strokeWidth="3" fill="none" />
          {/* Triangle symbol */}
          <polygon
            points="25,65 20,75 30,75"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Square symbol */}
          <rect
            x="55"
            y="65"
            width="10"
            height="10"
            stroke="currentColor"
            strokeWidth="3"
            rx="1"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gaming-xo-pattern)" />
    </svg>
  </div>
);

const getPlatformFallbackIcon = (slug: string) => {
  const lower = slug.toLowerCase();
  if (lower.includes('pc') || lower.includes('windows') || lower.includes('mac')) return Monitor;
  if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android'))
    return Smartphone;
  if (lower.includes('nintendo')) return Joystick;
  return Gamepad2;
};

export const ExploreByPlatform = () => {
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['platformsList'],
    queryFn: () => catalogService.publicPlatformsList(),
  });

  const platforms: Platform[] = apiResponse?.results || apiResponse || [];
  const count = platforms.length;
  const shouldLoop = count > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: shouldLoop,
      align: 'start',
      slidesToScroll: 1,
      breakpoints: {
        '(max-width: 768px)': { align: 'center' },
      },
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(!shouldLoop);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(!shouldLoop);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback((emblaApi: any) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <section className="relative rounded-[2.5rem] overflow-hidden p-8 md:p-12 border border-border/50 bg-card/30">
        <GamingPattern />
        <div className="relative z-10 flex items-end justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-primary/10" />
            <Skeleton className="h-5 w-48 bg-muted/50" />
          </div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="flex-none w-[70%] md:w-[25%] h-48 rounded-3xl bg-card/50" />
          ))}
        </div>
      </section>
    );
  }

  if (!platforms || platforms.length === 0) return null;

  return (
    <section className="relative rounded-[2.5rem] overflow-hidden p-8 md:p-12 border border-border/50 bg-linear-to-br from-card/80 via-background to-card/80 backdrop-blur-sm shadow-xl group/section">
      <GamingPattern />

      {/* Dynamic Background Glows */}
      <div className="absolute top-0 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Explore By Platform
            <span className="hidden md:block w-12 h-1 bg-primary rounded-full" />
          </h3>
          <p className="text-base text-muted-foreground mt-2 font-medium">
            Discover your next adventure on your favorite gaming system
          </p>
        </div>

        {/* Navigation Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className="w-12 h-12 rounded-full border border-border bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className="w-12 h-12 rounded-full border border-border bg-background/50 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="relative z-10 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
        <div className="flex touch-pan-y" style={{ backfaceVisibility: 'hidden' }}>
          {platforms.map((platform) => {
            const FallbackIcon = getPlatformFallbackIcon(platform.slug);

            return (
              <div
                key={platform.slug}
                className="flex-none min-w-0 mt-3 w-[60%] sm:w-[35%] md:w-[25%] lg:w-[18%] xl:w-[14.28%] px-2"
              >
                <Link
                  href={`/store?platform=${platform.slug}`}
                  className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl hover:bg-card hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer text-center overflow-hidden h-full"
                >
                  {/* Card Hover Gradient */}
                  <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-background shadow-sm border border-border group-hover:border-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                    {platform.logo ? (
                      <div className="w-11 h-11 relative z-10">
                        <Image
                          src={getImageUrl(platform.logo)}
                          alt={platform.name}
                          fill
                          className="object-contain drop-shadow-sm group-hover:drop-shadow-[0_0_12px_rgba(128,44,236,0.3)] transition-all duration-500"
                        />
                      </div>
                    ) : (
                      <FallbackIcon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                    )}

                    {/* Icon background pulse on hover */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
                  </div>

                  <div className="space-y-1">
                    <span className="relative z-10 block font-black text-sm md:text-base text-foreground/90 group-hover:text-primary transition-colors duration-300 uppercase tracking-tight">
                      {platform.name}
                    </span>
                    <div className="h-0.5 w-0 group-hover:w-full bg-primary mx-auto transition-all duration-500 rounded-full" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
