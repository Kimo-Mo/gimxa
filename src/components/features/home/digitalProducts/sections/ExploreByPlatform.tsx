'use client';

import { Gamepad2, Monitor, Smartphone, Globe, Box } from 'lucide-react';
import Link from 'next/link';

const platforms = [
  {
    name: 'PC Games',
    icon: Monitor,
    color: 'from-blue-600/50 to-cyan-400/50 hover:border-cyan-400/50',
  },
  {
    name: 'PlayStation',
    icon: Gamepad2,
    color: 'from-blue-700/50 to-indigo-500/50 hover:border-indigo-500/50',
  },
  {
    name: 'Xbox',
    icon: Box,
    color: 'from-green-600/50 to-emerald-400/50 hover:border-emerald-400/50',
  },
  {
    name: 'Nintendo',
    icon: Gamepad2,
    color: 'from-red-600/50 to-orange-500/50 hover:border-orange-500/50',
  },
  {
    name: 'Mobile',
    icon: Smartphone,
    color: 'from-purple-600/50 to-pink-400/50 hover:border-pink-400/50',
  },
  {
    name: 'All Platforms',
    icon: Globe,
    color: 'from-gray-600/50 to-slate-400/50 hover:border-border',
  },
];

export const ExploreByPlatform = () => {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-wider">
            Explore By Platform
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Find games for your favorite device</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {platforms.map((platform) => (
          <Link
            key={platform.name}
            href={`/store?platform=${platform.name.toLowerCase().replace(' ', '-')}`}
            className={`
              flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
              bg-linear-to-br ${platform.color} border border-border
              transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-primary/5
              group cursor-pointer
            `}>
            <platform.icon
              className="w-8 h-8 text-foreground/70 group-hover:text-foreground transition-colors duration-300"
              strokeWidth={1.5}
            />
            <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors duration-300 text-center">
              {platform.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
