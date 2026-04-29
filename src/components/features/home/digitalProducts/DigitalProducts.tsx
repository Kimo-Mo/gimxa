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
    <div className="flex flex-col gap-12 w-full pb-12">
      {/* Top Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:min-h-90">
        {/* Left Column - Hero Slider */}
        <div className="md:col-span-2 relative min-h-70 md:min-h-90 md:h-auto">
          <HeroSlider />
        </div>

        {/* Right Column - Two Banners */}
        <div className="flex flex-col gap-6 h-full">
          <BannerCard
            image="/subscription.jpg"
            buttonText="Subscriptions"
            href="/store?category=subscriptions"
          />
        </div>
      </div>

      {/* Quick Access Banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-45">
        <BannerCard image="/pc-games.jpg" buttonText="pc games" href="/store?category=pc-games" />
        <BannerCard
          image="/console-games.jpg"
          buttonText="console games"
          href="/store?category=console-games"
        />
        <BannerCard
          image="/gift-cards.jpg"
          buttonText="GIFT CARDS"
          href="/store?category=gift-cards"
        />
        <BannerCard image="/software.jpg" buttonText="software" href="/store?category=software" />
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
