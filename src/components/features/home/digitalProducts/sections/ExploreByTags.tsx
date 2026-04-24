'use client';

import {
  Gamepad2,
  Swords,
  Crosshair,
  Target,
  Ghost,
  Skull,
  Car,
  Plane,
  Cpu,
  Trophy,
  Sparkles,
  Rocket,
  Shield,
  Dices,
  Puzzle,
  Zap,
  Flame,
  Crown,
  Sword,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { ProductTag } from '@/types';
import { Carousel, CarouselContent, CarouselItem, Skeleton } from '@/components/ui';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';

const GAMING_ICONS = [
  Gamepad2,
  Swords,
  Crosshair,
  Target,
  Ghost,
  Skull,
  Car,
  Plane,
  Cpu,
  Trophy,
  Sparkles,
  Rocket,
  Shield,
  Dices,
  Puzzle,
  Zap,
  Flame,
  Crown,
  Sword,
];
export const getTagIcon = (tag: string) => {
  if (!tag) return Gamepad2;

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  const positiveHash = Math.abs(hash);

  const index = positiveHash % GAMING_ICONS.length;

  return GAMING_ICONS[index];
};

export const ExploreByTags = () => {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => catalogService.publicTagsList(),
  });

  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  const tags: ProductTag[] = Array.isArray(responseData) ? responseData : responseData?.data || [];

  if (isLoading) {
    return (
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Tags</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-18.5 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (tags.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Tags</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse products by tags</p>
        </div>
      </div>

      <Carousel
        opts={{ align: 'center', loop: true }}
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}>
        <CarouselContent>
          {tags.slice(0, 12).map((tag) => {
            const TagIcon = getTagIcon(tag.name);
            return (
              <CarouselItem key={tag.id} className="basis-1/2 sm:basis-1/3 lg:basis-1/5">
                <Link
                  href={`/store?tag=${tag.slug}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:bg-card shadow hover:shadow-sm transition-all duration-300 group">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
                    <TagIcon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-300 line-clamp-1 uppercase">
                    {tag.name}
                  </span>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
};
