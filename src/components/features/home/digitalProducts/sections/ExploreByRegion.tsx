'use client';

import { Globe, Map, Flag, Sun, MapPin, Compass } from 'lucide-react';
import Link from 'next/link';

const regions = [
  {
    value: 'global',
    label: 'Global',
    icon: Globe,
    color: 'from-blue-600/50 to-cyan-400/50 hover:border-cyan-400/50',
  },
  {
    value: 'eu',
    label: 'Europe (EU)',
    icon: Map,
    color: 'from-blue-700/50 to-indigo-500/50 hover:border-indigo-500/50',
  },
  {
    value: 'us',
    label: 'United States (US)',
    icon: Flag,
    color: 'from-red-600/50 to-orange-500/50 hover:border-orange-500/50',
  },
  {
    value: 'mena',
    label: 'Middle East & Africa',
    icon: Sun,
    color: 'from-orange-600/50 to-amber-400/50 hover:border-amber-400/50',
  },
  {
    value: 'latam',
    label: 'Latin America',
    icon: MapPin,
    color: 'from-green-600/50 to-emerald-400/50 hover:border-emerald-400/50',
  },
  {
    value: 'asia',
    label: 'Asia',
    icon: Compass,
    color: 'from-purple-600/50 to-pink-400/50 hover:border-pink-400/50',
  },
];

export const ExploreByRegion = () => {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider">Explore By Region</h3>
          <p className="text-sm text-muted-foreground mt-1">Find games available in your region</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {regions.map((region) => (
          <Link
            key={region.value}
            href={`/store?region=${region.value}`}
            className={`
              flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
              bg-linear-to-br ${region.color} border border-border
              transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-primary/5
              group cursor-pointer text-center
            `}>
            <region.icon
              className="w-8 h-8 text-foreground/70 group-hover:text-foreground transition-colors duration-300"
              strokeWidth={1.5}
            />
            <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-300">
              {region.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
