'use client';

import { Globe, Map, Flag, Sun, MapPin, Compass } from 'lucide-react';
import Link from 'next/link';

const REGION_THEMES = [
  { icon: Globe, color: 'from-blue-600/50 to-cyan-400/50 hover:border-cyan-400/50' },
  { icon: Map, color: 'from-blue-700/50 to-indigo-500/50 hover:border-indigo-500/50' },
  { icon: Flag, color: 'from-red-600/50 to-orange-500/50 hover:border-orange-500/50' },
  { icon: Sun, color: 'from-orange-600/50 to-amber-400/50 hover:border-amber-400/50' },
  { icon: MapPin, color: 'from-green-600/50 to-emerald-400/50 hover:border-emerald-400/50' },
  { icon: Compass, color: 'from-purple-600/50 to-pink-400/50 hover:border-pink-400/50' },
];

import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { Region } from '@/types';
import { Skeleton } from '@/components/ui';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

export const ExploreByRegion = () => {
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['regionsList'],
    queryFn: () => catalogService.publicRegionsList(),
  });

  const regions: Region[] = apiResponse?.results || apiResponse || [];

  if (isLoading) {
    return (
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Region</h3>
            <p className="text-sm text-muted-foreground mt-1">Find games available in your region</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!regions || regions.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Region</h3>
          <p className="text-sm text-muted-foreground mt-1">Find games available in your region</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {regions.map((region, index) => {
          const theme = REGION_THEMES[index % REGION_THEMES.length];
          const Icon = theme.icon;
          
          return (
            <Link
              key={region.slug}
              href={`/store?region=${region.slug}`}
              className={`
                flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
                bg-linear-to-br ${theme.color} border border-border
                transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-primary/5
                group cursor-pointer text-center
              `}>
              {region.logo ? (
                <div className="w-8 h-8 relative opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  <Image src={getImageUrl(region.logo)} alt={region.name} fill className="object-contain" />
                </div>
              ) : (
                <Icon
                  className="w-8 h-8 text-foreground/70 group-hover:text-foreground transition-colors duration-300"
                  strokeWidth={1.5}
                />
              )}
              <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                {region.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
