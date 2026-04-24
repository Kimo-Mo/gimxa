import { BannerCard } from '@/components/features/home/digitalProducts/BannerCard';
import { TopupFilterTypes } from './TopUps';

interface CategoryBannersProps {
  onSelectCategory: (category: TopupFilterTypes) => void;
}

export const CategoryBanners = ({ onSelectCategory }: CategoryBannersProps) => {
  return (
    <div className="flex flex-col gap-6 h-full *:lg:h-37.5 *:h-70">
      <BannerCard
        image="/pc-games.jpg"
        buttonText="All Categories"
        onClick={() => onSelectCategory('all')}
      />
      <BannerCard
        image="/console-games.jpg"
        buttonText="Mobile Games"
        onClick={() => onSelectCategory('topup-mobile')}
      />
      <BannerCard
        image="/software.jpg"
        buttonText="Services"
        onClick={() => onSelectCategory('topup-service')}
      />
    </div>
  );
};
