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
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { ProductTag } from '@/types';
import { Skeleton } from '@/components/ui';

const getTagIcon = (tag: string) => {
  const lowercaseTag = tag.toLowerCase();
  if (lowercaseTag.includes('action') || lowercaseTag.includes('fight')) return Swords;
  if (lowercaseTag.includes('shooter') || lowercaseTag.includes('fps')) return Crosshair;
  if (lowercaseTag.includes('strategy')) return Target;
  if (lowercaseTag.includes('horror') || lowercaseTag.includes('zombie')) return Ghost;
  if (lowercaseTag.includes('survival')) return Skull;
  if (lowercaseTag.includes('racing') || lowercaseTag.includes('car')) return Car;
  if (lowercaseTag.includes('flight') || lowercaseTag.includes('simulator')) return Plane;
  if (lowercaseTag.includes('sci-fi') || lowercaseTag.includes('cyber')) return Cpu;
  if (lowercaseTag.includes('sports')) return Trophy;
  if (
    lowercaseTag.includes('magic') ||
    lowercaseTag.includes('rpg') ||
    lowercaseTag.includes('fantasy')
  )
    return Sparkles;
  if (lowercaseTag.includes('space')) return Rocket;
  if (lowercaseTag.includes('mmo') || lowercaseTag.includes('defense')) return Shield;
  if (
    lowercaseTag.includes('board') ||
    lowercaseTag.includes('card') ||
    lowercaseTag.includes('casino')
  )
    return Dices;
  if (lowercaseTag.includes('puzzle') || lowercaseTag.includes('logic')) return Puzzle;

  return Gamepad2;
};

export const ExploreByTags = () => {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => catalogService.publicTagsList(),
  });

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
          <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Category</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse products by category</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {tags.slice(0, 12).map((tag) => {
          const TagIcon = getTagIcon(tag.name);
          return (
            <Link
              key={tag.id}
              href={`/store?tag=${tag.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 hover:bg-card shadow hover:shadow-sm transition-all duration-300 group">
              <div className="p-2 rounded-lg bg-primary/10 text-primary transition-colors duration-300">
                <TagIcon className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-300 line-clamp-1 uppercase">
                {tag.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
