'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Gamepad2, Monitor, RefreshCw, Gift, Sparkles, Tag, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { useRouter } from 'next/navigation';

export const SecondaryNavbar = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hasHovered, setHasHovered] = useState(false);
  const router = useRouter();

  const handleMouseEnter = (id: string) => {
    setActiveMenu(id);
    if (!hasHovered) setHasHovered(true);
  };

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  // Fetch data only after the first hover
  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => catalogService.publicPlatformsList(),
    enabled: hasHovered,
    staleTime: Infinity,
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => catalogService.publicRegionsList(),
    enabled: hasHovered,
    staleTime: Infinity,
  });

  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => catalogService.publicTypesList(),
    enabled: hasHovered,
    staleTime: Infinity,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => catalogService.publicTagsList(),
    enabled: hasHovered,
    staleTime: Infinity,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.publicCategoriesList(),
    enabled: hasHovered,
    staleTime: Infinity,
  });

  const getArray = (data: any) => (data?.results ? data.results : Array.isArray(data) ? data : []);

  const platforms = getArray(platformsData);
  const regions = getArray(regionsData);
  const types = getArray(typesData);
  const tags = getArray(tagsData);
  const categories = getArray(categoriesData);

  const handleRandomWeekendClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const availableCategories = [
      'topup-service',
      'topup-mobile',
      'console-games',
      'pc-games',
      'gift-cards',
      'software',
      'subscriptions',
    ];
    // Randomize array
    const shuffled = [...availableCategories].sort(() => 0.5 - Math.random());
    // Pick random number between 2 and availableCategories.length
    const numToPick = Math.floor(Math.random() * (availableCategories.length - 1)) + 2;
    const selectedCategories = shuffled.slice(0, numToPick);

    router.push(`/store?category=${selectedCategories.join(',')}`);
  };

  // Build the navItems dynamically
  const navItems = useMemo(() => [
    {
      id: 'gaming',
      label: 'Gaming',
      icon: Gamepad2,
      href: '/store?category=gaming',
      menu: {
        columns: [
          {
            title: 'By platform',
            icon: 'Gamepad2',
            links: platforms.slice(0, 8).map((p: any) => ({ label: p.name, href: `/store?platform=${p.slug}` })),
          },
          {
            title: 'By region',
            icon: 'Globe',
            links: regions.slice(0, 8).map((r: any) => ({ label: r.name, href: `/store?region=${r.slug}` })),
          },
          {
            title: 'By key',
            icon: 'Key',
            links: types.slice(0, 8).map((t: any) => ({ label: t.name, href: `/store?type=${t.slug}` })),
          },
          {
            title: 'By Category',
            icon: 'Folder',
            links: categories.slice(0, 8).map((c: any) => ({ label: c.name, href: `/store?category=${c.slug}` })),
          },
          {
            title: 'By genre',
            icon: 'Star',
            links: [
              { label: 'RPG', href: '/store?tag=rpg' },
              { label: 'Adventure', href: '/store?tag=adventure' },
              { label: 'Shooter', href: '/store?tag=shooter' },
              { label: 'Sport', href: '/store?tag=sport' },
              { label: 'Racing', href: '/store?tag=racing' },
            ],
          },
          {
            title: 'By device',
            icon: 'Monitor',
            links: [
              { label: 'PC', href: '/store?tag=pc' },
              { label: 'Xbox', href: '/store?tag=xbox' },
              { label: 'Playstation', href: '/store?tag=playstation' },
              { label: 'Nintendo', href: '/store?tag=nintendo' },
            ],
          },
        ],
      },
    },
    {
      id: 'topup-tags',
      label: 'Topup & Tags',
      icon: Zap,
      href: '/store?category=topup-mobile,topup-service',
      menu: {
        columns: [
          {
            title: 'By topup',
            icon: 'Zap',
            links: [
              { label: 'Topup Mobile', href: '/store?category=topup-mobile' },
              { label: 'Topup Service', href: '/store?category=topup-service' },
            ],
          },
          {
            title: 'By Tags',
            icon: 'Tag',
            links: tags.slice(0, 15).map((t: any) => ({ label: t.name, href: `/store?tag=${t.slug}` })),
          },
        ],
      },
    },
    {
      id: 'software',
      label: 'Software',
      icon: Monitor,
      href: '/store?category=software',
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: RefreshCw,
      href: '/store?category=subscriptions',
      menu: {
        columns: [
          {
            title: 'Gaming subscriptions',
            icon: 'Gamepad2',
            links: [
              { label: 'Xbox Game Pass', href: '/store?search=xbox+game+pass' },
              { label: 'Playstation Plus', href: '/store?search=playstation+plus' },
              { label: 'Nintendo Switch Online', href: '/store?search=nintendo+switch+online' },
              { label: 'EA Play', href: '/store?search=ea+play' },
            ],
          },
          {
            title: 'Video streaming',
            icon: 'PlayCircle',
            links: [
              { label: 'Netflix', href: '/store?search=netflix' },
              { label: 'Crunchyroll', href: '/store?search=crunchyroll' },
              { label: 'Disney+', href: '/store?search=disney' },
            ],
          },
          {
            title: 'Music',
            icon: 'Music',
            links: [
              { label: 'Spotify', href: '/store?search=spotify' },
              { label: 'Apple Music', href: '/store?search=apple+music' },
            ],
          },
        ],
      },
    },
    {
      id: 'giftcards',
      label: 'Gift cards',
      icon: Gift,
      href: '/store?category=gift-cards',
      menu: {
        columns: [
          {
            title: 'Gaming gift cards',
            icon: 'Gamepad2',
            links: [
              { label: 'Steam', href: '/store?search=steam+gift+card' },
              { label: 'Playstation', href: '/store?search=playstation+gift+card' },
              { label: 'Xbox', href: '/store?search=xbox+gift+card' },
              { label: 'Nintendo eShop', href: '/store?search=nintendo+gift+card' },
              { label: 'Razer Gold', href: '/store?search=razer+gold' },
            ],
          },
          {
            title: 'Mobile game top up',
            icon: 'Smartphone',
            links: [
              { label: 'PUBG Mobile', href: '/store?search=pubg' },
              { label: 'Mobile Legends', href: '/store?search=mobile+legends' },
              { label: 'Free Fire', href: '/store?search=free+fire' },
            ],
          },
        ],
      },
    },
    {
      id: 'random',
      label: 'Random Weekend',
      icon: Sparkles,
      href: '#',
      badge: 'NEW',
      badgeColor: 'bg-green-600',
      onClick: handleRandomWeekendClick,
    },
    {
      id: 'outlet',
      label: 'OUTLET',
      icon: Tag,
      href: '/store?tag=outlet',
      badge: 'HOT',
      badgeColor: 'bg-red-600',
    },
  ], [platforms, regions, types, tags, categories, router]);

  return (
    <div className="w-full bg-[#111111] border-t border-white/5 relative z-40 hidden md:block">
      <div className="main_container">
        <ul className="flex items-center gap-6 text-sm font-medium h-12">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className="h-full flex items-center"
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}>
                <Link
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex items-center gap-2 h-full text-gray-300 hover:text-white transition-colors relative',
                    activeMenu === item.id && 'text-white'
                  )}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded leading-none text-white',
                        item.badgeColor
                      )}>
                      {item.badge}
                    </span>
                  )}
                  {activeMenu === item.id && item.menu && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />
                  )}
                </Link>

                {/* Mega Menu */}
                {item.menu && activeMenu === item.id && (
                  <div className="absolute top-full left-0 w-full bg-[#1c1c1c] border-t border-white/10 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden">
                    {/* Gaming Pattern Background */}
                    <div
                      className="absolute inset-0 opacity-[0.05] pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg transform='translate(20,20) rotate(15)'%3E%3Cpath d='M21 11a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h1M18 18h1a5 5 0 0 0 5-5v-2'/%3E%3Cpath d='M6 13V9M4 11h4M17 11h.01M15 9h.01'/%3E%3C/g%3E%3Cg transform='translate(80,40) rotate(-20)'%3E%3Crect x='5' y='2' width='14' height='20' rx='7'/%3E%3Cpath d='M12 2v6'/%3E%3C/g%3E%3Cg transform='translate(40,80) rotate(45)'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8M8 12h8'/%3E%3C/g%3E%3Cg transform='translate(100,90) rotate(-15)'%3E%3Cpolygon points='12 2 22 8.5 22 21.5 12 28 2 21.5 2 8.5 12 2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '120px 120px'
                      }}
                    />
                    <div className="main_container py-8 flex gap-8 relative z-10">
                      {/* Link Columns */}
                      <div className="flex-1 flex flex-wrap gap-x-12 gap-y-8">
                        {item.menu.columns.map((col, idx) => {
                          if (col.links.length === 0) return null;
                          return (
                            <div key={idx} className="flex flex-col gap-4 min-w-[140px]">
                              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                {col.title}
                              </h3>
                              <ul className="flex flex-col gap-2.5">
                                {col.links.map((link: { href: string; label: string }, lIdx: number) => (
                                  <li key={lIdx}>
                                    <Link
                                      href={link.href}
                                      className="text-gray-400 hover:text-white text-[13px] transition-colors">
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>

                      {/* Promos (if any) */}
                      {(item.menu as any).promos && (
                        <div className="w-[300px] shrink-0 flex flex-col gap-4 border-l border-white/5 pl-8">
                          {(item.menu as any).promos.map((promo: any, idx: number) => (
                            <Link
                              key={idx}
                              href={promo.href}
                              className="group block relative rounded-lg overflow-hidden h-[180px]">
                              <Image
                                src={promo.image}
                                alt={promo.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                <span className="text-white font-bold">{promo.title}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

        </ul>
      </div>
    </div>
  );
};
