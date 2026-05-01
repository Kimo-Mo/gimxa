'use client';

import { HeroSlider } from './HeroSlider';
import { BannerCard } from './BannerCard';
import {
  PopularPcGames,
  ExploreByTags,
  PopularGiftCards,
  PopularSubscriptions,
  PopularConsoleGames,
  TrustSignals,
  ExploreByRegion,
} from './sections';

export const DigitalProducts = () => {
  return (
    <div className="flex flex-col gap-6 lg:gap-12 w-full pb-12">
      {/* Top Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Hero Slider */}
        <div className="lg:col-span-2 relative min-h-70 md:h-auto">
          <HeroSlider />
        </div>

        {/* Right Column - Two Banners */}
        <div className="flex flex-col gap-6 h-full">
          <BannerCard image="/subscriptions.png" href="/store?category=subscriptions" />
          <BannerCard image="/software.png" href="/store?category=software" />
        </div>
      </div>

      {/* Quick Access Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-20">
        <BannerCard image="/pc-games-1.png" href="/store?category=pc-games" />
        <BannerCard image="/console-games.png" href="/store?category=console-games" />
        <BannerCard image="/gift-cards-1.png" href="/store?category=gift-cards" />
      </div>

      {/* Popular Games Section */}
      <PopularPcGames />

      {/* Trust Signals Section */}
      <TrustSignals />

      <PopularConsoleGames />

      {/* Explore By Category Section */}
      <ExploreByTags />

      {/* Best Selling Gift Cards Section */}
      <PopularGiftCards />

      {/* Explore By Platform Section */}
      <ExploreByRegion />

      {/* Best Selling Subscriptions Section */}
      <PopularSubscriptions />
    </div>
  );
};
